import type { APIRoute } from 'astro';
import { getCurrentSessionUser } from '../../../lib/auth/session';
import { getAdminFeedbacks, updateAdminFeedbackStatus } from '../../../lib/repositories/panelFeedbacks';

export const prerender = false;

export const GET: APIRoute = async ({ request }) => {
  const session = await getCurrentSessionUser(request);
  if (!session || session.role !== 'admin') {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401 });
  }

  try {
    const list = await getAdminFeedbacks();
    return new Response(JSON.stringify({ data: list }), {
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: 'Sunucu hatası' }), { status: 500 });
  }
};

export const POST: APIRoute = async ({ request }) => {
  const session = await getCurrentSessionUser(request);
  if (!session || session.role !== 'admin') {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401 });
  }

  const body = await request.json().catch(() => null);
  if (!body || !body.id || !body.durum) {
    return new Response(JSON.stringify({ error: 'Geçersiz parametreler' }), { status: 400 });
  }

  try {
    const updated = await updateAdminFeedbackStatus(Number(body.id), body.durum);
    if (!updated) {
      return new Response(JSON.stringify({ error: 'Kayıt bulunamadı' }), { status: 404 });
    }
    return new Response(JSON.stringify({ ok: true, data: updated }), {
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: 'Sunucu hatası' }), { status: 500 });
  }
};