import fs from 'node:fs/promises';
import path from 'node:path';
import { randomUUID } from 'node:crypto';
import type { APIRoute } from 'astro';
import { isAdminAuthorized } from '../../../lib/adminAuth';
import { createApplicationDocument } from '../../../lib/repositories/applicationDocuments';

export const prerender = false;

const MAX_FILE_SIZE = 10 * 1024 * 1024;

function sanitizeFilename(input: string) {
  return input.replace(/[^a-zA-Z0-9._-]/g, '_').slice(0, 120) || 'dekont.pdf';
}

export const POST: APIRoute = async ({ request }) => {
  if (!(await isAdminAuthorized(request))) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401 });
  }

  const formData = await request.formData().catch(() => null);
  const applicationId = Number(formData?.get('applicationId')?.toString() || '0');
  const file = formData?.get('document');

  if (!applicationId || !(file instanceof File) || !file.name || file.size === 0) {
    return new Response(JSON.stringify({ error: 'Geçerli bir başvuru ve PDF dosyası gereklidir.' }), { status: 400 });
  }
  if (file.size > MAX_FILE_SIZE) {
    return new Response(JSON.stringify({ error: 'Dosya boyutu en fazla 10 MB olabilir.' }), { status: 400 });
  }

  const normalizedName = file.name.toLowerCase();
  const looksLikePdf = file.type === 'application/pdf' || normalizedName.endsWith('.pdf');
  if (!looksLikePdf) {
    return new Response(JSON.stringify({ error: 'Yalnızca PDF dekont yükleyebilirsiniz.' }), { status: 400 });
  }

  const uploadRoot = path.resolve(process.cwd(), 'uploads', 'applications', String(applicationId));
  await fs.mkdir(uploadRoot, { recursive: true });

  const safeName = sanitizeFilename(file.name);
  const diskFilename = `${Date.now()}-${randomUUID()}-${safeName}`;
  const diskPath = path.join(uploadRoot, diskFilename);
  const bytes = Buffer.from(await file.arrayBuffer());
  await fs.writeFile(diskPath, bytes);

  const row = await createApplicationDocument({
    applicationId,
    kind: 'dekont',
    storageKey: `applications/${applicationId}/${diskFilename}`,
    originalFilename: file.name,
    mimeType: 'application/pdf',
    byteSize: file.size,
  });

  return new Response(JSON.stringify({ data: row }), {
    headers: { 'Content-Type': 'application/json' },
  });
};
