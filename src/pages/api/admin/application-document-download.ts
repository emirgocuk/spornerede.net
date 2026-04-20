import fs from 'node:fs/promises';
import path from 'node:path';
import type { APIRoute } from 'astro';
import { isAdminAuthorized } from '../../../lib/adminAuth';
import { getApplicationDocumentById } from '../../../lib/repositories/applicationDocuments';

export const prerender = false;

function sanitizeDownloadFilename(name: string) {
  return name.replace(/[\r\n"]/g, '_');
}

export const GET: APIRoute = async ({ request }) => {
  if (!(await isAdminAuthorized(request))) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401 });
  }

  const url = new URL(request.url);
  const documentId = Number(url.searchParams.get('documentId'));
  if (!documentId) {
    return new Response(JSON.stringify({ error: 'documentId is required' }), { status: 400 });
  }

  const doc = await getApplicationDocumentById(documentId);
  if (!doc) {
    return new Response(JSON.stringify({ error: 'Document not found' }), { status: 404 });
  }

  const uploadsRoot = path.resolve(process.cwd(), 'uploads');
  const diskPath = path.resolve(uploadsRoot, doc.storageKey);
  const rootPrefix = `${uploadsRoot}${path.sep}`;
  if (!diskPath.startsWith(rootPrefix)) {
    return new Response(JSON.stringify({ error: 'Invalid storage key' }), { status: 400 });
  }

  try {
    const data = await fs.readFile(diskPath);
    const filename = sanitizeDownloadFilename(doc.originalFilename || `document-${doc.id}`);
    return new Response(data, {
      headers: {
        'Content-Type': doc.mimeType || 'application/octet-stream',
        'Content-Length': String(data.byteLength),
        'Content-Disposition': `attachment; filename="${filename}"`,
      },
    });
  } catch {
    return new Response(JSON.stringify({ error: 'File not found on disk' }), { status: 404 });
  }
};
