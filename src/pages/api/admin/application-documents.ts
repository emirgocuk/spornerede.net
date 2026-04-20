import type { APIRoute } from 'astro';
import { isAdminAuthorized } from '../../../lib/adminAuth';
import {
  createApplicationDocument,
  listApplicationDocuments,
  type ApplicationDocumentKind,
} from '../../../lib/repositories/applicationDocuments';

const ALLOWED_KINDS: ApplicationDocumentKind[] = ['dekont', 'kimlik', 'sozlesme', 'diger'];

export const prerender = false;

export const GET: APIRoute = async ({ request }) => {
  if (!(await isAdminAuthorized(request))) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401 });
  }

  const url = new URL(request.url);
  const applicationId = Number(url.searchParams.get('applicationId'));
  if (!applicationId) {
    return new Response(JSON.stringify({ error: 'applicationId is required' }), { status: 400 });
  }

  const rows = await listApplicationDocuments(applicationId);
  return new Response(JSON.stringify({ data: rows }), {
    headers: { 'Content-Type': 'application/json' },
  });
};

export const POST: APIRoute = async ({ request }) => {
  if (!(await isAdminAuthorized(request))) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401 });
  }

  const body = await request.json().catch(() => null);
  const applicationId = Number(body?.applicationId);
  const kind = body?.kind as ApplicationDocumentKind;
  const storageKey = body?.storageKey?.toString() ?? '';
  const originalFilename = body?.originalFilename?.toString() ?? '';
  const mimeType = body?.mimeType?.toString() ?? 'application/octet-stream';
  const byteSize = Number(body?.byteSize ?? 0);

  if (!applicationId || !ALLOWED_KINDS.includes(kind) || !storageKey || !originalFilename) {
    return new Response(JSON.stringify({ error: 'Invalid payload' }), { status: 400 });
  }

  const row = await createApplicationDocument({
    applicationId,
    kind,
    storageKey,
    originalFilename,
    mimeType,
    byteSize: Number.isFinite(byteSize) ? byteSize : 0,
  });

  return new Response(JSON.stringify({ data: row }), {
    headers: { 'Content-Type': 'application/json' },
  });
};
