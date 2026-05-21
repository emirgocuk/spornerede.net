import type { APIRoute } from 'astro';
import { isAdminAuthorized } from '../../../lib/adminAuth';
import { normalizeMembershipPeriod } from '../../../lib/repositories/memberships';
import {
  deleteAdminApplication,
  getAdminApplicationById,
  listAdminApplicationLogs,
  listAdminApplications,
  updateAdminApplicationFields,
  updateApplicationStatus,
} from '../../../lib/repositories/applications';

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
  const adminNote = body?.adminNote?.toString?.() ?? '';
  const assignedAdminEmail = body?.assignedAdminEmail?.toString?.() ?? '';

  if (body?.delete) {
    if (!id) {
      return new Response(JSON.stringify({ error: 'Invalid payload' }), { status: 400 });
    }
    try {
      const deleted = await deleteAdminApplication(id);
      if (!deleted) {
        return new Response(JSON.stringify({ error: 'Application not found' }), { status: 404 });
      }
      return new Response(JSON.stringify({ data: deleted }), {
        headers: { 'Content-Type': 'application/json' },
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Delete failed';
      return new Response(JSON.stringify({ error: message }), { status: 400 });
    }
  }

  if (body?.updateFields) {
    if (!id) {
      return new Response(JSON.stringify({ error: 'Invalid payload' }), { status: 400 });
    }
    try {
      const ilanlar = Array.isArray(body.ilanlar) ? body.ilanlar : [];
      const updated = await updateAdminApplicationFields(id, {
        ad: body.ad?.toString?.().trim() ?? '',
        ilSlug: body.ilSlug?.toString?.().trim() ?? '',
        ilceSlug: body.ilceSlug?.toString?.().trim() ?? '',
        adres: body.adres?.toString?.() ?? '',
        telefon: body.telefon?.toString?.() ?? '',
        email: body.email?.toString?.() ?? '',
        aciklama: body.aciklama?.toString?.() ?? '',
        ilanlar: ilanlar.map((item: Record<string, unknown>) => ({
          id: Number(item.id),
          brans: item.brans?.toString?.() ?? '',
          yasAraligi: item.yasAraligi?.toString?.() ?? '',
          aidatBilgisi: item.aidatBilgisi?.toString?.() ?? '',
        })),
      });
      if (!updated) {
        return new Response(JSON.stringify({ error: 'Application not found or not editable' }), { status: 404 });
      }
      return new Response(JSON.stringify({ data: updated }), {
        headers: { 'Content-Type': 'application/json' },
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Update failed';
      return new Response(JSON.stringify({ error: message }), { status: 400 });
    }
  }

  const status = body?.status as 'pending' | 'approved' | 'rejected';
  if (!id || !['pending', 'approved', 'rejected'].includes(status)) {
    return new Response(JSON.stringify({ error: 'Invalid payload' }), { status: 400 });
  }
  const membershipPeriod = body?.membershipPeriod ? normalizeMembershipPeriod(body.membershipPeriod) : undefined;

  const updated = await updateApplicationStatus(id, status, {
    adminNote: adminNote.slice(0, 5000),
    assignedAdminEmail: assignedAdminEmail.slice(0, 180),
    actorEmail: body?.actorEmail?.toString?.() ?? '',
    membershipPeriod,
  });
  if (!updated) {
    return new Response(JSON.stringify({ error: 'Application not found' }), { status: 404 });
  }
  return new Response(JSON.stringify({ data: updated }), {
    headers: { 'Content-Type': 'application/json' },
  });
};

