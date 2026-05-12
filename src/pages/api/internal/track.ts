import type { APIRoute } from 'astro';

export const prerender = false;

/**
 * /api/internal/track
 *
 * Tarayicilardan gelen analytics event'lerini server-side log eder.
 * Bu, first-party measurement icin gereklidir (cookie'siz dunyaya hazirlik
 * + GA4 outage'lara karsi yedek).
 *
 * Su an icin sadece structured stdout log yazar. Ileride PocketBase'e
 * "analytics_events" koleksiyonu eklenip burada persist edilebilir.
 *
 * NOT: sendBeacon API'si Content-Type'i `text/plain` veya yok olarak
 * gonderebilir, biz JSON bekliyoruz.
 */

const MAX_BODY_BYTES = 8 * 1024; // 8 KB
const ALLOWED_EVENT = /^[a-z_][a-z0-9_]{0,63}$/i;

function clientIpFromRequest(request: Request): string {
  const xfwd = request.headers.get('x-forwarded-for') || '';
  if (xfwd) return xfwd.split(',')[0].trim();
  const real = request.headers.get('x-real-ip');
  if (real) return real.trim();
  return '0.0.0.0';
}

export const POST: APIRoute = async ({ request }) => {
  try {
    const text = await request.text();
    if (!text || text.length > MAX_BODY_BYTES) {
      return new Response(null, { status: 204 });
    }
    let payload: Record<string, unknown> = {};
    try {
      payload = JSON.parse(text);
    } catch {
      return new Response(null, { status: 204 });
    }

    const event = String(payload.event ?? '').trim();
    if (!event || !ALLOWED_EVENT.test(event)) {
      return new Response(null, { status: 204 });
    }

    const log = {
      ts: new Date().toISOString(),
      event,
      params: payload.params ?? {},
      page: String(payload.page ?? '').slice(0, 512),
      referrer: payload.referrer ? String(payload.referrer).slice(0, 512) : null,
      ua: (request.headers.get('user-agent') ?? '').slice(0, 256),
      ip: clientIpFromRequest(request),
      country: request.headers.get('cf-ipcountry') ?? null,
    };

    // Console log — production'da structured JSON olarak okunabilir
    console.log(`[track] ${JSON.stringify(log)}`);

    return new Response(null, { status: 204 });
  } catch (error) {
    console.error('[track] endpoint hatasi:', error);
    return new Response(null, { status: 204 });
  }
};

// GET ile yanlislikla gelirse 204 don
export const GET: APIRoute = async () => new Response(null, { status: 204 });
