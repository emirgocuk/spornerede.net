import type { APIRoute } from 'astro';
import { isAdminAuthorized } from '../../../lib/adminAuth';
import { getMembershipPlans, updateMembershipPlan } from '../../../lib/repositories/applications';

export const prerender = false;

export const GET: APIRoute = async ({ request }) => {
  if (!(await isAdminAuthorized(request))) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401 });
  }
  const data = await getMembershipPlans();
  return new Response(JSON.stringify({ data }), {
    headers: { 'Content-Type': 'application/json' },
  });
};

export const PUT: APIRoute = async ({ request }) => {
  if (!(await isAdminAuthorized(request))) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401 });
  }
  const body = await request.json().catch(() => null);
  const legacyId = Number(body?.legacyId);
  if (!legacyId) {
    return new Response(JSON.stringify({ error: 'Invalid payload' }), { status: 400 });
  }
  const updated = await updateMembershipPlan(legacyId, {
    ad: body?.ad?.toString(),
    ucret: body?.ucret !== undefined ? Number(body.ucret) : undefined,
    aciklama: body?.aciklama?.toString(),
    aktif: body?.aktif !== undefined ? Boolean(body.aktif) : undefined,
  });
  if (!updated) {
    return new Response(JSON.stringify({ error: 'Plan not found' }), { status: 404 });
  }
  return new Response(JSON.stringify({ data: updated }), {
    headers: { 'Content-Type': 'application/json' },
  });
};
