import { getSessionWithUser } from '../repositories/auth';

export const SESSION_COOKIE_NAME = 'spornerede_session';

export function getCookieValueFromRequest(request: Request, key: string) {
  const cookieHeader = request.headers.get('cookie') ?? '';
  const pairs = cookieHeader.split(';');
  for (const pair of pairs) {
    const [rawKey, ...rest] = pair.trim().split('=');
    if (rawKey !== key) continue;
    return decodeURIComponent(rest.join('='));
  }
  return '';
}

export function buildSessionCookie(token: string, expiresAt: Date) {
  const secure = import.meta.env.PROD ? 'Secure; ' : '';
  return `${SESSION_COOKIE_NAME}=${encodeURIComponent(token)}; Path=/; HttpOnly; SameSite=Lax; ${secure}Expires=${expiresAt.toUTCString()}`;
}

export function buildSessionCookieDeletion() {
  const secure = import.meta.env.PROD ? 'Secure; ' : '';
  return `${SESSION_COOKIE_NAME}=; Path=/; HttpOnly; SameSite=Lax; ${secure}Expires=Thu, 01 Jan 1970 00:00:00 GMT`;
}

export async function getCurrentSessionUser(request: Request) {
  const token = getCookieValueFromRequest(request, SESSION_COOKIE_NAME);
  if (!token) {
    return null;
  }
  return getSessionWithUser(token);
}
