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
import { ensureNewsScheduler } from './lib/contentEngine/newsScheduler';

ensureNewsScheduler();

// Statik, surum versiyonlu varliklar icin uzun cache. Cloudflare bunlar zaten
// hashli dosya isimlerinden dolayi guvenli sekilde 1y immutable saklayabilir.
const STATIC_LONG_CACHE = 'public, max-age=31536000, immutable';

const SSR_CACHE_PATHS: Array<{ test: RegExp; control: string }> = [
  // Self-host edilen font dosyalari (icerik degismiyor, immutable)
  { test: /^\/fonts\//i, control: STATIC_LONG_CACHE },
  // Astro hashli build varliklari (filename hash icerir, immutable guvenli)
  { test: /^\/_astro\//i, control: STATIC_LONG_CACHE },
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
  '/merkez',
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

import { isCsrfSafe } from './lib/security/csrf';

const csrfProtection = defineMiddleware(async (context, next) => {
  if (!isCsrfSafe(context.request)) {
    console.warn(`[security] Blocked cross-origin request to ${context.url.pathname} from Origin: ${context.request.headers.get('origin')} Referer: ${context.request.headers.get('referer')}`);
    return new Response(
      JSON.stringify({ error: 'Geçersiz veya engellenen istek (CSRF/Origin hatası).' }),
      { status: 403, headers: { 'Content-Type': 'application/json' } }
    );
  }
  return next();
});

const cacheAndSecurityHeaders = defineMiddleware(async (context, next) => {
  const response = await next();
  const pathname = context.url.pathname;

  const method = context.request.method.toUpperCase();
  const contentType = response.headers.get('content-type') ?? '';
  const isCacheableMethod = method === 'GET' || method === 'HEAD';

  // Statik immutable yollar (fonts, _astro) icin content-type whitelist'i
  // gerekmez; her uzantida 1y immutable verilir.
  const isImmutableStaticPath = pathname.startsWith('/fonts/') || pathname.startsWith('/_astro/');

  const isCacheableType =
    isImmutableStaticPath ||
    contentType.includes('text/html') ||
    contentType.includes('application/xml') ||
    contentType.includes('text/xml') ||
    contentType.includes('image/png') ||
    contentType.includes('image/svg') ||
    contentType.includes('text/plain') ||
    contentType.includes('font/') ||
    contentType.includes('application/javascript') ||
    contentType.includes('text/javascript');

  if (isCacheableMethod && isCacheableType && response.status >= 200 && response.status < 400) {
    const cacheControl = pickCacheControl(pathname);
    if (cacheControl) {
      // Immutable yollarda (fonts, _astro) Astro/Node adapter'in default 4h
      // Cache-Control degeri 1 yil immutable ile override edilir. Diger
      // yollarda Astro/route handler kendi degeri varsa o korunur.
      if (isImmutableStaticPath) {
        response.headers.set('Cache-Control', cacheControl);
      } else if (!response.headers.has('cache-control')) {
        response.headers.set('Cache-Control', cacheControl);
      }
    }
  }

  // Tum yanitlara MIME sniffing engeli ve HSTS
  if (!response.headers.has('x-content-type-options')) {
    response.headers.set('X-Content-Type-Options', 'nosniff');
  }
  if (!response.headers.has('strict-transport-security')) {
    response.headers.set('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');
  }

  // Sadece HTML yanitlarina ozel ek guvenlik basliklari
  if (contentType.includes('text/html')) {
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

export const onRequest = sequence(csrfProtection, cacheAndSecurityHeaders);

