import type { APIRoute } from 'astro';
import { verifyPassword, hashPassword } from '../../../lib/auth/password';
import { getCurrentSessionUser } from '../../../lib/auth/session';
import { findUserByEmail, updateUserPassword } from '../../../lib/repositories/auth';

export const prerender = false;

export const POST: APIRoute = async ({ request }) => {
  const session = await getCurrentSessionUser(request);
  if (!session) {
    return Response.redirect(new URL('/admin?error=auth', request.url), 303);
  }

  const formData = await request.formData().catch(() => null);
  const currentPassword = formData?.get('currentPassword')?.toString() ?? '';
  const newPassword = formData?.get('newPassword')?.toString() ?? '';
  const newPasswordAgain = formData?.get('newPasswordAgain')?.toString() ?? '';

  if (!currentPassword || !newPassword || !newPasswordAgain) {
    return Response.redirect(new URL('/panel/sifre-degistir?saved=0', request.url), 303);
  }
  if (newPassword.length < 8 || newPassword !== newPasswordAgain) {
    return Response.redirect(new URL('/panel/sifre-degistir?saved=0', request.url), 303);
  }

  const user = await findUserByEmail(session.email);
  if (!user) {
    return Response.redirect(new URL('/panel/sifre-degistir?saved=0', request.url), 303);
  }

  const isCurrentValid = await verifyPassword(currentPassword, user.passwordHash);
  if (!isCurrentValid) {
    return Response.redirect(new URL('/panel/sifre-degistir?saved=0', request.url), 303);
  }

  const passwordHash = await hashPassword(newPassword);
  await updateUserPassword(user.id, passwordHash, { forcePasswordChange: false });

  return Response.redirect(new URL('/panel/sifre-degistir?saved=1', request.url), 303);
};
