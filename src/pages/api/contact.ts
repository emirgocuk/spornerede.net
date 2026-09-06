import type { APIRoute } from 'astro';
import { createContactMessage } from '../../lib/repositories/contactMessages';
import { checkRateLimit, getClientIp } from '../../lib/security/rateLimiter';

export const prerender = false;

function redirectWith(request: Request, status: 'success' | 'error') {
  const forwardedHost = request.headers.get('x-forwarded-host')?.split(',')[0]?.trim();
  if (forwardedHost) {
    const forwardedProto = request.headers.get('x-forwarded-proto')?.split(',')[0]?.trim() || 'https';
    return Response.redirect(new URL(`/iletisim?status=${status}`, `${forwardedProto}://${forwardedHost}`), 303);
  }

  const configuredSiteUrl = process.env.SITE_URL ?? import.meta.env.SITE_URL;
  const origin = configuredSiteUrl ? new URL(configuredSiteUrl).origin : new URL(request.url).origin;
  return Response.redirect(new URL(`/iletisim?status=${status}`, origin), 303);
}

export const POST: APIRoute = async ({ request }) => {
  try {
    const clientIp = getClientIp(request);
    const ipLimit = checkRateLimit(`contact:ip:${clientIp}`, {
      max: 5,
      windowSeconds: 600,
      blockSeconds: 600,
    });
    if (!ipLimit.allowed) {
      return redirectWith(request, 'error');
    }

    const formData = await request.formData();
    const adSoyad = formData.get('adsoyad')?.toString().trim() || '';
    const telefon = formData.get('telefon')?.toString().trim() || '';
    const email = formData.get('email')?.toString().trim() || '';
    const konu = formData.get('konu')?.toString().trim() || '';
    const mesaj = formData.get('mesaj')?.toString().trim() || '';

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!adSoyad || !email || !konu || !mesaj || !emailRegex.test(email)) {
      return redirectWith(request, 'error');
    }

    await createContactMessage({
      adSoyad: adSoyad.slice(0, 180),
      telefon: telefon.slice(0, 40),
      email: email.slice(0, 180),
      konu: konu.slice(0, 120),
      mesaj: mesaj.slice(0, 5000),
    });

    return redirectWith(request, 'success');
  } catch (error) {
    console.error('[/api/contact] Hata:', error);
    return redirectWith(request, 'error');
  }
};
