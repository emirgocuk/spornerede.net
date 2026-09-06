import crypto from 'node:crypto';
import { getCurrentSessionUser } from './auth/session';

function safeCompare(a: string, b: string): boolean {
  if (!a || !b) return false;
  const bufA = Buffer.from(a);
  const bufB = Buffer.from(b);
  if (bufA.length !== bufB.length) {
    return false;
  }
  return crypto.timingSafeEqual(bufA, bufB);
}

export async function isAdminAuthorized(request: Request) {
  const session = await getCurrentSessionUser(request).catch(() => null);
  if (session?.role === 'admin') {
    return true;
  }

  const expected = process.env.ADMIN_TOKEN ?? import.meta.env.ADMIN_TOKEN;
  if (!expected) {
    return false;
  }

  const authHeader = request.headers.get('authorization') ?? '';
  const tokenFromHeader = authHeader.startsWith('Bearer ') ? authHeader.slice(7).trim() : '';
  if (tokenFromHeader && safeCompare(tokenFromHeader, expected)) {
    return true;
  }

  return false;
}


