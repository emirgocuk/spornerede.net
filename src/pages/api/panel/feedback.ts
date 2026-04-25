import type { APIRoute } from 'astro';
import { getCurrentSessionUser } from '../../../lib/auth/session';
import { createPanelFeedback } from '../../../lib/repositories/panelFeedbacks';

export const POST: APIRoute = async ({ request }) => {
  const session = await getCurrentSessionUser(request);
  if (!session) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401 });
  }

  const body = await request.json().catch(() => null);
  if (!body || !body.mesaj || body.mesaj.trim() === '') {
    return new Response(JSON.stringify({ error: 'Mesaj boş olamaz' }), { status: 400 });
  }

  try {
    const feedback = await createPanelFeedback(session.userId, body.mesaj.trim());
    return new Response(JSON.stringify({ ok: true, data: feedback }), {
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Feedback create error:', error);
    return new Response(JSON.stringify({ error: 'Sunucu hatası' }), { status: 500 });
  }
};