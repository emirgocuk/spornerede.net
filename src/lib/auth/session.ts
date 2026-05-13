import { getSessionWithUser } from '../repositories/auth';

export const SESSION_COOKIE_NAME = 'spornerede_session';

// "Hint" cookie: HttpOnly DEGIL. Sadece istemcide oturum var/yok bilgisi tasir.
// Header bilesenleri bu cookie'yi okuyup gereksiz /api/panel/session fetch'lerini
// (anonim ziyaretciler icin) ve buna bagli LCP gecikmesini engeller.
export const SESSION_HINT_COOKIE_NAME = 'spornerede_session_hint';

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

export function buildSessionHintCookie(expiresAt: Date) {
  // HttpOnly degil ki JS bu cookie'yi gorebilsin. Icerik dummy bir flag; gercek
  // session degil. Hassas veri tasimaz, sadece "oturum var" sinyali verir.
  const secure = import.meta.env.PROD ? 'Secure; ' : '';
  return `${SESSION_HINT_COOKIE_NAME}=1; Path=/; SameSite=Lax; ${secure}Expires=${expiresAt.toUTCString()}`;
}

export function buildSessionHintCookieDeletion() {
  const secure = import.meta.env.PROD ? 'Secure; ' : '';
  return `${SESSION_HINT_COOKIE_NAME}=; Path=/; SameSite=Lax; ${secure}Expires=Thu, 01 Jan 1970 00:00:00 GMT`;
}

export async function getCurrentSessionUser(request: Request) {
  const token = getCookieValueFromRequest(request, SESSION_COOKIE_NAME);
  if (!token) {
    return null;
  }
  return getSessionWithUser(token);
}
