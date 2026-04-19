export function isAdminAuthorized(request: Request) {
  const expected = import.meta.env.ADMIN_TOKEN;
  if (!expected) {
    return false;
  }

  const authHeader = request.headers.get('authorization') ?? '';
  const tokenFromHeader = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : '';
  if (tokenFromHeader && tokenFromHeader === expected) {
    return true;
  }

  const url = new URL(request.url);
  const tokenFromQuery = url.searchParams.get('token') ?? '';
  return tokenFromQuery === expected;
}

