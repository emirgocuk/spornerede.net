import type { APIRoute } from 'astro';
import { requirePanelClubAccess } from '../../../lib/auth/guards';
import {
  createPanelProgram,
  deletePanelProgram,
  listPanelPrograms,
  updatePanelProgram,
} from '../../../lib/repositories/panelPrograms';

export const prerender = false;

function validateProgramPayload(body: Record<string, unknown> | null, ad: string) {
  const days = Array.isArray(body?.days) ? body.days : [];
  const gallery = Array.isArray(body?.gallery) ? body.gallery : [];
  if (!ad.trim()) return 'Program adi zorunlu';
  if (!body?.seviye?.toString?.().trim()) return 'Seviye zorunlu';
  if (!body?.ucretBilgisi?.toString?.().trim()) return 'Ucret bilgisi zorunlu';
  if (!days.length) return 'En az bir gun secilmelidir';
  if (!body?.startTime?.toString?.().trim() || !body?.endTime?.toString?.().trim()) return 'Saat araligi zorunlu';
  if (!body?.eventDate?.toString?.().trim()) return 'Baslangic tarihi zorunlu';
  if (!body?.isOngoing && !body?.endDate?.toString?.().trim()) return 'Bitis tarihi zorunlu';
  if (!body?.locationText?.toString?.().trim()) return 'Konum bilgisi zorunlu';
  if (!body?.mapsUrl?.toString?.().trim()) return 'Google Maps baglantisi zorunlu';
  if (!body?.aciklama?.toString?.().trim()) return 'Kisa ozet zorunlu';
  if (gallery.length < 3) return 'En az 3 galeri gorseli zorunlu';
  return '';
}

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
  const validationError = validateProgramPayload(body, ad);
  if (validationError) {
    return new Response(JSON.stringify({ error: validationError }), { status: 400 });
  }

  const row = await createPanelProgram(guard.session.userId, {
    ad,
    aciklama: body?.aciklama?.toString() ?? '',
    gunSaat: body?.gunSaat?.toString() ?? '',
    seviye: body?.seviye?.toString() ?? '',
    ucretBilgisi: body?.ucretBilgisi?.toString() ?? '',
    aktif: Boolean(body?.aktif ?? true),
    eventDate: body?.eventDate?.toString() ?? '',
    endDate: body?.endDate?.toString() ?? '',
    isOngoing: Boolean(body?.isOngoing),
    days: Array.isArray(body?.days) ? body.days.map((item: unknown) => String(item)) : [],
    startTime: body?.startTime?.toString() ?? '',
    endTime: body?.endTime?.toString() ?? '',
    locationText: body?.locationText?.toString() ?? '',
    mapsUrl: body?.mapsUrl?.toString() ?? '',
    gallery: Array.isArray(body?.gallery) ? body.gallery.map((item: unknown) => String(item)) : [],
    bodyJson: body?.bodyJson ?? null,
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
  const validationError = validateProgramPayload(body, ad);
  if (!id || validationError) {
    return new Response(JSON.stringify({ error: 'Invalid payload' }), { status: 400 });
  }

  const row = await updatePanelProgram(guard.session.userId, id, {
    ad,
    aciklama: body?.aciklama?.toString() ?? '',
    gunSaat: body?.gunSaat?.toString() ?? '',
    seviye: body?.seviye?.toString() ?? '',
    ucretBilgisi: body?.ucretBilgisi?.toString() ?? '',
    aktif: Boolean(body?.aktif ?? true),
    eventDate: body?.eventDate?.toString() ?? '',
    endDate: body?.endDate?.toString() ?? '',
    isOngoing: Boolean(body?.isOngoing),
    days: Array.isArray(body?.days) ? body.days.map((item: unknown) => String(item)) : [],
    startTime: body?.startTime?.toString() ?? '',
    endTime: body?.endTime?.toString() ?? '',
    locationText: body?.locationText?.toString() ?? '',
    mapsUrl: body?.mapsUrl?.toString() ?? '',
    gallery: Array.isArray(body?.gallery) ? body.gallery.map((item: unknown) => String(item)) : [],
    bodyJson: body?.bodyJson ?? null,
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
