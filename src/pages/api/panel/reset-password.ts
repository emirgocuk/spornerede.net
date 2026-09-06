import type { APIRoute } from 'astro';
import { hashPassword } from '../../../lib/auth/password';
import { consumePasswordResetToken, deleteAllSessionsForUser, updateUserPassword } from '../../../lib/repositories/auth';

export const prerender = false;

export const POST: APIRoute = async ({ request }) => {
  const formData = await request.formData().catch(() => null);
  const token = formData?.get('token')?.toString().trim() ?? '';
  const password = formData?.get('password')?.toString() ?? '';
  const passwordAgain = formData?.get('passwordAgain')?.toString() ?? '';

  if (!token || !password || password.length < 8 || password !== passwordAgain) {
    return Response.redirect(new URL('/panel/sifre-sifirla?ok=0', request.url), 303);
  }

  const consumed = await consumePasswordResetToken(token);
  if (!consumed) {
    return Response.redirect(new URL('/panel/sifre-sifirla?ok=0', request.url), 303);
  }

  const passwordHash = await hashPassword(password);
  await updateUserPassword(consumed.userId, passwordHash, { forcePasswordChange: false });
  await deleteAllSessionsForUser(consumed.userId);

  return Response.redirect(new URL('/merkez?error=password_changed', request.url), 303);
};
