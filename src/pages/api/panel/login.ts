import type { APIRoute } from 'astro';
import { buildSessionCookie } from '../../../lib/auth/session';
import { createSession, findUserByEmail } from '../../../lib/repositories/auth';
import { verifyPassword } from '../../../lib/auth/password';

export const prerender = false;

export const POST: APIRoute = async ({ request }) => {
  const formData = await request.formData().catch(() => null);
  const email = formData?.get('email')?.toString().trim().toLowerCase() ?? '';
  const password = formData?.get('password')?.toString() ?? '';
  const redirectTo = formData?.get('redirectTo')?.toString() ?? '/panel';

  if (!email || !password) {
    return Response.redirect(new URL('/panel/giris?error=missing', request.url), 303);
  }

  const user = await findUserByEmail(email);
  if (!user || !user.aktif) {
    return Response.redirect(new URL('/panel/giris?error=invalid', request.url), 303);
  }

  const isValidPassword = await verifyPassword(password, user.passwordHash);
  if (!isValidPassword) {
    return Response.redirect(new URL('/panel/giris?error=invalid', request.url), 303);
  }

  const { token, expiresAt } = await createSession(user.id);
  const headers = new Headers();
  headers.set('Set-Cookie', buildSessionCookie(token, expiresAt));
  const safeRedirect = redirectTo.startsWith('/') ? redirectTo : '/panel';
  const roleDefaultRedirect = user.rol === 'admin' ? '/admin' : safeRedirect;
  const nextPath = user.mustChangePassword ? '/panel/sifre-degistir' : roleDefaultRedirect;
  headers.set('Location', nextPath);

  return new Response(null, { status: 303, headers });
};
