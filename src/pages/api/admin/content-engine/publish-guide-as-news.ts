import type { APIRoute } from 'astro';
import { isAdminAuthorized } from '../../../../lib/adminAuth';
import { publishGuideAsNews } from '../../../../lib/contentEngine/publishGuideAsNews';

export const prerender = false;

export const POST: APIRoute = async ({ request }) => {
  if (!(await isAdminAuthorized(request))) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), {
      status: 401,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  const payload = await request.json().catch(() => ({}));
  const guideId = String((payload as { guideId?: string }).guideId ?? '').trim();

  if (!guideId) {
    return new Response(JSON.stringify({ success: false, error: 'guideId gerekli' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  try {
    const data = await publishGuideAsNews(guideId, true);
    return new Response(JSON.stringify({ success: true, data }), {
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (e) {
    const message = e instanceof Error ? e.message : 'Haber yayinlanamadi';
    return new Response(JSON.stringify({ success: false, error: message }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    });
  }
};
