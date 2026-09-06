import type { APIRoute } from 'astro';
import { buildSessionCookie, buildSessionHintCookie } from '../../../lib/auth/session';
import { createSession, findUserByEmail } from '../../../lib/repositories/auth';
import { verifyPassword } from '../../../lib/auth/password';
import { ensureApprovedClubMembershipPaidForUser } from '../../../lib/repositories/memberships';
import { checkRateLimit, getClientIp, resetRateLimit } from '../../../lib/security/rateLimiter';

export const prerender = false;

export const POST: APIRoute = async ({ request }) => {
  const formData = await request.formData().catch(() => null);
  const redirectTo = formData?.get('redirectTo')?.toString().trim() || '/merkez';
  const loginBaseUrl = redirectTo.startsWith('/') ? redirectTo : '/merkez';

  const clientIp = getClientIp(request);

  // IP bazli kaba kuvvet engeli (10 dakikada en fazla 10 deneme)
  const ipLimit = checkRateLimit(`login:ip:${clientIp}`, {
    max: 10,
    windowSeconds: 600,
    blockSeconds: 900,
  });
  if (!ipLimit.allowed) {
    return Response.redirect(new URL(`${loginBaseUrl}?error=rate_limit`, request.url), 303);
  }

  const email = formData?.get('email')?.toString().trim().toLowerCase() ?? '';
  const password = formData?.get('password')?.toString() ?? '';
  if (!email || !password) {
    return Response.redirect(new URL(`${loginBaseUrl}?error=missing`, request.url), 303);
  }

  // Hesap bazli kaba kuvvet engeli (10 dakikada en fazla 5 deneme)
  const accountLimit = checkRateLimit(`login:email:${email}`, {
    max: 5,
    windowSeconds: 600,
    blockSeconds: 900,
  });
  if (!accountLimit.allowed) {
    return Response.redirect(new URL(`${loginBaseUrl}?error=rate_limit`, request.url), 303);
  }

  const user = await findUserByEmail(email);
  if (!user || !user.aktif) {
    return Response.redirect(new URL(`${loginBaseUrl}?error=invalid`, request.url), 303);
  }

  const isValidPassword = await verifyPassword(password, user.passwordHash);
  if (!isValidPassword) {
    return Response.redirect(new URL(`${loginBaseUrl}?error=invalid`, request.url), 303);
  }

  // Basarili giris sonrasi limitleri sifirla
  resetRateLimit(`login:ip:${clientIp}`);
  resetRateLimit(`login:email:${email}`);

  if (user.rol === 'club') {
    await ensureApprovedClubMembershipPaidForUser(user.id).catch(() => undefined);
  }

  const { token, expiresAt } = await createSession(user.id);
  const headers = new Headers();
  headers.append('Set-Cookie', buildSessionCookie(token, expiresAt));
  headers.append('Set-Cookie', buildSessionHintCookie(expiresAt));
  const nextPath = user.mustChangePassword
    ? '/panel/sifre-degistir'
    : user.rol === 'admin'
      ? '/merkez'
      : '/panel';
  headers.set('Location', nextPath);

  return new Response(null, { status: 303, headers });
};


