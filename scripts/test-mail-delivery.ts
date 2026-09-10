import { existsSync, readFileSync } from 'node:fs';
import { sendDirectMail } from '../src/lib/mail/service';
import { buildApplicationNotificationMail, buildClubAnnouncementMail } from '../src/lib/mail/templates';

// Load .env if not loaded
if (existsSync('.env')) {
  const lines = readFileSync('.env', 'utf8').split(/\r?\n/);
  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const eqIdx = trimmed.indexOf('=');
    if (eqIdx === -1) continue;
    const k = trimmed.slice(0, eqIdx).trim();
    const v = trimmed.slice(eqIdx + 1).trim();
    if (!process.env[k]) process.env[k] = v;
  }
}

async function run() {
  const recipient = process.argv[2] || process.env.MAIL_TO || 'info@spornerede.net';
  console.log('Sending test emails to:', recipient);

  // 1. Test the newly upgraded Application Notification Email
  console.log('\n--- 1. Testing Upgraded Application Notification Email ---');
  const appMail = buildApplicationNotificationMail({
    kulupad: 'Sincan Voleybol Akademi Spor Kulübü (Yenikent Şube)',
    brans: 'Voleybol',
    il: 'Ankara',
    ilce: 'Sincan',
    yetkili: 'Muammer Bey',
    telefon: '+90 506 701 63 06',
    email: 'ramazanefedogan78@gmail.com',
    paket: 'Ücretsiz Paket (1 Branş)',
    aciklama: '2026-2027 kış dönemi voleybol okulu ve altyapı takımlarımız için yeni sporcu kayıtları almak istiyoruz.',
  });

  try {
    const res1 = await sendDirectMail({
      toEmail: recipient,
      subject: `[TEST] ${appMail.subject}`,
      html: appMail.html,
    });
    console.log('✅ Application Notification Email sent successfully! MessageId:', res1.messageId);
  } catch (err: any) {
    console.error('❌ Failed to send Application Notification:', err.message);
  }

  // 2. Test the new Club Announcement / Newsletter Email
  console.log('\n--- 2. Testing Club Announcement / Newsletter Email ---');
  const annMail = buildClubAnnouncementMail({
    kulupAdi: 'Kadıköy Basketbol Akademi',
    baslik: '📢 2026-2027 Yeni Sezon Kulüp Gelişmeleri ve Fırsatları',
    ozet: 'SporNerede.net platformundaki yeni özellikler ve bölgenizdeki veli arama trendleri.',
    icerikHtml: `
      <p>Yeni sezon hazırlıkları hızla devam ederken, <strong>SporNerede.net</strong> üzerinde spor okulu arayan velilerin aramalarında %40'a varan bir artış gözlemliyoruz.</p>
      <p>Kulübünüzün bölgenizde arama yapan veliler tarafından ilk sıralarda tercih edilmesi için birkaç önemli tavsiyemiz var:</p>
      <ul>
        <li><strong>Fotoğraflar:</strong> Salon, saha ve antrenman fotoğrafları eksiksiz olan profiller 3 kat daha fazla veli araması almaktadır.</li>
        <li><strong>Yaş Grupları:</strong> 2026-2027 sezonu için açık olan yaş kategorilerini profilinize eklemeyi unutmayın.</li>
        <li><strong>İletişim Hattı:</strong> WhatsApp hattınızın doğruluğunu kulüp panelinizden teyit edebilirsiniz.</li>
      </ul>
      <p>Her türlü soru ve dostluk maçı eşleştirmeleri için bu e-postaya doğrudan yanıt yazabilirsiniz. Başarılı ve spor dolu bir sezon dileriz!</p>
    `,
    ctaText: 'Kulüp Profilinizi İnceleyin',
    ctaUrl: 'https://spornerede.net/panel',
    ilce: 'Kadıköy',
    brans: 'Basketbol',
  });

  try {
    const res2 = await sendDirectMail({
      toEmail: recipient,
      subject: `[TEST] ${annMail.subject}`,
      html: annMail.html,
    });
    console.log('✅ Club Announcement Email sent successfully! MessageId:', res2.messageId);
  } catch (err: any) {
    console.error('❌ Failed to send Club Announcement:', err.message);
  }
}

run();
