import type { APIRoute } from 'astro';
import { getCurrentSessionUser } from '../../../lib/auth/session';

export const prerender = false;

export const GET: APIRoute = async ({ request }) => {
  const session = await getCurrentSessionUser(request);
  if (!session) {
    return new Response(JSON.stringify({ authenticated: false }), {
      status: 401,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  return new Response(
    JSON.stringify({
      authenticated: true,
      user: {
        id: session.userId,
        email: session.email,
        role: session.role,
        expiresAt: session.expiresAt,
        mustChangePassword: session.mustChangePassword,
      },
    }),
    { headers: { 'Content-Type': 'application/json' } }
  );
};
