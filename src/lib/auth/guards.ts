import { getCurrentSessionUser } from './session';
import { getUserPrimaryClub } from '../repositories/auth';

export async function requireSession(request: Request) {
  const session = await getCurrentSessionUser(request);
  if (!session) {
    return {
      ok: false as const,
      response: new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401 }),
    };
  }
  return { ok: true as const, session };
}

export async function requireRoles(request: Request, allowedRoles: Array<'admin' | 'club'>) {
  const result = await requireSession(request);
  if (!result.ok) {
    return result;
  }
  if (result.session.mustChangePassword) {
    return {
      ok: false as const,
      response: new Response(JSON.stringify({ error: 'Password change required' }), { status: 428 }),
    };
  }
  if (!allowedRoles.includes(result.session.role)) {
    return {
      ok: false as const,
      response: new Response(JSON.stringify({ error: 'Forbidden' }), { status: 403 }),
    };
  }
  return result;
}

export async function requirePanelClubAccess(request: Request) {
  const roleResult = await requireRoles(request, ['club', 'admin']);
  if (!roleResult.ok) {
    return roleResult;
  }

  const membership = await getUserPrimaryClub(roleResult.session.userId);
  if (!membership) {
    return {
      ok: false as const,
      response: new Response(JSON.stringify({ error: 'Club membership not found' }), { status: 403 }),
    };
  }
  if (membership.clubStatus !== 'approved') {
    return {
      ok: false as const,
      response: new Response(JSON.stringify({ error: 'Club is not approved yet' }), { status: 403 }),
    };
  }

  return { ok: true as const, session: roleResult.session, membership };
}
