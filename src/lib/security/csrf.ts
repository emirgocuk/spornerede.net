/**
 * src/lib/security/csrf.ts
 *
 * Origin and Referer validation to protect against Cross-Site Request Forgery (CSRF).
 */

const SAFE_METHODS = new Set(['GET', 'HEAD', 'OPTIONS']);
const PUBLIC_MUTATING_PATHS = new Set(['/api/basvuru', '/api/contact']);

export function isCsrfSafe(request: Request): boolean {
  if (SAFE_METHODS.has(request.method.toUpperCase())) {
    return true;
  }

  // Public lead capture endpoints are open to all visitors (mobile apps, WebViews, etc.)
  try {
    const urlPath = new URL(request.url).pathname;
    if (PUBLIC_MUTATING_PATHS.has(urlPath)) {
      return true;
    }
  } catch {
    // URL parsing failed, proceed to header checks
  }

  // If request carries Bearer token or internal machine token, it's not a browser CSRF
  if (
    request.headers.get('authorization')?.startsWith('Bearer ') ||
    request.headers.has('x-mail-queue-token')
  ) {
    return true;
  }

  const origin = request.headers.get('origin');
  const referer = request.headers.get('referer');
  const sourceUrl = origin || referer;

  // If neither Origin nor Referer is provided on a browser mutating request
  if (!sourceUrl) {
    // In strict environments we block; allow in non-browser CLI if necessary
    return false;
  }

  try {
    const sourceHostname = new URL(sourceUrl).hostname.toLowerCase();
    const hostHeader = request.headers.get('x-forwarded-host') || request.headers.get('host') || '';
    const currentHost = hostHeader.split(':')[0].toLowerCase();

    // Direct match with Host header
    if (currentHost && sourceHostname === currentHost) {
      return true;
    }

    // Match with SITE_URL if configured
    const configuredSiteUrl = process.env.SITE_URL;
    if (configuredSiteUrl) {
      const siteHostname = new URL(configuredSiteUrl).hostname.toLowerCase();
      if (sourceHostname === siteHostname || sourceHostname === `www.${siteHostname}`) {
        return true;
      }
    }

    // Development / Localhost
    if (sourceHostname === 'localhost' || sourceHostname === '127.0.0.1') {
      return true;
    }

    // Default allowed domains for spornerede
    if (sourceHostname === 'spornerede.net' || sourceHostname === 'www.spornerede.net') {
      return true;
    }

    return false;
  } catch {
    return false;
  }
}
