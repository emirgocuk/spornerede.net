import type { APIRoute } from 'astro';
import { isAdminAuthorized } from '../../../lib/adminAuth';
import { hashPassword } from '../../../lib/auth/password';
import { sendClubProvisionedMail } from '../../../lib/mail/onboarding';
import { ensureClubUserForClub } from '../../../lib/repositories/auth';
import { ensureApprovedClubMembershipPaidForUser } from '../../../lib/repositories/memberships';

export const prerender = false;

export const POST: APIRoute = async ({ request }) => {
  if (!(await isAdminAuthorized(request))) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401 });
  }

  const body = await request.json().catch(() => null);
  const clubId = Number(body?.clubId);
  const email = body?.email?.toString()?.trim()?.toLowerCase() ?? '';
  const password = body?.password?.toString() ?? '';
  const membershipRole = body?.membershipRole === 'staff' ? 'staff' : 'owner';

  if (!clubId || !email || !password) {
    return new Response(JSON.stringify({ error: 'clubId, email ve password zorunlu' }), { status: 400 });
  }
  if (password.length < 8) {
    return new Response(JSON.stringify({ error: 'Password en az 8 karakter olmalı' }), { status: 400 });
  }

  const passwordHash = await hashPassword(password);
  const provisioned = await ensureClubUserForClub({
    email,
    passwordHash,
    clubId,
    membershipRole,
  });

  const membershipPeriod = body?.membershipPeriod === 'yearly' ? 'yearly' : 'monthly';
  await ensureApprovedClubMembershipPaidForUser(provisioned.userId, membershipPeriod).catch(() => undefined);

  let mailWarning = '';
  try {
    const mailResult = await sendClubProvisionedMail({
      to: provisioned.email,
      clubName: provisioned.clubName || `Kulup #${provisioned.clubId}`,
      email: provisioned.email,
      tempPassword: password,
    });
    if (!mailResult.sent) {
      mailWarning = mailResult.reason;
    }
  } catch {
    mailWarning = 'mail_send_failed';
  }

  return new Response(JSON.stringify({ data: provisioned, mailWarning }), {
    headers: { 'Content-Type': 'application/json' },
  });
};
