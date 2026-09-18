import type { APIRoute } from 'astro';
import { getClubByUpdateToken, applyClubSelfUpdate } from '../../../lib/repositories/adminClubs';
import { verifyClubUpdateOtp } from '../../../lib/mail/otp';
import { normalizePhoneNumber } from '../../../lib/phone';

export const prerender = false;

export const POST: APIRoute = async ({ request }) => {
  try {
    const body = await request.json().catch(() => null);
    const token = body?.token?.toString()?.trim();
    const otpCode = body?.otpCode?.toString()?.trim();
    const fields = body?.fields || {};

    if (!token || !otpCode) {
      return new Response(
        JSON.stringify({ success: false, error: 'Eksik parametre: token ve onay kodu zorunludur.' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const club = await getClubByUpdateToken(token);
    if (!club) {
      return new Response(
        JSON.stringify({ success: false, error: 'Kulüp bulunamadı veya bağlantı süresi dolmuş.' }),
        { status: 404, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const verification = verifyClubUpdateOtp(club.id, otpCode);
    if (!verification.valid) {
      return new Response(
        JSON.stringify({ success: false, error: verification.error || 'Geçersiz onay kodu.' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const rawPhone = fields.telefon?.toString()?.trim() || club.telefon;
    const formattedPhone = normalizePhoneNumber(rawPhone) || rawPhone;

    const updated = await applyClubSelfUpdate(club.id, {
      ad: fields.ad?.toString()?.trim() || club.ad,
      yetkili: fields.yetkili?.toString()?.trim() || club.yetkili,
      telefon: formattedPhone,
      email: fields.email?.toString()?.trim() || club.email,
      adres: fields.adres?.toString()?.trim() ?? club.adres,
      aciklama: fields.aciklama?.toString()?.trim() ?? club.aciklama,
      yasAraligi: fields.yasAraligi?.toString()?.trim() ?? club.yasAraligi,
      fiyatBilgisi: fields.fiyatBilgisi?.toString()?.trim() ?? club.fiyatBilgisi,
    });

    return new Response(
      JSON.stringify({
        success: true,
        message: 'Kulüp bilgileriniz başarıyla güncellendi ve doğrulandı!',
        club: updated,
      }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );
  } catch (err: any) {
    console.error('[verify-update] error:', err);
    return new Response(
      JSON.stringify({ success: false, error: err?.message || 'Bilgiler güncellenemedi.' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
};
