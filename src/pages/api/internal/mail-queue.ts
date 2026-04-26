import type { APIRoute } from 'astro';
import { processMailQueue } from '../../../lib/mail/service';

export const prerender = false;

export const POST: APIRoute = async ({ request }) => {
  const expectedToken = process.env.MAIL_QUEUE_TOKEN ?? import.meta.env.MAIL_QUEUE_TOKEN;
  if (expectedToken) {
    const providedToken = request.headers.get('x-mail-queue-token') || '';
    if (providedToken !== expectedToken) {
      return new Response(JSON.stringify({ success: false, error: 'unauthorized' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' },
      });
    }
  }

  const result = await processMailQueue(10);
  return new Response(JSON.stringify({ success: true, ...result }), {
    headers: { 'Content-Type': 'application/json' },
  });
};
