import type { APIRoute } from 'astro';
import { createContactMessage } from '../../lib/repositories/contactMessages';

export const prerender = false;

function redirectWith(request: Request, status: 'success' | 'error') {
  const configuredSiteUrl = process.env.SITE_URL ?? import.meta.env.SITE_URL;
  const origin = configuredSiteUrl ? new URL(configuredSiteUrl).origin : new URL(request.url).origin;
  return Response.redirect(new URL(`/iletisim?status=${status}`, origin), 303);
}

export const POST: APIRoute = async ({ request }) => {
  try {
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
