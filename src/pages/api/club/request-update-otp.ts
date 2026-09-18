import type { APIRoute } from 'astro';
import { getClubByUpdateToken } from '../../../lib/repositories/adminClubs';
import { requestClubUpdateOtp } from '../../../lib/mail/otp';

export const prerender = false;

export const POST: APIRoute = async ({ request }) => {
  try {
    const body = await request.json().catch(() => null);
    const token = body?.token?.toString()?.trim();

    if (!token) {
      return new Response(JSON.stringify({ success: false, error: 'Geçersiz güncelleme anahtarı.' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const club = await getClubByUpdateToken(token);
    if (!club) {
      return new Response(
        JSON.stringify({ success: false, error: 'Kulüp bulunamadı veya bağlantı süresi dolmuş.' }),
        { status: 404, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Deliver OTP code to test recipient emrggck@gmail.com during this phase
    const res = await requestClubUpdateOtp(
      club.id,
      club.email,
      club.ad,
      club.yetkili,
      'emrggck@gmail.com'
    );

    return new Response(
      JSON.stringify({
        success: true,
        maskedEmail: res.maskedEmail,
        message: `6 haneli onay kodu ${res.maskedEmail} adresine iletildi.`,
      }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );
  } catch (err: any) {
    console.error('[request-update-otp] error:', err);
    return new Response(
      JSON.stringify({ success: false, error: err?.message || 'Onay kodu gönderilemedi.' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
};
