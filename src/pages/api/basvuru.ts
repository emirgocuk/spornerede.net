/**
 * basvuru.ts
 * POST /api/basvuru
 * Kulüp başvuru formundan gelen veriyi alır,
 * Nodemailer ile kurucu e-postasına bildirim gönderir.
 *
 * Gerekli .env değişkenleri:
 *   SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS, MAIL_TO
 */
import type { APIRoute } from 'astro';
import { createClubApplication } from '../../lib/repositories/applications';

export const prerender = false; // SSR: bu endpoint her istekte çalışır

export const POST: APIRoute = async ({ request }) => {
  try {
    const formData = await request.formData();

    // Form alanlarını oku
    const kulupad   = formData.get('kulupad')?.toString()?.trim()   || '';
    const il        = formData.get('il')?.toString()?.trim()        || '';
    const ilce      = formData.get('ilce')?.toString()?.trim()      || '';
    const brans     = formData.get('brans')?.toString()?.trim()      || '';
    const paket     = formData.get('paket')?.toString()?.trim()      || '';
    const adres     = formData.get('adres')?.toString()?.trim()      || '';
    const yasaraligi = formData.get('yasaraligi')?.toString()?.trim() || '';
    const fiyat     = formData.get('fiyat')?.toString()?.trim()      || '';
    const aciklama  = formData.get('aciklama')?.toString()?.trim()   || '';
    const yetkili   = formData.get('yetkili')?.toString()?.trim()    || '';
    const telefon   = formData.get('telefon')?.toString()?.trim()    || '';
    const email     = formData.get('email')?.toString()?.trim()      || '';

    // Zorunlu alan kontrolü
    if (!kulupad || !il || !ilce || !brans || !paket || !yetkili || !telefon || !email) {
    const applicationResult = await createClubApplication({
      kulupad,
      il,
      ilce,
      brans,
      adres,
      yasaraligi,
      fiyat,
      aciklama,
      yetkili,
      telefon,
      email,
      paket,
    });

      return new Response(
        JSON.stringify({ success: false, error: 'Zorunlu alanlar eksik.' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // E-posta doğrulama (basit regex)
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return new Response(
        JSON.stringify({ success: false, error: 'Geçersiz e-posta adresi.' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Nodemailer gönderimi
    const nodemailer = await import('nodemailer');

    const transporter = nodemailer.default.createTransport({
      host:   import.meta.env.SMTP_HOST,
      port:   Number(import.meta.env.SMTP_PORT ?? 587),
      secure: import.meta.env.SMTP_PORT === '465',
      auth: {
        user: import.meta.env.SMTP_USER,
        pass: import.meta.env.SMTP_PASS,
      },
    });

    const mailHtml = `
      <div style="font-family: 'Outfit', Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #f8f9fa; padding: 32px; border-radius: 12px;">
        <div style="background: #E30A17; color: white; padding: 20px 24px; border-radius: 8px 8px 0 0; margin-bottom: 0;">
          <h1 style="margin:0; font-size:1.4rem; font-weight:900;">🏆 Yeni Kulüp Başvurusu</h1>
          <p style="margin:4px 0 0; opacity:0.8; font-size:0.9rem;">SporNerede.net — ${new Date().toLocaleDateString('tr-TR', { day:'2-digit', month:'long', year:'numeric', hour:'2-digit', minute:'2-digit' })}</p>
        </div>
        <div style="background: white; padding: 28px 24px; border-radius: 0 0 8px 8px; border: 1px solid #e9ecef; border-top:none;">

          <h2 style="font-size:1rem; color:#6c757d; font-weight:700; text-transform:uppercase; letter-spacing:.06em; margin:0 0 16px;">Kulüp Bilgileri</h2>
          <table style="width:100%; border-collapse:collapse; margin-bottom:24px;">
            <tr style="border-bottom:1px solid #f1f3f5;">
              <td style="padding:10px 8px; color:#6c757d; font-size:.88rem; width:35%;">Kulüp / Kurs Adı</td>
              <td style="padding:10px 8px; color:#212529; font-weight:700;">${kulupad}</td>
            </tr>
            <tr style="border-bottom:1px solid #f1f3f5;">
              <td style="padding:10px 8px; color:#6c757d; font-size:.88rem;">Branş</td>
              <td style="padding:10px 8px; color:#E30A17; font-weight:700;">${brans}</td>
            </tr>
            <tr style="border-bottom:1px solid #f1f3f5;">
              <td style="padding:10px 8px; color:#6c757d; font-size:.88rem;">Il</td>
              <td style="padding:10px 8px; color:#212529; font-weight:600;">${il}</td>
            </tr>
            <tr style="border-bottom:1px solid #f1f3f5;">
              <td style="padding:10px 8px; color:#6c757d; font-size:.88rem;">İlçe</td>
              <td style="padding:10px 8px; color:#212529; font-weight:600;">${ilce}</td>
            </tr>
            ${adres ? `<tr style="border-bottom:1px solid #f1f3f5;"><td style="padding:10px 8px; color:#6c757d; font-size:.88rem;">Adres</td><td style="padding:10px 8px; color:#212529;">${adres}</td></tr>` : ''}
            ${yasaraligi ? `<tr style="border-bottom:1px solid #f1f3f5;"><td style="padding:10px 8px; color:#6c757d; font-size:.88rem;">Yaş Aralığı</td><td style="padding:10px 8px; color:#212529;">${yasaraligi}</td></tr>` : ''}
            ${fiyat ? `<tr style="border-bottom:1px solid #f1f3f5;"><td style="padding:10px 8px; color:#6c757d; font-size:.88rem;">Aylık Ücret</td><td style="padding:10px 8px; color:#212529;">${fiyat} ₺</td></tr>` : ''}
            <tr style="border-bottom:1px solid #f1f3f5;">
              <td style="padding:10px 8px; color:#6c757d; font-size:.88rem;">Uyelik Paketi</td>
              <td style="padding:10px 8px; color:#212529; font-weight:700;">${paket}</td>
            </tr>
          </table>

          <h2 style="font-size:1rem; color:#6c757d; font-weight:700; text-transform:uppercase; letter-spacing:.06em; margin:0 0 16px;">İletişim Bilgileri</h2>
          <table style="width:100%; border-collapse:collapse; margin-bottom:24px;">
            <tr style="border-bottom:1px solid #f1f3f5;">
              <td style="padding:10px 8px; color:#6c757d; font-size:.88rem; width:35%;">Yetkili</td>
              <td style="padding:10px 8px; color:#212529; font-weight:700;">${yetkili}</td>
            </tr>
            <tr style="border-bottom:1px solid #f1f3f5;">
              <td style="padding:10px 8px; color:#6c757d; font-size:.88rem;">Telefon</td>
              <td style="padding:10px 8px;"><a href="tel:${telefon.replace(/\s/g,'')}" style="color:#E30A17; font-weight:700;">${telefon}</a></td>
            </tr>
            <tr style="border-bottom:1px solid #f1f3f5;">
              <td style="padding:10px 8px; color:#6c757d; font-size:.88rem;">E-posta</td>
              <td style="padding:10px 8px;"><a href="mailto:${email}" style="color:#E30A17;">${email}</a></td>
            </tr>
          </table>

          ${aciklama ? `
          <h2 style="font-size:1rem; color:#6c757d; font-weight:700; text-transform:uppercase; letter-spacing:.06em; margin:0 0 12px;">Açıklama</h2>
          <div style="background:#f8f9fa; border-left:4px solid #E30A17; padding:16px; border-radius:0 8px 8px 0; font-size:.9rem; color:#495057; line-height:1.6;">${aciklama}</div>
          ` : ''}

        </div>
        <p style="text-align:center; color:#adb5bd; font-size:.78rem; margin-top:16px;">SporNerede.net — Türkiye'nin Spor Rehberi</p>
      </div>
    `;

    await transporter.sendMail({
      from:    `"SporNerede.net Başvuru" <${import.meta.env.SMTP_USER}>`,
      to:      import.meta.env.MAIL_TO,
      subject: `🏆 Yeni Kulup Basvurusu: ${kulupad} — ${brans} (${il}/${ilce})`,
      html:    mailHtml,
      replyTo: email,
    });

    console.info('Basvuru kaydedildi:', applicationResult);

    // Başarılı: basvuru sayfasına success parametresiyle yönlendir
    return Response.redirect(new URL('/basvuru?success=1', request.url), 303);

  } catch (err) {
    console.error('[/api/basvuru] Hata:', err);
    return new Response(
      JSON.stringify({ success: false, error: 'Sunucu hatası. Lütfen tekrar deneyin.' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
};
