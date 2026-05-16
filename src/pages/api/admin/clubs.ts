import type { APIRoute } from 'astro';
import { validateProgramPayload } from '../../../lib/admin/validateProgramPayload';
import { isAdminAuthorized } from '../../../lib/adminAuth';
import {
  createAdminClubProgram,
  deleteAdminClubProgram,
  getApprovedAdminClubById,
  listApprovedAdminClubs,
  revokeApprovedAdminClub,
  updateAdminClubProgram,
  updateApprovedAdminClub,
  withdrawClubApproval,
} from '../../../lib/repositories/adminClubs';
import { normalizeMembershipPeriod } from '../../../lib/repositories/memberships';

export const prerender = false;

function programPayloadFromBody(body: Record<string, unknown> | null) {
  return {
    ad: body?.ad?.toString() ?? '',
    yasAraligi: body?.yasAraligi?.toString() ?? '',
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
  };
}

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

  if (body?.createProgram === true) {
    const payload = programPayloadFromBody(body);
    const validationError = validateProgramPayload(body, payload.ad);
    if (validationError) {
      return new Response(JSON.stringify({ error: validationError }), { status: 400 });
    }
    const created = await createAdminClubProgram(id, payload);
    if (!created) {
      return new Response(JSON.stringify({ error: 'Club not found' }), { status: 404 });
    }
    return new Response(JSON.stringify({ data: created }), {
      headers: { 'Content-Type': 'application/json' },
    });
  }

  const membershipPeriod = body?.membershipPeriod
    ? normalizeMembershipPeriod(body.membershipPeriod)
    : undefined;

  const updated = await updateApprovedAdminClub(id, {
    ad: body?.ad?.toString?.().slice(0, 160) ?? '',
    telefon: body?.telefon?.toString?.().slice(0, 30) ?? '',
    email: body?.email?.toString?.().slice(0, 180) ?? '',
    adres: body?.adres?.toString?.().slice(0, 5000) ?? '',
    aciklama: body?.aciklama?.toString?.().slice(0, 5000) ?? '',
    yasAraligi: body?.yasAraligi?.toString?.().slice(0, 50) ?? '',
    fiyatBilgisi: body?.fiyatBilgisi?.toString?.().slice(0, 120) ?? '',
    adminNotu: body?.adminNotu?.toString?.(),
    sorumluAdminEmail: body?.sorumluAdminEmail?.toString?.(),
    il: body?.il?.toString?.(),
    ilce: body?.ilce?.toString?.(),
    membershipPeriod,
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
  const payload = programPayloadFromBody(body);
  const validationError = validateProgramPayload(body, payload.ad);

  if (!clubId || !programId || validationError) {
    return new Response(JSON.stringify({ error: validationError || 'Invalid payload' }), { status: 400 });
  }

  const updated = await updateAdminClubProgram(clubId, programId, payload);

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
  const withdrawApproval = body?.withdrawApproval === true;

  if (withdrawApproval) {
    if (!clubId) {
      return new Response(JSON.stringify({ error: 'Invalid payload' }), { status: 400 });
    }
    const withdrawn = await withdrawClubApproval(clubId, body?.adminNote?.toString?.());
    if (!withdrawn) {
      return new Response(JSON.stringify({ error: 'Club not found' }), { status: 404 });
    }
    return new Response(JSON.stringify({ data: withdrawn }), {
      headers: { 'Content-Type': 'application/json' },
    });
  }

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
