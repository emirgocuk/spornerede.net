import type { APIRoute } from 'astro';
import { isAdminAuthorized } from '../../../lib/adminAuth';
import { getAllNewsAdmin, createNews, updateNews, deleteNews } from '../../../lib/repositories/news';

export const prerender = false;

export const GET: APIRoute = async ({ request }) => {
  if (!(await isAdminAuthorized(request))) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), {
      status: 401,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  const data = await getAllNewsAdmin();
  return new Response(JSON.stringify({ success: true, data }), {
    headers: { 'Content-Type': 'application/json' },
  });
};

export const POST: APIRoute = async ({ request }) => {
  if (!(await isAdminAuthorized(request))) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), {
      status: 401,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  const payload = await request.json().catch(() => ({}));
  const { kategori, kategoriRenk, tarih, baslik, ozet, link, aktif, slug, seoTitle, seoDescription } = payload;

  if (!baslik || !ozet || !tarih) {
    return new Response(JSON.stringify({ success: false, error: 'Eksik alanlar var' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  const result = await createNews({
    kategori: kategori || 'Genel',
    kategoriRenk: kategoriRenk || 'gray',
    tarih,
    baslik,
    ozet,
    link: link || '#',
    aktif: aktif ?? true,
    slug: slug || undefined,
    seoTitle: seoTitle || undefined,
    seoDescription: seoDescription || undefined,
  });

  return new Response(JSON.stringify({ success: true, data: result }), {
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
  const { id, ...updates } = payload;

  if (!id) {
    return new Response(JSON.stringify({ success: false, error: 'Haber ID gerekli' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  await updateNews(id, updates);

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
  const { id } = payload;

  if (!id) {
    return new Response(JSON.stringify({ success: false, error: 'Haber ID gerekli' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  await deleteNews(id);

  return new Response(JSON.stringify({ success: true }), {
    headers: { 'Content-Type': 'application/json' },
  });
};
