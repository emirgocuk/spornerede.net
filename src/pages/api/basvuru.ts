import fs from 'node:fs/promises';
import path from 'node:path';
import { randomUUID } from 'node:crypto';
import type { APIRoute } from 'astro';
import { createApplicationDocument } from '../../lib/repositories/applicationDocuments';
import type { BasvuruIlanInput } from '../../lib/repositories/applicationPrograms';
import { createClubApplication } from '../../lib/repositories/applications';
import { enqueueMail, processMailQueue } from '../../lib/mail/service';
import { buildApplicationNotificationMail } from '../../lib/mail/templates';

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
function getAppOrigin(request: Request) {
  const forwardedHost = request.headers.get('x-forwarded-host')?.split(',')[0]?.trim();
  if (forwardedHost) {
    const forwardedProto = request.headers.get('x-forwarded-proto')?.split(',')[0]?.trim() || 'https';
    return `${forwardedProto}://${forwardedHost}`;
  }

  const configuredSiteUrl = process.env.SITE_URL ?? import.meta.env.SITE_URL;
  return configuredSiteUrl ? new URL(configuredSiteUrl).origin : new URL(request.url).origin;
}

function redirectToForm(request: Request, params: Record<string, string>) {
  const url = new URL('/basvuru', getAppOrigin(request));
  for (const [key, value] of Object.entries(params)) {
    url.searchParams.set(key, value);
  }
  return Response.redirect(url, 303);
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
    const formData = await request.formData();

    const kulupad = formData.get('kulupad')?.toString().trim() || '';
    const il = formData.get('il')?.toString().trim() || '';
    const ilce = formData.get('ilce')?.toString().trim() || '';
    const adres = formData.get('adres')?.toString().trim() || '';
    const fiyat = formData.get('fiyat')?.toString().trim() || '';
    const aciklama = formData.get('aciklama')?.toString().trim() || '';
    const yetkili = formData.get('yetkili')?.toString().trim() || '';
    const telefon = formData.get('telefon')?.toString().trim() || '';
    const email = formData.get('email')?.toString().trim() || '';
    const paket = formData.get('paket')?.toString().trim() || '';
    const odemeOnay = formData.get('odemeOnay')?.toString().trim() || '';
    const bransSayisiRaw = Number(formData.get('bransSayisi')?.toString().trim() || '1');
    const bransSayisi = Number.isFinite(bransSayisiRaw) ? Math.max(1, Math.floor(bransSayisiRaw)) : 1;
    const ilanlar = parseIlanlarFromFormData(formData, bransSayisi);

    if (!kulupad || !il || !ilce || !paket || !yetkili || !telefon) {
      return redirectToForm(request, { error: 'missing' });
    }

    if (ilanlar.length !== bransSayisi) {
      return redirectToForm(request, { error: 'missing' });
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (email && !emailRegex.test(email)) {
      return redirectToForm(request, { error: 'email' });
    }

    if (odemeOnay !== '1') {
      return redirectToForm(request, { error: 'payment' });
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

      const safeName = sanitizeFilename(file.name);
      const diskFilename = `${Date.now()}-${randomUUID()}-${safeName}`;
      const diskPath = path.join(uploadRoot, diskFilename);
      const bytes = Buffer.from(await file.arrayBuffer());
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
      await enqueueMail({
        kind: 'application_notification',
        toEmail: ownerEmail,
        subject: template.subject,
        html: template.html,
        replyTo: email,
      });
      await processMailQueue(3).catch(() => undefined);
    }

    return Response.redirect(new URL('/basvuru?success=1', getAppOrigin(request)), 303);
  } catch (err) {
    console.error('[/api/basvuru] Hata:', err);
    return redirectToForm(request, { error: 'server' });
  }
};
