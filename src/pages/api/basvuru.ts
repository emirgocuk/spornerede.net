import fs from 'node:fs/promises';
import path from 'node:path';
import { randomUUID } from 'node:crypto';
import type { APIRoute } from 'astro';
import { createApplicationDocument } from '../../lib/repositories/applicationDocuments';
import { createClubApplication } from '../../lib/repositories/applications';

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
const ALLOWED_RECEIPT_MIME_TYPES = new Set([
  'application/pdf',
  'image/jpeg',
  'image/png',
  'image/webp',
]);

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

export const POST: APIRoute = async ({ request }) => {
  try {
    const formData = await request.formData();

    const kulupad = formData.get('kulupad')?.toString().trim() || '';
    const il = formData.get('il')?.toString().trim() || '';
    const ilce = formData.get('ilce')?.toString().trim() || '';
    const brans = formData.get('brans')?.toString().trim() || '';
    const paket = formData.get('paket')?.toString().trim() || '';
    const adres = formData.get('adres')?.toString().trim() || '';
    const yasaraligi = formData.get('yasaraligi')?.toString().trim() || '';
    const fiyat = formData.get('fiyat')?.toString().trim() || '';
    const aciklama = formData.get('aciklama')?.toString().trim() || '';
    const yetkili = formData.get('yetkili')?.toString().trim() || '';
    const telefon = formData.get('telefon')?.toString().trim() || '';
    const email = formData.get('email')?.toString().trim() || '';
    const odemeOnay = formData.get('odemeOnay')?.toString().trim() || '';
    const dekontFile = formData.get('dekont');

    if (!kulupad || !il || !ilce || !brans || !paket || !yetkili || !telefon || !email) {
      return new Response(JSON.stringify({ success: false, error: 'Zorunlu alanlar eksik.' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return new Response(JSON.stringify({ success: false, error: 'Geçersiz e-posta adresi.' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    if (odemeOnay !== '1') {
      return new Response(JSON.stringify({ success: false, error: 'Başvuru için ödeme onayı zorunludur.' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    if (!(dekontFile instanceof File) || !dekontFile.name || dekontFile.size === 0) {
      return new Response(JSON.stringify({ success: false, error: 'Dekont dosyası zorunludur.' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }
    if (dekontFile.size > MAX_FILE_SIZE) {
      return new Response(JSON.stringify({ success: false, error: 'Dekont dosyası 10MB sınırını aşıyor.' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }
    if (!ALLOWED_RECEIPT_MIME_TYPES.has(dekontFile.type)) {
      return new Response(JSON.stringify({ success: false, error: 'Dekont için yalnızca PDF/JPG/PNG/WEBP kabul edilir.' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const applicationResult = await createClubApplication({
      kulupad,
      il,
      ilce,
      brans,
      adres,
      yasaraligi,
      fiyat,
      aciklama,
      yetkili,
      telefon,
      email,
      paket,
    });

    const uploadRoot = path.resolve(process.cwd(), 'uploads', 'applications', String(applicationResult.id));
    await fs.mkdir(uploadRoot, { recursive: true });

    const dekontSafeName = sanitizeFilename(dekontFile.name);
    const dekontDiskFilename = `${Date.now()}-${randomUUID()}-${dekontSafeName}`;
    const dekontDiskPath = path.join(uploadRoot, dekontDiskFilename);
    const dekontBytes = Buffer.from(await dekontFile.arrayBuffer());
    await fs.writeFile(dekontDiskPath, dekontBytes);
    await createApplicationDocument({
      applicationId: applicationResult.id,
      kind: 'dekont',
      storageKey: `applications/${applicationResult.id}/${dekontDiskFilename}`,
      originalFilename: dekontFile.name,
      mimeType: dekontFile.type || 'application/octet-stream',
      byteSize: dekontFile.size,
    });

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

    const nodemailer = await import('nodemailer');
    const transporter = nodemailer.default.createTransport({
      host: import.meta.env.SMTP_HOST,
      port: Number(import.meta.env.SMTP_PORT ?? 587),
      secure: import.meta.env.SMTP_PORT === '465',
      auth: {
        user: import.meta.env.SMTP_USER,
        pass: import.meta.env.SMTP_PASS,
      },
    });

    const mailHtml = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #f8f9fa; padding: 24px; border-radius: 12px;">
        <div style="background: #E30A17; color: white; padding: 16px 20px; border-radius: 8px;">
          <h1 style="margin:0; font-size:1.2rem;">Yeni Kulüp Başvurusu</h1>
          <p style="margin:6px 0 0; opacity:0.9;">${kulupad} - ${brans} (${il}/${ilce})</p>
        </div>
        <div style="background: white; padding: 18px 20px; border: 1px solid #e9ecef; border-radius: 8px; margin-top: 12px;">
          <p><strong>Yetkili:</strong> ${yetkili}</p>
          <p><strong>Telefon:</strong> ${telefon}</p>
          <p><strong>E-posta:</strong> ${email}</p>
          <p><strong>Paket:</strong> ${paket}</p>
          <p><strong>Ödeme Modeli:</strong> Havale/EFT (dekont yüklendi)</p>
          ${aciklama ? `<p><strong>Açıklama:</strong> ${aciklama}</p>` : ''}
        </div>
      </div>
    `;

    await transporter.sendMail({
      from: `"SporNerede.net Başvuru" <${import.meta.env.SMTP_USER}>`,
      to: import.meta.env.MAIL_TO,
      subject: `Yeni Kulup Basvurusu: ${kulupad} - ${brans} (${il}/${ilce})`,
      html: mailHtml,
      replyTo: email,
    });

    return Response.redirect(new URL('/basvuru?success=1', request.url), 303);
  } catch (err) {
    console.error('[/api/basvuru] Hata:', err);
    return new Response(
      JSON.stringify({ success: false, error: 'Sunucu hatası. Lütfen tekrar deneyin.' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
};
