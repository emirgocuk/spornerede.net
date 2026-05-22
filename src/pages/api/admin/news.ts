import type { APIRoute } from 'astro';
import { isAdminAuthorized } from '../../../lib/adminAuth';
import {
  getAllNewsAdmin,
  createNews,
  updateNews,
  deleteNews,
  assessNewsForPublish,
  getNewsAdminByLegacyId,
} from '../../../lib/repositories/news';

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
  const {
    kategori,
    kategoriRenk,
    tarih,
    baslik,
    ozet,
    link,
    aktif,
    slug,
    seoTitle,
    seoDescription,
    forcePublish,
  } = payload as Record<string, unknown>;

  if (!baslik || !ozet || !tarih) {
    return new Response(JSON.stringify({ success: false, error: 'Eksik alanlar var' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  if (aktif === true && !forcePublish) {
    const check = assessNewsForPublish(String(ozet), String(baslik));
    if (!check.complete) {
      return new Response(
        JSON.stringify({
          success: false,
          code: 'incomplete_draft',
          error: 'Taslak tamamlanmamis; yayinlamak icin metni tamamlayin veya forcePublish gonderin.',
          issues: check.issues,
        }),
        { status: 400, headers: { 'Content-Type': 'application/json' } },
      );
    }
  }

  const result = await createNews({
    kategori: String(kategori || 'Genel'),
    kategoriRenk: String(kategoriRenk || 'gray'),
    tarih: String(tarih),
    baslik: String(baslik),
    ozet: String(ozet),
    link: String(link || '#'),
    aktif: Boolean(aktif ?? true),
    slug: slug ? String(slug) : undefined,
    seoTitle: seoTitle ? String(seoTitle) : undefined,
    seoDescription: seoDescription ? String(seoDescription) : undefined,
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
  const { id, forcePublish, ...updates } = payload as {
    id?: number;
    forcePublish?: boolean;
    aktif?: boolean;
    ozet?: string;
    baslik?: string;
    [key: string]: unknown;
  };

  if (!id) {
    return new Response(JSON.stringify({ success: false, error: 'Haber ID gerekli' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  if (updates.aktif === true && !forcePublish) {
    const existing = await getNewsAdminByLegacyId(id);
    const ozet = String(updates.ozet ?? existing?.ozet ?? '');
    const baslik = String(updates.baslik ?? existing?.baslik ?? '');
    if (ozet) {
      const check = assessNewsForPublish(ozet, baslik);
      if (!check.complete) {
        return new Response(
          JSON.stringify({
            success: false,
            code: 'incomplete_draft',
            error: 'Taslak tamamlanmamis.',
            issues: check.issues,
          }),
          { status: 400, headers: { 'Content-Type': 'application/json' } },
        );
      }
    }
  }

  try {
    await updateNews(id, updates);
  } catch (e) {
    const message = e instanceof Error ? e.message : 'Guncelleme basarisiz';
    return new Response(JSON.stringify({ success: false, error: message }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    });
  }

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
  const { id } = payload as { id?: number };

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
