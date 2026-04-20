import type { APIRoute } from 'astro';
import { requirePanelClubAccess } from '../../../lib/auth/guards';
import {
  createPanelProgram,
  deletePanelProgram,
  listPanelPrograms,
  updatePanelProgram,
} from '../../../lib/repositories/panelPrograms';

export const prerender = false;

export const GET: APIRoute = async ({ request }) => {
  const guard = await requirePanelClubAccess(request);
  if (!guard.ok) {
    return guard.response;
  }
  const rows = await listPanelPrograms(guard.session.userId);
  return new Response(JSON.stringify({ data: rows }), {
    headers: { 'Content-Type': 'application/json' },
  });
};

export const POST: APIRoute = async ({ request }) => {
  const guard = await requirePanelClubAccess(request);
  if (!guard.ok) {
    return guard.response;
  }

  const body = await request.json().catch(() => null);
  const ad = body?.ad?.toString() ?? '';
  if (!ad.trim()) {
    return new Response(JSON.stringify({ error: 'Program adi zorunlu' }), { status: 400 });
  }

  const row = await createPanelProgram(guard.session.userId, {
    ad,
    aciklama: body?.aciklama?.toString() ?? '',
    gunSaat: body?.gunSaat?.toString() ?? '',
    seviye: body?.seviye?.toString() ?? '',
    ucretBilgisi: body?.ucretBilgisi?.toString() ?? '',
    aktif: Boolean(body?.aktif ?? true),
  });

  return new Response(JSON.stringify({ data: row }), {
    headers: { 'Content-Type': 'application/json' },
  });
};

export const PUT: APIRoute = async ({ request }) => {
  const guard = await requirePanelClubAccess(request);
  if (!guard.ok) {
    return guard.response;
  }

  const body = await request.json().catch(() => null);
  const id = Number(body?.id);
  const ad = body?.ad?.toString() ?? '';
  if (!id || !ad.trim()) {
    return new Response(JSON.stringify({ error: 'Invalid payload' }), { status: 400 });
  }

  const row = await updatePanelProgram(guard.session.userId, id, {
    ad,
    aciklama: body?.aciklama?.toString() ?? '',
    gunSaat: body?.gunSaat?.toString() ?? '',
    seviye: body?.seviye?.toString() ?? '',
    ucretBilgisi: body?.ucretBilgisi?.toString() ?? '',
    aktif: Boolean(body?.aktif ?? true),
  });

  if (!row) {
    return new Response(JSON.stringify({ error: 'Program not found' }), { status: 404 });
  }

  return new Response(JSON.stringify({ data: row }), {
    headers: { 'Content-Type': 'application/json' },
  });
};

export const DELETE: APIRoute = async ({ request }) => {
  const guard = await requirePanelClubAccess(request);
  if (!guard.ok) {
    return guard.response;
  }

  const body = await request.json().catch(() => null);
  const id = Number(body?.id);
  if (!id) {
    return new Response(JSON.stringify({ error: 'Program id zorunlu' }), { status: 400 });
  }

  const ok = await deletePanelProgram(guard.session.userId, id);
  if (!ok) {
    return new Response(JSON.stringify({ error: 'Program not found' }), { status: 404 });
  }
  return new Response(JSON.stringify({ ok: true }), {
    headers: { 'Content-Type': 'application/json' },
  });
};
