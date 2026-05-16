import type { APIRoute } from 'astro';
import { isAdminAuthorized } from '../../../lib/adminAuth';
import {
  deleteAdminClubProgram,
  getApprovedAdminClubById,
  listApprovedAdminClubs,
  revokeApprovedAdminClub,
  updateAdminClubProgram,
  updateApprovedAdminClub,
} from '../../../lib/repositories/adminClubs';

export const prerender = false;

export const GET: APIRoute = async ({ request }) => {
  if (!(await isAdminAuthorized(request))) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401 });
  }

  const url = new URL(request.url);
  const id = Number(url.searchParams.get('id'));
  if (id) {
    const club = await getApprovedAdminClubById(id);
    if (!club) {
      return new Response(JSON.stringify({ error: 'Club not found' }), { status: 404 });
    }
    return new Response(JSON.stringify({ data: club }), {
      headers: { 'Content-Type': 'application/json' },
    });
  }

  const clubs = await listApprovedAdminClubs();
  return new Response(JSON.stringify({ data: clubs }), {
    headers: { 'Content-Type': 'application/json' },
  });
};

export const POST: APIRoute = async ({ request }) => {
  if (!(await isAdminAuthorized(request))) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401 });
  }

  const body = await request.json().catch(() => null);
  const id = Number(body?.id);
  if (!id) {
    return new Response(JSON.stringify({ error: 'Invalid payload' }), { status: 400 });
  }

  const updated = await updateApprovedAdminClub(id, {
    ad: body?.ad?.toString?.().slice(0, 160) ?? '',
    telefon: body?.telefon?.toString?.().slice(0, 30) ?? '',
    email: body?.email?.toString?.().slice(0, 180) ?? '',
    adres: body?.adres?.toString?.().slice(0, 5000) ?? '',
    aciklama: body?.aciklama?.toString?.().slice(0, 5000) ?? '',
    yasAraligi: body?.yasAraligi?.toString?.().slice(0, 50) ?? '',
    fiyatBilgisi: body?.fiyatBilgisi?.toString?.().slice(0, 120) ?? '',
  });

  if (!updated) {
    return new Response(JSON.stringify({ error: 'Club not found' }), { status: 404 });
  }

  return new Response(JSON.stringify({ data: updated }), {
    headers: { 'Content-Type': 'application/json' },
  });
};

export const PUT: APIRoute = async ({ request }) => {
  if (!(await isAdminAuthorized(request))) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401 });
  }

  const body = await request.json().catch(() => null);
  const clubId = Number(body?.clubId);
  const programId = Number(body?.programId);
  const ad = body?.ad?.toString?.() ?? '';

  if (!clubId || !programId || !ad.trim()) {
    return new Response(JSON.stringify({ error: 'Invalid payload' }), { status: 400 });
  }

  const updated = await updateAdminClubProgram(clubId, programId, {
    ad: ad.slice(0, 180),
    aciklama: body?.aciklama?.toString?.().slice(0, 5000) ?? '',
    gunSaat: body?.gunSaat?.toString?.().slice(0, 160) ?? '',
    seviye: body?.seviye?.toString?.().slice(0, 120) ?? '',
    ucretBilgisi: body?.ucretBilgisi?.toString?.().slice(0, 120) ?? '',
    aktif: Boolean(body?.aktif),
  });

  if (!updated) {
    return new Response(JSON.stringify({ error: 'Program not found' }), { status: 404 });
  }

  return new Response(JSON.stringify({ data: updated }), {
    headers: { 'Content-Type': 'application/json' },
  });
};

export const DELETE: APIRoute = async ({ request }) => {
  if (!(await isAdminAuthorized(request))) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401 });
  }

  const body = await request.json().catch(() => null);
  const clubId = Number(body?.clubId);
  const programId = Number(body?.programId);
  const revokeClub = body?.revokeClub === true;

  if (revokeClub) {
    if (!clubId) {
      return new Response(JSON.stringify({ error: 'Invalid payload' }), { status: 400 });
    }
    const revoked = await revokeApprovedAdminClub(clubId, body?.adminNote?.toString?.());
    if (!revoked) {
      return new Response(JSON.stringify({ error: 'Club not found' }), { status: 404 });
    }
    return new Response(JSON.stringify({ data: revoked }), {
      headers: { 'Content-Type': 'application/json' },
    });
  }

  if (!clubId || !programId) {
    return new Response(JSON.stringify({ error: 'Invalid payload' }), { status: 400 });
  }

  const ok = await deleteAdminClubProgram(clubId, programId);
  if (!ok) {
    return new Response(JSON.stringify({ error: 'Program not found' }), { status: 404 });
  }

  return new Response(JSON.stringify({ ok: true }), {
    headers: { 'Content-Type': 'application/json' },
  });
};
