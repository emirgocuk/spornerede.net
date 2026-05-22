import type { APIRoute } from 'astro';
import { isAdminAuthorized } from '../../../../lib/adminAuth';
import { runNewsCompleteFromAdmin } from '../../../../lib/contentEngine/runNewsCompleteFromAdmin';

export const prerender = false;

export const POST: APIRoute = async ({ request }) => {
  if (!(await isAdminAuthorized(request))) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), {
      status: 401,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  const payload = await request.json().catch(() => ({}));
  const legacyId = Number((payload as { id?: number }).id);

  if (!Number.isFinite(legacyId) || legacyId <= 0) {
    return new Response(JSON.stringify({ success: false, error: 'Haber id gerekli' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  const result = await runNewsCompleteFromAdmin(legacyId);

  if (!result.ok) {
    const status = result.code === 'rate_limit' ? 429 : 400;
    return new Response(
      JSON.stringify({ success: false, code: result.code, error: result.message }),
      { status, headers: { 'Content-Type': 'application/json' } },
    );
  }

  return new Response(
    JSON.stringify({
      success: true,
      data: {
        id: result.legacyId,
        slug: result.slug,
        complete: result.complete,
        wordCount: result.wordCount,
        issues: result.issues,
        modelUsed: result.modelUsed,
        rewritten: result.rewritten,
      },
    }),
    { headers: { 'Content-Type': 'application/json' } },
  );
};
