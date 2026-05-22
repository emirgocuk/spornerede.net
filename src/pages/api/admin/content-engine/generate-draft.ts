import type { APIRoute } from 'astro';
import { isAdminAuthorized } from '../../../../lib/adminAuth';
import { runDraftFromAdmin } from '../../../../lib/contentEngine/runDraftFromAdmin';

export const prerender = false;

export const POST: APIRoute = async ({ request }) => {
  if (!(await isAdminAuthorized(request))) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), {
      status: 401,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  const result = await runDraftFromAdmin();

  if (!result.ok) {
    const status =
      result.code === 'rate_limit' || result.code === 'daily_limit' ? 429 : 400;
    return new Response(
      JSON.stringify({ success: false, code: result.code, error: result.message }),
      { status, headers: { 'Content-Type': 'application/json' } },
    );
  }

  return new Response(
    JSON.stringify({
      success: true,
      data: {
        id: result.id,
        slug: result.slug,
        baslik: result.baslik,
        anahtar: result.anahtar,
        modelUsed: result.modelUsed,
        previewUrl: `/rehber/${result.slug}`,
      },
    }),
    { headers: { 'Content-Type': 'application/json' } },
  );
};
