import type { APIRoute } from 'astro';
import { isAdminAuthorized } from '../../../lib/adminAuth';
import { deleteGuideAdmin, getAllGuidesAdmin, updateGuideAdmin } from '../../../lib/repositories/seoArticles';

export const prerender = false;

export const GET: APIRoute = async ({ request }) => {
  if (!(await isAdminAuthorized(request))) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), {
      status: 401,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  const data = await getAllGuidesAdmin();
  return new Response(JSON.stringify({ success: true, data }), {
    headers: { 'Content-Type': 'application/json' },
  });
};

export const PUT: APIRoute = async ({ request }) => {
  if (!(await isAdminAuthorized(request))) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), {
      status: 401,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  const payload = await request.json().catch(() => ({}));
  const { id, ...updates } = payload as {
    id?: string;
    baslik?: string;
    slug?: string;
    meta_title?: string;
    meta_description?: string;
    icerik_html?: string;
    durum?: string;
    sema_tipi?: string;
  };

  if (!id) {
    return new Response(JSON.stringify({ success: false, error: 'Kayit ID gerekli' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  const allowed = ['baslik', 'slug', 'meta_title', 'meta_description', 'icerik_html', 'durum', 'sema_tipi'];
  const clean: Record<string, string> = {};
  for (const key of allowed) {
    if (updates[key as keyof typeof updates] !== undefined) {
      clean[key] = String(updates[key as keyof typeof updates]);
    }
  }

  if (clean.durum && !['incelemede', 'taslak', 'yayinda', 'arsiv', 'dusuk_performans'].includes(clean.durum)) {
    return new Response(JSON.stringify({ success: false, error: 'Gecersiz durum' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  await updateGuideAdmin(id, clean);

  return new Response(JSON.stringify({ success: true, data: { id } }), {
    headers: { 'Content-Type': 'application/json' },
  });
};

export const DELETE: APIRoute = async ({ request }) => {
  if (!(await isAdminAuthorized(request))) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), {
      status: 401,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  const payload = await request.json().catch(() => ({}));
  const id = String((payload as { id?: string }).id ?? '').trim();
  if (!id) {
    return new Response(JSON.stringify({ success: false, error: 'Kayit ID gerekli' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  await deleteGuideAdmin(id);
  return new Response(JSON.stringify({ success: true }), {
    headers: { 'Content-Type': 'application/json' },
  });
};
