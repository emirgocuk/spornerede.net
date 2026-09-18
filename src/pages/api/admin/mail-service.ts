import type { APIRoute } from 'astro';
import { isAdminAuthorized } from '../../../lib/adminAuth';
import { getCurrentSessionUser } from '../../../lib/auth/session';
import { getDb, hasDatabaseUrl } from '../../../db/client';
import { listApprovedAdminClubs, getApprovedAdminClubById, createOrGetClubUpdateToken } from '../../../lib/repositories/adminClubs';
import { buildApplicationNotificationMail, buildClubAnnouncementMail, buildClubFreshnessVerificationMail } from '../../../lib/mail/templates';
import { sendDirectMail, enqueueMail } from '../../../lib/mail/service';
import { requestBulkMailOtp, verifyBulkMailOtp } from '../../../lib/mail/otp';

export const prerender = false;

const ADMIN_OTP_EMAIL = 'neredespor@gmail.com';

async function getAdminEmail(request: Request): Promise<string> {
  return ADMIN_OTP_EMAIL;
}

export const GET: APIRoute = async ({ request }) => {
  if (!(await isAdminAuthorized(request))) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), {
      status: 401,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  const url = new URL(request.url);
  const action = url.searchParams.get('action') || 'stats';

  if (action === 'preview') {
    const kulupAdi = url.searchParams.get('kulupAdi') || 'Örnek Spor Kulübü';
    const baslik = url.searchParams.get('baslik') || 'SporNerede.net Kulüp Duyurusu';
    const ozet = url.searchParams.get('ozet') || '';
    const icerikHtml = url.searchParams.get('icerikHtml') || '<p>Duyuru içeriği buraya gelecektir.</p>';
    const ctaText = url.searchParams.get('ctaText') || '';
    const ctaUrl = url.searchParams.get('ctaUrl') || '';

    const { html } = buildClubAnnouncementMail({
      kulupAdi,
      baslik,
      ozet,
      icerikHtml,
      ctaText,
      ctaUrl,
    });

    return new Response(html, {
      status: 200,
      headers: { 'Content-Type': 'text/html; charset=utf-8' },
    });
  }

  if (action === 'stats') {
    try {
      const clubs = await listApprovedAdminClubs().catch(() => []);
      const totalClubs = clubs.length;
      const clubsWithEmail = clubs.filter((c) => Boolean(c.email && c.email.includes('@'))).length;

      let queuePending = 0;
      let queueTotal = 0;

      if (hasDatabaseUrl()) {
        const db = await getDb();
        const queued = await db.collection('mail_kuyrugu').getFullList({ batch: 200 }).catch(() => []);
        queueTotal = queued.length;
        queuePending = queued.filter((r) => r.status === 'pending').length;
      }

      const resBody = {
        success: true,
        stats: {
          totalClubs,
          clubsWithEmail,
          queuePending,
          queueTotal,
        },
      };

      return new Response(
        JSON.stringify({ ...resBody, data: resBody }),
        { headers: { 'Content-Type': 'application/json' } }
      );
    } catch (err: any) {
      return new Response(JSON.stringify({ success: false, error: err?.message || 'Stats error' }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      });
    }
  }

  if (action === 'club_freshness_draft') {
    const clubId = Number(url.searchParams.get('clubId'));
    if (!clubId) {
      return new Response(JSON.stringify({ success: false, error: 'clubId parametresi zorunludur.' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const club = await getApprovedAdminClubById(clubId);
    if (!club) {
      return new Response(JSON.stringify({ success: false, error: 'Kulüp bulunamadı.' }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const tokenData = await createOrGetClubUpdateToken(clubId);
    const siteUrl = process.env.SITE_URL ?? 'https://spornerede.net';
    const magicLink = `${siteUrl}/kulup-guncelle?token=${tokenData?.token}`;
    const mail = buildClubFreshnessVerificationMail({
      kulupAdi: club.ad,
      yetkili: club.yetkili,
      ilce: club.ilce,
      il: club.il,
      magicLink,
    });

    return new Response(
      JSON.stringify({
        success: true,
        club,
        token: tokenData?.token,
        magicLink,
        subject: mail.subject,
        html: mail.html,
      }),
      { headers: { 'Content-Type': 'application/json' } }
    );
  }

  return new Response(JSON.stringify({ error: 'Unknown action' }), { status: 400 });
};

export const POST: APIRoute = async ({ request }) => {
  if (!(await isAdminAuthorized(request))) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), {
      status: 401,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  const payload = await request.json().catch(() => ({}));
  const action = payload.action;

  // 1. Test Announcement Email to admin
  if (action === 'test_announcement') {
    const toEmail = payload.toEmail?.trim();
    if (!toEmail || !toEmail.includes('@')) {
      return new Response(JSON.stringify({ success: false, error: 'Geçerli bir test e-posta adresi belirtin.' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const { subject, html } = buildClubAnnouncementMail({
      kulupAdi: payload.kulupAdi || 'Kadıköy Basketbol Akademi',
      baslik: payload.baslik || '2026-2027 Yeni Sezon Kulüp Gelişmeleri',
      ozet: payload.ozet || 'SporNerede.net platformundaki yeni özellikler ve kulüplerimiz için fırsatlar.',
      icerikHtml:
        payload.icerikHtml ||
        `<p>Yeni sezon yaklaşırken kulüp profilinizin veliler tarafından daha kolay bulunması için antrenman saatlerinizi ve fotoğraflarınızı güncellemenizi öneririz.</p>
         <p>Bu bir test bültenidir. Canlı gönderimde her kulübe kendi adı ve branşıyla kişiselleştirilmiş olarak iletilecektir.</p>`,
      ctaText: payload.ctaText || 'Kulüp Panelini Ziyaret Et',
      ctaUrl: payload.ctaUrl || 'https://spornerede.net/panel',
      ilce: 'Kadıköy',
      brans: 'Basketbol',
    });

    try {
      await sendDirectMail({
        toEmail,
        subject: `[TEST] ${subject}`,
        html,
      });

      const resBody = {
        success: true,
        message: `Test duyuru e-postası başarıyla gönderildi (${toEmail}).`,
      };

      return new Response(
        JSON.stringify({ ...resBody, data: resBody }),
        { headers: { 'Content-Type': 'application/json' } }
      );
    } catch (err: any) {
      console.error('[mail-service] sendDirectMail error:', err);
      return new Response(
        JSON.stringify({
          success: false,
          error: `E-posta gönderilemedi: ${err?.message || 'SMTP hatası'}`,
        }),
        { status: 500, headers: { 'Content-Type': 'application/json' } }
      );
    }
  }

  // 2. Test Application Notification Email to admin (The upgraded application template)
  if (action === 'test_application') {
    const toEmail = payload.toEmail?.trim();
    if (!toEmail || !toEmail.includes('@')) {
      return new Response(JSON.stringify({ success: false, error: 'Geçerli bir test e-posta adresi belirtin.' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const appMail = buildApplicationNotificationMail({
      kulupad: 'Kadıköy Basketbol Akademi (Test Başvurusu)',
      brans: 'Basketbol',
      il: 'İstanbul',
      ilce: 'Kadıköy',
      yetkili: 'Ahmet Yılmaz',
      telefon: '+90 532 123 45 67',
      email: toEmail,
      paket: 'Standart Yıllık Paket',
      aciklama: '2026-2027 kış sezonu kayıtları ve altyapı takımlarımız için SporNerede üzerinden sporcu kabul etmek istiyoruz.',
    });

    try {
      await sendDirectMail({
        toEmail,
        subject: `[YENİ BAŞVURU BİLDİRİMİ] ${appMail.subject}`,
        html: appMail.html,
      });

      const resBody = {
        success: true,
        message: `Yenilenen başvuru bildirim maili başarıyla gönderildi (${toEmail}).`,
      };

      return new Response(
        JSON.stringify({ ...resBody, data: resBody }),
        { headers: { 'Content-Type': 'application/json' } }
      );
    } catch (err: any) {
      console.error('[mail-service] test_application error:', err);
      return new Response(
        JSON.stringify({
          success: false,
          error: `Başvuru test maili gönderilemedi: ${err?.message || 'SMTP hatası'}`,
        }),
        { status: 500, headers: { 'Content-Type': 'application/json' } }
      );
    }
  }

  // 3. Request 6-digit OTP for bulk mail authorization (Sent to admin: neredespor@gmail.com)
  if (action === 'request_bulk_otp') {
    try {
      const res = await requestBulkMailOtp(ADMIN_OTP_EMAIL);
      const resData = {
        success: true,
        message: `6 haneli güvenlik kodunuz ${res.maskedEmail} adresine gönderildi.`,
        maskedEmail: res.maskedEmail,
        targetEmail: ADMIN_OTP_EMAIL,
      };
      return new Response(
        JSON.stringify({
          ...resData,
          data: resData,
        }),
        { headers: { 'Content-Type': 'application/json' } }
      );
    } catch (err: any) {
      console.error('[mail-service] request_bulk_otp error:', err);
      return new Response(
        JSON.stringify({
          success: false,
          error: `Güvenlik kodu gönderilemedi: ${err?.message || 'SMTP hatası'}`,
          data: { success: false, error: err?.message },
        }),
        { status: 500, headers: { 'Content-Type': 'application/json' } }
      );
    }
  }

  // 4. Queue bulk announcement to all clubs (requires valid OTP code from neredespor@gmail.com)
  if (action === 'queue_bulk') {
    const otpCode = payload.otpCode?.toString().trim();
    if (!otpCode || otpCode.length < 6) {
      return new Response(
        JSON.stringify({
          success: false,
          error: 'Lütfen e-postanıza gönderilen 6 haneli güvenlik kodunu girin.',
          data: { success: false },
        }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const otpCheck = verifyBulkMailOtp(ADMIN_OTP_EMAIL, otpCode);
    if (!otpCheck.valid) {
      return new Response(
        JSON.stringify({
          success: false,
          error: otpCheck.error || 'Geçersiz veya süresi dolmuş güvenlik kodu.',
          data: { success: false, error: otpCheck.error },
        }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const baslik = payload.baslik?.trim();
    const icerikHtml = payload.icerikHtml?.trim();
    const onlyTestEmail = payload.onlyTestEmail?.toString().trim();

    if (!baslik || !icerikHtml) {
      return new Response(
        JSON.stringify({
          success: false,
          error: 'Lütfen başlık ve içerik alanlarını doldurun.',
          data: { success: false },
        }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // If onlyTestEmail is specified (e.g. emrggck@gmail.com on test server), deliver to that customer address
    if (onlyTestEmail) {
      const { subject, html } = buildClubAnnouncementMail({
        kulupAdi: 'SporNerede Müşterisi (Test)',
        baslik,
        ozet: payload.ozet || '',
        icerikHtml,
        ctaText: payload.ctaText || '',
        ctaUrl: payload.ctaUrl || '',
        ilce: 'Kadıköy',
      });

      // Log into queue
      await enqueueMail({
        kind: 'club_announcement',
        toEmail: onlyTestEmail,
        subject: `[TEST MODU] ${subject}`,
        html,
      }).catch((err) => console.warn(`[mail-service] enqueue failed for ${onlyTestEmail}:`, err));

      // Deliver directly so test arrives in inbox immediately
      try {
        await sendDirectMail({
          toEmail: onlyTestEmail,
          subject: `[TEST MODU] ${subject}`,
          html,
        });
      } catch (err: any) {
        console.warn(`[mail-service] direct send failed for ${onlyTestEmail}:`, err);
      }

      const resData = {
        success: true,
        queuedCount: 1,
        message: `🎉 Test duyurusu başarıyla hedef müşteri ${onlyTestEmail} adresine ulaştırıldı!`,
      };

      return new Response(
        JSON.stringify({
          ...resData,
          data: resData,
        }),
        { headers: { 'Content-Type': 'application/json' } }
      );
    }

    const clubs = await listApprovedAdminClubs().catch(() => []);
    const eligibleClubs = clubs.filter((c) => Boolean(c.email && c.email.includes('@')));

    if (eligibleClubs.length === 0) {
      return new Response(
        JSON.stringify({ success: false, error: 'E-posta adresi kayıtlı onaylı kulüp bulunamadı.' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    let queuedCount = 0;
    for (const club of eligibleClubs) {
      const { subject, html } = buildClubAnnouncementMail({
        kulupAdi: club.ad,
        baslik,
        ozet: payload.ozet || '',
        icerikHtml,
        ctaText: payload.ctaText || '',
        ctaUrl: payload.ctaUrl || '',
        ilce: club.ilce,
      });

      await enqueueMail({
        kind: 'club_announcement',
        toEmail: club.email,
        subject,
        html,
      }).catch((err) => console.warn(`[mail-service] enqueue failed for ${club.email}:`, err));

      queuedCount++;
    }

    return new Response(
      JSON.stringify({
        success: true,
        queuedCount,
        message: `${queuedCount} kulüp için duyuru e-postası başarıyla gönderim kuyruğuna eklendi.`,
      }),
      { headers: { 'Content-Type': 'application/json' } }
    );
  }

  // 5. Send freshness verification mail to a specific club
  if (action === 'send_club_freshness') {
    const clubId = Number(payload.clubId);
    const isTest = payload.isTest !== false; // default true for testing phase
    const customMessage = payload.customMessage?.toString()?.trim() || '';
    const overrideEmail = payload.overrideEmail?.toString()?.trim();

    if (!clubId) {
      return new Response(JSON.stringify({ success: false, error: 'Kulüp ID belirtilmelidir.' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const club = await getApprovedAdminClubById(clubId);
    if (!club) {
      return new Response(JSON.stringify({ success: false, error: 'Kulüp bulunamadı.' }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const tokenData = await createOrGetClubUpdateToken(clubId);
    const siteUrl = process.env.SITE_URL ?? 'https://spornerede.net';
    const magicLink = `${siteUrl}/kulup-guncelle?token=${tokenData?.token}`;

    const { subject, html } = buildClubFreshnessVerificationMail({
      kulupAdi: club.ad,
      yetkili: club.yetkili,
      ilce: club.ilce,
      il: club.il,
      magicLink,
      customMessage,
    });

    const targetEmail = isTest ? 'emrggck@gmail.com' : (overrideEmail || club.email || 'emrggck@gmail.com');

    try {
      await sendDirectMail({
        toEmail: targetEmail,
        subject: isTest ? `[TEST MODU] ${subject}` : subject,
        html,
      });

      if (hasDatabaseUrl()) {
        const db = await getDb();
        await db.collection('admin_basvuru_loglari').create({
          legacyId: Date.now(),
          basvuruLegacyId: clubId,
          aksiyon: 'freshness_mail_sent',
          yeniDurum: 'approved',
          islemYapanEmail: targetEmail,
          notMetni: `Bilgi güncelleme maili ${targetEmail} adresine iletildi.`,
          atananAdminEmail: '',
          oncekiDurum: 'approved',
        }).catch(() => null);
      }

      return new Response(
        JSON.stringify({
          success: true,
          targetEmail,
          magicLink,
          message: `Bilgi güncelleme maili ${targetEmail} adresine iletildi.`,
        }),
        { headers: { 'Content-Type': 'application/json' } }
      );
    } catch (err: any) {
      console.error('[send_club_freshness] error:', err);
      return new Response(
        JSON.stringify({ success: false, error: `Mail gönderilemedi: ${err?.message || 'Hata'}` }),
        { status: 500, headers: { 'Content-Type': 'application/json' } }
      );
    }
  }

  // 6. Queue bulk freshness mail to all clubs (requires OTP)
  if (action === 'queue_bulk_freshness') {
    const otpCode = payload.otpCode?.toString().trim();
    if (!otpCode || otpCode.length < 6) {
      return new Response(
        JSON.stringify({
          success: false,
          error: 'Lütfen e-postanıza gönderilen 6 haneli güvenlik kodunu girin.',
        }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const otpCheck = verifyBulkMailOtp(ADMIN_OTP_EMAIL, otpCode);
    if (!otpCheck.valid) {
      return new Response(
        JSON.stringify({
          success: false,
          error: otpCheck.error || 'Geçersiz güvenlik kodu.',
        }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const onlyTestEmail = payload.onlyTestEmail?.toString().trim();
    const customMessage = payload.customMessage?.toString().trim() || '';

    if (onlyTestEmail) {
      const tokenData = await createOrGetClubUpdateToken(1787289523221).catch(() => null);
      const siteUrl = process.env.SITE_URL ?? 'https://spornerede.net';
      const magicLink = `${siteUrl}/kulup-guncelle?token=${tokenData?.token || 'test-token'}`;

      const { subject, html } = buildClubFreshnessVerificationMail({
        kulupAdi: 'Jas Campus (Test Kulübü)',
        yetkili: 'Emir Göçük',
        ilce: 'Çankaya',
        il: 'Ankara',
        magicLink,
        customMessage,
      });

      await sendDirectMail({
        toEmail: onlyTestEmail,
        subject: `[TEST MODU - TOPLU BİLGİ GÜNCELLEME] ${subject}`,
        html,
      });

      return new Response(
        JSON.stringify({
          success: true,
          queuedCount: 1,
          message: `Toplu güncelleme test maili ${onlyTestEmail} adresine başarıyla gönderildi!`,
        }),
        { headers: { 'Content-Type': 'application/json' } }
      );
    }

    const clubs = await listApprovedAdminClubs().catch(() => []);
    const eligibleClubs = clubs.filter((c) => Boolean(c.email && c.email.includes('@')));

    let queuedCount = 0;
    const siteUrl = process.env.SITE_URL ?? 'https://spornerede.net';

    for (const club of eligibleClubs) {
      const tokenData = await createOrGetClubUpdateToken(club.id).catch(() => null);
      const magicLink = `${siteUrl}/kulup-guncelle?token=${tokenData?.token || ''}`;

      const { subject, html } = buildClubFreshnessVerificationMail({
        kulupAdi: club.ad,
        yetkili: club.yetkili,
        ilce: club.ilce,
        il: club.il,
        magicLink,
        customMessage,
      });

      await enqueueMail({
        kind: 'club_announcement',
        toEmail: club.email,
        subject,
        html,
      }).catch((err) => console.warn(`[bulk-freshness] enqueue failed for ${club.email}:`, err));

      queuedCount++;
    }

    return new Response(
      JSON.stringify({
        success: true,
        queuedCount,
        message: `${queuedCount} kulübe bilgi güncelleme talebi kuyruğa eklendi.`,
      }),
      { headers: { 'Content-Type': 'application/json' } }
    );
  }

  return new Response(JSON.stringify({ error: 'Geçersiz aksiyon.' }), { status: 400 });
};
