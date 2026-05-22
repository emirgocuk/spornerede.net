import type { APIRoute } from 'astro';
import { isAdminAuthorized } from '../../../../lib/adminAuth';
import { createManualNewsDraft } from '../../../../lib/contentEngine/createManualNewsDraft';

export const prerender = false;

export const POST: APIRoute = async ({ request }) => {
  if (!(await isAdminAuthorized(request))) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), {
      status: 401,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  const payload = await request.json().catch(() => ({}));
  const baslik = String((payload as { baslik?: string }).baslik ?? '').trim();

  if (!baslik) {
    return new Response(JSON.stringify({ success: false, error: 'Haber basligi gerekli' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  try {
    const data = await createManualNewsDraft(baslik);
    return new Response(
      JSON.stringify({
        success: true,
        data: {
          ...data,
          konu: data.konu ?? baslik,
          previewUrl: `/haberler/${data.slug}`,
          aktif: false,
        },
      }),
      { headers: { 'Content-Type': 'application/json' } },
    );
  } catch (e) {
    const message = e instanceof Error ? e.message : 'Taslak olusturulamadi';
    return new Response(JSON.stringify({ success: false, error: message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
};
