import fs from 'node:fs/promises';
import path from 'node:path';
import { randomUUID } from 'node:crypto';
import type { APIRoute } from 'astro';
import { createApplicationDocument } from '../../lib/repositories/applicationDocuments';
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
const ALLOWED_RECEIPT_MIME_TYPES = new Set([
  'application/pdf',
  'image/jpeg',
  'image/png',
  'image/webp',
]);

function redirectToForm(request: Request, params: Record<string, string>) {
  const url = new URL('/basvuru', request.url);
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
      return redirectToForm(request, { error: 'missing' });
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return redirectToForm(request, { error: 'email' });
    }

    if (odemeOnay !== '1') {
      return redirectToForm(request, { error: 'payment' });
    }

    if (!(dekontFile instanceof File) || !dekontFile.name || dekontFile.size === 0) {
      return redirectToForm(request, { error: 'receipt' });
    }
    if (dekontFile.size > MAX_FILE_SIZE) {
      return redirectToForm(request, { error: 'receipt_size' });
    }
    if (!ALLOWED_RECEIPT_MIME_TYPES.has(dekontFile.type)) {
      return redirectToForm(request, { error: 'receipt_type' });
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

    const ownerEmail = process.env.MAIL_TO ?? import.meta.env.MAIL_TO;
    if (ownerEmail) {
      const template = buildApplicationNotificationMail({
        kulupad,
        brans,
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

    return Response.redirect(new URL('/basvuru?success=1', request.url), 303);
  } catch (err) {
    console.error('[/api/basvuru] Hata:', err);
    return redirectToForm(request, { error: 'server' });
  }
};
