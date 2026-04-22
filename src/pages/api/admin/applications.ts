import type { APIRoute } from 'astro';
import { isAdminAuthorized } from '../../../lib/adminAuth';
import {
  getAdminApplicationById,
  listAdminApplicationLogs,
  listAdminApplications,
  updateApplicationStatus,
} from '../../../lib/repositories/applications';
import type { MembershipPeriod } from '../../../lib/repositories/memberships';

export const prerender = false;

export const GET: APIRoute = async ({ request }) => {
  if (!(await isAdminAuthorized(request))) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401 });
  }

  const url = new URL(request.url);
  const id = Number(url.searchParams.get('id'));
  const logsForId = Number(url.searchParams.get('logsForId'));
  if (logsForId) {
    const logs = await listAdminApplicationLogs(logsForId);
    return new Response(JSON.stringify({ data: logs }), {
      headers: { 'Content-Type': 'application/json' },
    });
  }

  if (id) {
    const row = await getAdminApplicationById(id);
    if (!row) {
      return new Response(JSON.stringify({ error: 'Application not found' }), { status: 404 });
    }
    return new Response(JSON.stringify({ data: row }), {
      headers: { 'Content-Type': 'application/json' },
    });
  }

  const rows = await listAdminApplications();
  return new Response(JSON.stringify({ data: rows }), {
    headers: { 'Content-Type': 'application/json' },
  });
};

export const POST: APIRoute = async ({ request }) => {
  if (!(await isAdminAuthorized(request))) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401 });
  }

  const body = await request.json().catch(() => null);
  const id = Number(body?.id);
  const status = body?.status as 'pending' | 'approved' | 'rejected';
  const membershipPeriod = (body?.membershipPeriod as MembershipPeriod | undefined) ?? 'monthly';
  const adminNote = body?.adminNote?.toString?.() ?? '';
  const assignedAdminEmail = body?.assignedAdminEmail?.toString?.() ?? '';
  if (!id || !['pending', 'approved', 'rejected'].includes(status)) {
    return new Response(JSON.stringify({ error: 'Invalid payload' }), { status: 400 });
  }

  const updated = await updateApplicationStatus(id, status, {
    adminNote: adminNote.slice(0, 5000),
    assignedAdminEmail: assignedAdminEmail.slice(0, 180),
    membershipPeriod: membershipPeriod === 'yearly' ? 'yearly' : 'monthly',
  });
  if (!updated) {
    return new Response(JSON.stringify({ error: 'Application not found' }), { status: 404 });
  }
  return new Response(JSON.stringify({ data: updated }), {
    headers: { 'Content-Type': 'application/json' },
  });
};

