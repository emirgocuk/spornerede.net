import type { APIRoute } from 'astro';
import { isAdminAuthorized } from '../../../../lib/adminAuth';
import { createManualGuideDraft } from '../../../../lib/contentEngine/createManualGuideDraft';

export const prerender = false;

export const POST: APIRoute = async ({ request }) => {
  if (!(await isAdminAuthorized(request))) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), {
      status: 401,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  const payload = await request.json().catch(() => ({}));
  const anahtar = String((payload as { anahtar?: string }).anahtar ?? '').trim();

  if (!anahtar) {
    return new Response(JSON.stringify({ success: false, error: 'Anahtar kelime gerekli' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  try {
    const data = await createManualGuideDraft(anahtar);
    return new Response(
      JSON.stringify({
        success: true,
        data: { ...data, previewUrl: `/rehber/${data.slug}` },
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
