/**
 * src/middleware.ts
 * Astro middleware — her istekte calisir.
 *
 * Yaptiklari:
 *  1. Cloudflare/Nginx tarafindaki cache'i etkin kullanmak icin Cache-Control
 *     header'i set eder. Public, statik karakterli sayfalar daha uzun cache'lenir.
 *  2. Tarayicilarin baska siteler tarafindan iframe'lenmesini engeller (X-Frame-Options).
 *  3. Diger guvenlik header'lari.
 *
 * Not: Detayli rate limiting / CSP icin sonradan genisletilebilir.
 */
import { defineMiddleware, sequence } from 'astro:middleware';

const SSR_CACHE_PATHS: Array<{ test: RegExp; control: string }> = [
  // Liste/landing sayfalari: 5 dk CDN cache + 1 saat SWR
  { test: /^\/$/i, control: 'public, max-age=60, s-maxage=300, stale-while-revalidate=3600' },
  { test: /^\/branslar$/i, control: 'public, max-age=60, s-maxage=600, stale-while-revalidate=3600' },
  { test: /^\/branslar\/[^/]+$/i, control: 'public, max-age=60, s-maxage=600, stale-while-revalidate=3600' },
  { test: /^\/sehirler\/[^/]+(\/[^/]+)?\/[^/]+$/i, control: 'public, max-age=60, s-maxage=600, stale-while-revalidate=3600' },
  { test: /^\/haberler$/i, control: 'public, max-age=60, s-maxage=600, stale-while-revalidate=3600' },
  { test: /^\/haberler\/[^/]+$/i, control: 'public, max-age=120, s-maxage=1800, stale-while-revalidate=86400' },
  // Detay sayfalari: 2 dk CDN + 1 saat SWR (icerik gun icinde guncellenebilir)
  { test: /^\/kulupler\/[^/]+$/i, control: 'public, max-age=60, s-maxage=600, stale-while-revalidate=3600' },
  { test: /^\/ilanlar\/[^/]+$/i, control: 'public, max-age=60, s-maxage=600, stale-while-revalidate=3600' },
  // Sitemap dosyalari
  { test: /^\/sitemap.*\.xml$/i, control: 'public, max-age=300, s-maxage=3600, stale-while-revalidate=86400' },
  { test: /^\/sitemaps\/.+\.xml$/i, control: 'public, max-age=300, s-maxage=3600, stale-while-revalidate=86400' },
  // robots.txt, ads.txt
  { test: /^\/(robots|ads)\.txt$/i, control: 'public, max-age=600, s-maxage=86400' },
  // Yasal sayfalar (degisim azdir)
  { test: /^\/(gizlilik-politikasi|cerez-politikasi|kvkk-aydinlatma-metni|kullanim-kosullari|hakkimizda|iletisim)$/i, control: 'public, max-age=300, s-maxage=86400, stale-while-revalidate=86400' },
];

const NEVER_CACHE_PATHS = [
  '/admin',
  '/panel',
  '/basvuru',
  '/api/',
];

function pickCacheControl(pathname: string): string | null {
  if (NEVER_CACHE_PATHS.some((prefix) => pathname.startsWith(prefix))) {
    return 'private, no-store, max-age=0';
  }
  for (const rule of SSR_CACHE_PATHS) {
    if (rule.test.test(pathname)) return rule.control;
  }
  return null;
}

const cacheAndSecurityHeaders = defineMiddleware(async (context, next) => {
  const response = await next();
  const pathname = context.url.pathname;

  // Cache-Control — sadece GET istekleri ve HTML/XML response'lara
  const method = context.request.method.toUpperCase();
  const contentType = response.headers.get('content-type') ?? '';
  const isCacheableMethod = method === 'GET' || method === 'HEAD';
  const isCacheableType =
    contentType.includes('text/html') ||
    contentType.includes('application/xml') ||
    contentType.includes('text/xml') ||
    contentType.includes('image/png') ||
    contentType.includes('image/svg') ||
    contentType.includes('text/plain');

  if (isCacheableMethod && isCacheableType && response.status >= 200 && response.status < 400) {
    const cacheControl = pickCacheControl(pathname);
    if (cacheControl && !response.headers.has('cache-control')) {
      response.headers.set('Cache-Control', cacheControl);
    }
  }

  // Guvenlik header'lari (sadece HTML response'lara)
  if (contentType.includes('text/html')) {
    if (!response.headers.has('x-content-type-options')) {
      response.headers.set('X-Content-Type-Options', 'nosniff');
    }
    if (!response.headers.has('x-frame-options')) {
      response.headers.set('X-Frame-Options', 'SAMEORIGIN');
    }
    if (!response.headers.has('referrer-policy')) {
      response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
    }
    if (!response.headers.has('permissions-policy')) {
      response.headers.set(
        'Permissions-Policy',
        'interest-cohort=(), camera=(), microphone=(), geolocation=(self)'
      );
    }
  }

  return response;
});

export const onRequest = sequence(cacheAndSecurityHeaders);
