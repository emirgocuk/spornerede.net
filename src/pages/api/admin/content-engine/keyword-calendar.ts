import type { APIRoute } from 'astro';
import { isAdminAuthorized } from '../../../../lib/adminAuth';
import {
  loadKeywordCalendarData,
  updateKeywordPlanDate,
} from '../../../../lib/contentEngine/keywordCalendar';

export const prerender = false;

export const GET: APIRoute = async ({ request }) => {
  if (!(await isAdminAuthorized(request))) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401 });
  }
  try {
    const data = await loadKeywordCalendarData();
    return new Response(JSON.stringify({ data }), {
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (e) {
    const msg = e instanceof Error ? e.message : 'Takvim yuklenemedi';
    return new Response(JSON.stringify({ error: msg }), { status: 500 });
  }
};

export const PATCH: APIRoute = async ({ request }) => {
  if (!(await isAdminAuthorized(request))) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401 });
  }
  const body = await request.json().catch(() => ({}));
  const id = String((body as { id?: string }).id ?? '').trim();
  if (!id) {
    return new Response(JSON.stringify({ error: 'id gerekli' }), { status: 400 });
  }
  const raw = (body as { planlanan_tarih?: string | null }).planlanan_tarih;
  const planlanan_tarih =
    raw === null || raw === '' || raw === undefined ? null : String(raw).slice(0, 10);

  try {
    await updateKeywordPlanDate(id, planlanan_tarih);
    const data = await loadKeywordCalendarData();
    return new Response(JSON.stringify({ data, ok: true }), {
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (e) {
    const msg = e instanceof Error ? e.message : 'Kayit basarisiz';
    return new Response(JSON.stringify({ error: msg }), { status: 500 });
  }
};
