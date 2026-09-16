import fs from 'node:fs/promises';
import path from 'node:path';
import { randomUUID } from 'node:crypto';
import type { APIRoute } from 'astro';
import { createApplicationDocument } from '../../lib/repositories/applicationDocuments';
import type { BasvuruIlanInput } from '../../lib/repositories/applicationPrograms';
import { createClubApplication } from '../../lib/repositories/applications';
import { enqueueMail, processMailQueue } from '../../lib/mail/service';
import { buildApplicationNotificationMail } from '../../lib/mail/templates';
import { getClientIp, checkRateLimit } from '../../lib/security/rateLimiter';
import { isValidDocumentSignature } from '../../lib/security/fileValidation';

export const prerender = false;

const MAX_FILE_SIZE = 10 * 1024 * 1024;
const ALLOWED_MIME_TYPES = new Set([
  'application/pdf',
  'image/jpeg',
  'image/png',
  'image/webp',
  'application/zip',
  'application/x-zip-compressed',
]);

const BASVURU_RATE_LIMIT = {
  max: 15,
  windowSeconds: 900, // 15 dakika
  blockSeconds: 1800, // 30 dakika
};

function getAppOrigin(request: Request) {
  const forwardedHost = request.headers.get('x-forwarded-host')?.split(',')[0]?.trim();
  if (forwardedHost) {
    const forwardedProto = request.headers.get('x-forwarded-proto')?.split(',')[0]?.trim() || 'https';
    return `${forwardedProto}://${forwardedHost}`;
  }

  const hostHeader = request.headers.get('host')?.split(',')[0]?.trim();
  if (hostHeader) {
    const proto = request.url.startsWith('https') ? 'https' : 'http';
    return `${proto}://${hostHeader}`;
  }

  const configuredSiteUrl = process.env.SITE_URL ?? import.meta.env.SITE_URL;
  return configuredSiteUrl ? new URL(configuredSiteUrl).origin : new URL(request.url).origin;
}

function wantsJson(request: Request): boolean {
  const accept = request.headers.get('accept') || '';
  const xRequestedWith = request.headers.get('x-requested-with') || '';
  return accept.includes('application/json') || xRequestedWith.toLowerCase() === 'xmlhttprequest';
}

function createApiResponse(
  request: Request,
  status: number,
  data: { success: boolean; error?: string; message?: string }
) {
  if (wantsJson(request)) {
    return new Response(JSON.stringify(data), {
      status,
      headers: {
        'Content-Type': 'application/json; charset=utf-8',
        'Cache-Control': 'no-store',
      },
    });
  }

  const url = new URL('/basvuru', getAppOrigin(request));
  if (data.success) {
    url.searchParams.set('success', '1');
  } else if (data.error) {
    url.searchParams.set('error', data.error);
  }
  return new Response(null, {
    status: 303,
    headers: {
      Location: url.toString(),
      'Cache-Control': 'no-store',
    },
  });
}

function sanitizeFilename(input: string) {
  return input.replace(/[^a-zA-Z0-9._-]/g, '_').slice(0, 120) || 'dosya';
}

function detectDocumentKind(name: string) {
  const lowered = name.toLowerCase();
  if (lowered.includes('dekont')) return 'dekont' as const;
  if (lowered.includes('kimlik')) return 'kimlik' as const;
  if (lowered.includes('sozlesme') || lowered.includes('sozleşme')) return 'sozlesme' as const;
  return 'diger' as const;
}

function buildClubYasAraligiFromIlanlar(ilanlar: BasvuruIlanInput[]) {
  const unique = [...new Set(ilanlar.map((item) => item.yasAraligi?.trim()).filter(Boolean))] as string[];
  return unique.join(' · ').slice(0, 50);
}

function parseIlanlarFromFormData(formData: FormData, branchCount: number): BasvuruIlanInput[] {
  const ilanlar: BasvuruIlanInput[] = [];
  for (let i = 0; i < branchCount; i++) {
    const brans = formData.get(`ilan_${i}_brans`)?.toString().trim() || '';
    const yasAraligi = formData.get(`ilan_${i}_yasAraligi`)?.toString().trim() || '';
    const aidatBilgisi = formData.get(`ilan_${i}_aidat`)?.toString().trim() || '';
    if (!brans) continue;
    ilanlar.push({
      brans,
      ...(yasAraligi ? { yasAraligi } : {}),
      ...(aidatBilgisi ? { aidatBilgisi } : {}),
    });
  }
  return ilanlar;
}

export const POST: APIRoute = async ({ request }) => {
  try {
    const clientIp = getClientIp(request);

    // Mobil CGNAT / ortak IP dostu esnek hız sınırı (15 dakikada en fazla 15 başvuru)
    const rateCheck = checkRateLimit(`basvuru:${clientIp}`, BASVURU_RATE_LIMIT);
    if (!rateCheck.allowed) {
      console.warn(`[rate-limit] Basvuru rate limit exceeded from IP: ${clientIp}`);
      return createApiResponse(request, 429, {
        success: false,
        error: 'rate_limit',
        message: 'Çok fazla istek gönderildi. Lütfen 15 dakika sonra tekrar deneyin.',
      });
    }

    let formData: FormData;
    try {
      formData = await request.formData();
    } catch {
      return createApiResponse(request, 400, {
        success: false,
        error: 'missing',
        message: 'Lütfen formu eksiksiz doldurun.',
      });
    }

    // Süre bazlı bot koruması (Time-based token):
    // İnsanın formu doldurması en az 4-15 saniye sürer.
    // Otomatik botlar formu 1-2 saniyenin altında gönderir.
    // Tarayıcı autofill'i süreyi etkilemez; gerçek kullanıcılar asla engellenmez.
    const tsRaw = Number(formData.get('_ts')?.toString().trim());
    const now = Date.now();
    const elapsedMs = now - tsRaw;
    if (!Number.isFinite(tsRaw) || tsRaw > now + 60_000 || elapsedMs < 2500) {
      console.warn(`[bot-defense] Blocked fast automated or invalid submission to /api/basvuru from IP: ${clientIp}, elapsed: ${elapsedMs}ms`);
      return createApiResponse(request, 400, {
        success: false,
        error: 'bot_detected',
        message: 'Lütfen formu inceleyip tekrar gönderin.',
      });
    }

    const kulupad = formData.get('kulupad')?.toString().trim() || '';
    const il = formData.get('il')?.toString().trim() || '';
    const ilce = formData.get('ilce')?.toString().trim() || '';
    const adres = formData.get('adres')?.toString().trim() || '';
    const fiyat = formData.get('fiyat')?.toString().trim() || '';
    const aciklama = formData.get('aciklama')?.toString().trim() || '';
    const yetkili = formData.get('yetkili')?.toString().trim() || '';
    const telefon = formData.get('telefon')?.toString().trim() || '';
    const email = formData.get('email')?.toString().trim() || '';
    const paket = formData.get('paket')?.toString().trim() || 'ucretsiz';
    const bransSayisiRaw = Number(formData.get('bransSayisi')?.toString().trim() || '1');
    const bransSayisi = Number.isFinite(bransSayisiRaw) ? Math.max(1, Math.min(1, Math.floor(bransSayisiRaw))) : 1;
    const ilanlar = parseIlanlarFromFormData(formData, bransSayisi);

    if (!kulupad || !il || !ilce || !yetkili || !telefon) {
      return createApiResponse(request, 400, {
        success: false,
        error: 'missing',
        message: 'Lütfen zorunlu alanları eksiksiz doldurun.',
      });
    }

    if (ilanlar.length !== bransSayisi) {
      return createApiResponse(request, 400, {
        success: false,
        error: 'missing',
        message: 'Lütfen seçtiğiniz branş bilgilerini doldurun.',
      });
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (email && !emailRegex.test(email)) {
      return createApiResponse(request, 400, {
        success: false,
        error: 'email',
        message: 'Lütfen geçerli bir e-posta adresi yazın.',
      });
    }

    const applicationResult = await createClubApplication({
      kulupad,
      il,
      ilce,
      adres,
      yasaraligi: buildClubYasAraligiFromIlanlar(ilanlar),
      fiyat,
      aciklama,
      yetkili,
      telefon,
      email,
      paket,
      bransSayisi,
      ilanlar,
    });

    const uploadRoot = path.resolve(process.cwd(), 'uploads', 'applications', String(applicationResult.id));
    await fs.mkdir(uploadRoot, { recursive: true });

    const files = formData.getAll('documents').filter((value): value is File => value instanceof File);
    for (const file of files) {
      if (!file.name || file.size === 0) continue;
      if (file.size > MAX_FILE_SIZE) continue;
      if (!ALLOWED_MIME_TYPES.has(file.type)) continue;

      const bytes = Buffer.from(await file.arrayBuffer());
      if (!isValidDocumentSignature(bytes)) {
        continue;
      }

      const safeName = sanitizeFilename(file.name);
      const diskFilename = `${Date.now()}-${randomUUID()}-${safeName}`;
      const diskPath = path.join(uploadRoot, diskFilename);
      await fs.writeFile(diskPath, bytes);

      await createApplicationDocument({
        applicationId: applicationResult.id,
        kind: detectDocumentKind(file.name),
        storageKey: `applications/${applicationResult.id}/${diskFilename}`,
        originalFilename: file.name,
        mimeType: file.type || 'application/octet-stream',
        byteSize: file.size,
      });
    }

    const ownerEmail = process.env.MAIL_TO ?? import.meta.env.MAIL_TO;
    if (ownerEmail) {
      const bransOzet = ilanlar.map((item, idx) => `${idx + 1}. ${item.brans}`).join('; ');
      const template = buildApplicationNotificationMail({
        kulupad,
        brans: bransOzet,
        il,
        ilce,
        yetkili,
        telefon,
        email,
        paket,
        aciklama,
      });

      // E-posta kuyruğa atılır; istemci yanıtını geciktirmemek için arka planda işlenir.
      enqueueMail({
        kind: 'application_notification',
        toEmail: ownerEmail,
        subject: template.subject,
        html: template.html,
        replyTo: email,
      })
        .then(() => processMailQueue(3))
        .catch((mailErr) => {
          console.error('[/api/basvuru] E-posta bildirim hatası (arka plan):', mailErr);
        });
    }

    console.log(`[/api/basvuru] Yeni başvuru alındı: ID=${applicationResult.id}, Kulüp="${kulupad}", IP=${clientIp}`);

    return createApiResponse(request, 200, {
      success: true,
      message: 'Başvurunuz başarıyla alındı.',
    });
  } catch (err) {
    console.error('[/api/basvuru] Hata:', err);
    return createApiResponse(request, 500, {
      success: false,
      error: 'server',
      message: 'Başvuru kaydedilirken bir hata oluştu. Lütfen tekrar deneyin.',
    });
  }
};
