import type { APIRoute } from 'astro';
import { buildSessionCookieDeletion, getCookieValueFromRequest, SESSION_COOKIE_NAME } from '../../../lib/auth/session';
import { deleteSession } from '../../../lib/repositories/auth';

export const prerender = false;

export const POST: APIRoute = async ({ request }) => {
  const token = getCookieValueFromRequest(request, SESSION_COOKIE_NAME);
  if (token) {
    await deleteSession(token);
  }

  const headers = new Headers();
  headers.set('Set-Cookie', buildSessionCookieDeletion());
  headers.set('Location', '/panel/giris');
  return new Response(null, { status: 303, headers });
};
