import type { APIRoute } from 'astro';
import { isAdminAuthorized } from '../../../lib/adminAuth';
import {
  getApprovedAdminClubById,
  listApprovedAdminClubs,
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
