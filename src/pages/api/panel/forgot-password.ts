import type { APIRoute } from 'astro';
import { createPasswordResetToken, findUserByEmail } from '../../../lib/repositories/auth';
import { enqueueMail, processMailQueue } from '../../../lib/mail/service';
import { buildPasswordResetMail } from '../../../lib/mail/templates';
import { checkRateLimit, getClientIp } from '../../../lib/security/rateLimiter';

export const prerender = false;

export const POST: APIRoute = async ({ request }) => {
  const successRedirect = new URL('/panel/sifremi-unuttum?sent=1', request.url);

  const clientIp = getClientIp(request);
  const ipLimit = checkRateLimit(`forgot-password:ip:${clientIp}`, {
    max: 5,
    windowSeconds: 1800, // 30 minutes
    blockSeconds: 1800,
  });
  if (!ipLimit.allowed) {
    return Response.redirect(successRedirect, 303);
  }

  const formData = await request.formData().catch(() => null);
  const email = formData?.get('email')?.toString().trim().toLowerCase() ?? '';

  if (!email) {
    return Response.redirect(successRedirect, 303);
  }

  const emailLimit = checkRateLimit(`forgot-password:email:${email}`, {
    max: 3,
    windowSeconds: 1800,
    blockSeconds: 1800,
  });
  if (!emailLimit.allowed) {
    return Response.redirect(successRedirect, 303);
  }

  const user = await findUserByEmail(email).catch(() => null);
  if (!user || !user.aktif) {
    return Response.redirect(successRedirect, 303);
  }

  const { token } = await createPasswordResetToken(user.id, 15);
  const baseUrl = import.meta.env.SITE_URL || new URL(request.url).origin;
  const resetUrl = `${baseUrl}/panel/sifre-sifirla?token=${encodeURIComponent(token)}`;
  const template = buildPasswordResetMail({ resetUrl });

  await enqueueMail({
    kind: 'password_reset',
    toEmail: user.email,
    subject: template.subject,
    html: template.html,
  });
  await processMailQueue(3).catch(() => undefined);

  return Response.redirect(successRedirect, 303);
};
