type ApplicationNotificationInput = {
  kulupad: string;
  brans: string;
  il: string;
  ilce: string;
  yetkili: string;
  telefon: string;
  email: string;
  paket: string;
  aciklama: string;
};

export type ClubAnnouncementInput = {
  kulupAdi: string;
  baslik: string;
  icerikHtml: string;
  ozet?: string;
  ctaText?: string;
  ctaUrl?: string;
  ilce?: string;
  brans?: string;
  unsubscribeUrl?: string;
};

function getSiteUrl(): string {
  return process.env.SITE_URL ?? import.meta.env.SITE_URL ?? 'https://spornerede.net';
}

function cleanPhoneNumber(raw: string): string {
  const digits = raw.replace(/\D/g, '');
  if (digits.startsWith('90') && digits.length === 12) return digits;
  if (digits.startsWith('0') && digits.length === 11) return '9' + digits;
  if (digits.length === 10) return '90' + digits;
  return digits;
}

export function buildApplicationNotificationMail(
  input: ApplicationNotificationInput,
  options?: { logoSrc?: string }
) {
  const siteUrl = getSiteUrl();
  const logoSrc = options?.logoSrc || 'cid:spornerede-logo';
  const subject = `⚡ Yeni Kulüp Başvurusu: ${input.kulupad} (${input.il}/${input.ilce})`;
  const cleanPhone = cleanPhoneNumber(input.telefon);
  const waUrl = cleanPhone ? `https://wa.me/${cleanPhone}?text=${encodeURIComponent(`Merhaba ${input.yetkili}, SporNerede.net üzerinden yapmış olduğunuz kulüp başvurunuz tarafımıza ulaştı.`)}` : '';
  const adminUrl = `${siteUrl}/merkez`;

  const html = `
<!DOCTYPE html>
<html lang="tr">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${subject}</title>
</head>
<body style="margin: 0; padding: 0; background-color: #f1f3f5; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; -webkit-font-smoothing: antialiased;">
  <!-- Preheader (Inbox preview text) -->
  <div style="display: none; max-height: 0px; overflow: hidden; opacity: 0;">
    Yeni kulüp başvurusu alındı: ${input.kulupad} - ${input.il}/${input.ilce} - Yetkili: ${input.yetkili}
  </div>

  <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%" style="background-color: #f1f3f5; padding: 24px 12px;">
    <tr>
      <td align="center">
        <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%" style="max-width: 620px; background-color: #ffffff; border-radius: 16px; overflow: hidden; box-shadow: 0 10px 25px rgba(0,0,0,0.06); border: 1px solid #e9ecef;">
          
          <!-- Modern Dark Header with Brand Logo on Top-Left -->
          <tr>
            <td style="background: linear-gradient(135deg, #18191c 0%, #0d0e10 100%); padding: 20px 28px; text-align: left; border-bottom: 3px solid #E30A17;">
              <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%">
                <tr>
                  <td valign="middle" align="left">
                    <a href="${siteUrl}" target="_blank" style="text-decoration: none; display: inline-block;">
                      <img src="${logoSrc}" alt="Spor Nerede?" width="140" height="56" style="display: block; border: 0; width: 140px; height: 56px; max-width: 140px;" />
                    </a>
                  </td>
                  <td valign="middle" align="right">
                    <div style="display: inline-block; background: rgba(227, 10, 23, 0.18); border: 1px solid rgba(227, 10, 23, 0.35); color: #ff4d57; font-size: 11px; font-weight: 700; padding: 5px 12px; border-radius: 999px; text-transform: uppercase; letter-spacing: 0.8px;">
                      ⚡ Yönetim Bildirimi
                    </div>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Main Content Body -->
          <tr>
            <td style="padding: 28px 28px 20px 28px;">
              
              <!-- Title & Location Card -->
              <div style="background: #f8f9fa; border-radius: 12px; padding: 18px 20px; border: 1px solid #e9ecef; margin-bottom: 22px;">
                <h1 style="margin: 0 0 6px 0; font-size: 20px; font-weight: 800; color: #1e293b; line-height: 1.3;">
                  ${input.kulupad}
                </h1>
                <div style="margin-top: 4px;">
                  <span style="display: inline-block; background: #fee2e2; color: #b91c1c; font-size: 12px; font-weight: 700; padding: 3px 8px; border-radius: 6px; margin-right: 6px;">
                    📍 ${input.il} / ${input.ilce}
                  </span>
                  <span style="display: inline-block; background: #e0f2fe; color: #0369a1; font-size: 12px; font-weight: 700; padding: 3px 8px; border-radius: 6px;">
                    🏅 ${input.brans}
                  </span>
                </div>
              </div>

              <!-- Information Table -->
              <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%" style="font-size: 14px; border-collapse: separate; border-spacing: 0;">
                <tr>
                  <td style="padding: 10px 12px; border-bottom: 1px solid #f1f5f9; color: #64748b; font-weight: 600; width: 130px;">
                    👤 Yetkili Kişi
                  </td>
                  <td style="padding: 10px 12px; border-bottom: 1px solid #f1f5f9; color: #0f172a; font-weight: 700;">
                    ${input.yetkili}
                  </td>
                </tr>
                <tr>
                  <td style="padding: 10px 12px; border-bottom: 1px solid #f1f5f9; color: #64748b; font-weight: 600;">
                    📞 Telefon
                  </td>
                  <td style="padding: 10px 12px; border-bottom: 1px solid #f1f5f9; color: #0f172a; font-weight: 700;">
                    <a href="tel:${cleanPhone}" style="color: #E30A17; text-decoration: none; font-weight: 700;">
                      ${input.telefon}
                    </a>
                  </td>
                </tr>
                <tr>
                  <td style="padding: 10px 12px; border-bottom: 1px solid #f1f5f9; color: #64748b; font-weight: 600;">
                    ✉️ E-Posta
                  </td>
                  <td style="padding: 10px 12px; border-bottom: 1px solid #f1f5f9; color: #0f172a; font-weight: 600;">
                    <a href="mailto:${input.email}" style="color: #2563eb; text-decoration: none;">
                      ${input.email}
                    </a>
                  </td>
                </tr>
                <tr>
                  <td style="padding: 10px 12px; border-bottom: 1px solid #f1f5f9; color: #64748b; font-weight: 600;">
                    📦 Paket / Branş
                  </td>
                  <td style="padding: 10px 12px; border-bottom: 1px solid #f1f5f9; color: #0f172a; font-weight: 600;">
                    ${input.paket}
                  </td>
                </tr>
                ${input.aciklama ? `
                <tr>
                  <td valign="top" style="padding: 10px 12px; border-bottom: 1px solid #f1f5f9; color: #64748b; font-weight: 600;">
                    📝 Başvuru Notu
                  </td>
                  <td style="padding: 10px 12px; border-bottom: 1px solid #f1f5f9; color: #334155; line-height: 1.5;">
                    <div style="background: #fffbeb; border-left: 3px solid #f59e0b; padding: 8px 12px; border-radius: 4px; font-size: 13px;">
                      ${input.aciklama}
                    </div>
                  </td>
                </tr>` : ''}
              </table>

              <!-- Action Buttons -->
              <div style="margin-top: 26px; padding-top: 20px; border-top: 1px solid #e2e8f0;">
                <div style="color: #475569; font-size: 12px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 12px;">
                  Hızlı Yönetici Aksiyonları:
                </div>
                
                <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%">
                  <tr>
                    ${waUrl ? `
                    <td style="padding-right: 8px;" width="50%">
                      <a href="${waUrl}" target="_blank" style="display: block; text-align: center; background-color: #25D366; color: #ffffff; text-decoration: none; font-size: 13px; font-weight: 700; padding: 12px 14px; border-radius: 10px; box-shadow: 0 2px 8px rgba(37,211,102,0.3);">
                        💬 WhatsApp'tan Yaz
                      </a>
                    </td>` : ''}
                    <td style="padding-left: ${waUrl ? '8px' : '0'};" width="50%">
                      <a href="tel:${cleanPhone}" style="display: block; text-align: center; background-color: #334155; color: #ffffff; text-decoration: none; font-size: 13px; font-weight: 700; padding: 12px 14px; border-radius: 10px;">
                        📞 Hemen Ara
                      </a>
                    </td>
                  </tr>
                </table>

                <div style="margin-top: 12px; text-align: center;">
                  <a href="${adminUrl}" style="display: block; text-align: center; background: linear-gradient(135deg, #E30A17 0%, #c40813 100%); color: #ffffff; text-decoration: none; font-size: 14px; font-weight: 700; padding: 14px 20px; border-radius: 10px; box-shadow: 0 4px 14px rgba(227,10,23,0.35);">
                    👉 Admin Panelinde Başvuruyu İncele & Onayla
                  </a>
                </div>
              </div>

            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="background-color: #f8f9fa; padding: 18px 28px; text-align: center; font-size: 12px; color: #94a3b8; border-top: 1px solid #e9ecef;">
              Bu e-posta SporNerede.net başvuru sistemi tarafından otomatik olarak oluşturulmuştur.
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>
  `;

  return { subject, html };
}

export function buildClubAnnouncementMail(
  input: ClubAnnouncementInput,
  options?: { logoSrc?: string }
) {
  const siteUrl = getSiteUrl();
  const logoSrc = options?.logoSrc || 'cid:spornerede-logo';
  const subject = input.baslik;
  const preheader = input.ozet || `SporNerede.net ekibinden kulübünüz için önemli duyuru ve gelişmeler.`;
  const unsubUrl = input.unsubscribeUrl || `${siteUrl}/iletisim?konu=bulten_ayril`;

  // Interpolate dynamic tags if present
  let content = input.icerikHtml;
  content = content.replace(/\{\{kulupAdi\}\}/g, input.kulupAdi);
  content = content.replace(/\{\{ilce\}\}/g, input.ilce || 'bölgeniz');
  content = content.replace(/\{\{brans\}\}/g, input.brans || 'branşınız');

  const html = `
<!DOCTYPE html>
<html lang="tr">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${subject}</title>
</head>
<body style="margin: 0; padding: 0; background-color: #f4f5f7; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; -webkit-font-smoothing: antialiased;">
  <!-- Preheader text -->
  <div style="display: none; max-height: 0px; overflow: hidden; opacity: 0;">
    ${preheader}
  </div>

  <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%" style="background-color: #f4f5f7; padding: 30px 12px;">
    <tr>
      <td align="center">
        <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%" style="max-width: 600px; background-color: #ffffff; border-radius: 16px; overflow: hidden; box-shadow: 0 8px 30px rgba(0,0,0,0.06); border: 1px solid #e5e7eb;">
          
          <!-- Branded Top Bar with Official Logo on Top-Left -->
          <tr>
            <td style="background: linear-gradient(135deg, #18191c 0%, #0d0e10 100%); padding: 20px 28px; text-align: left; border-bottom: 3px solid #E30A17;">
              <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%">
                <tr>
                  <td valign="middle" align="left">
                    <a href="${siteUrl}" target="_blank" style="text-decoration: none; display: inline-block;">
                      <img src="${logoSrc}" alt="Spor Nerede?" width="140" height="56" style="display: block; border: 0; width: 140px; height: 56px; max-width: 140px;" />
                    </a>
                  </td>
                  <td valign="middle" align="right">
                    <div style="display: inline-block; background: rgba(227, 10, 23, 0.18); border: 1px solid rgba(227, 10, 23, 0.35); color: #ff4d57; font-size: 11px; font-weight: 700; padding: 5px 12px; border-radius: 999px; text-transform: uppercase; letter-spacing: 0.8px;">
                      📢 Kulüp Bülteni
                    </div>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Content Body -->
          <tr>
            <td style="padding: 36px 32px 28px 32px;">
              
              <!-- Main Title -->
              <h1 style="margin: 0 0 20px 0; font-size: 22px; font-weight: 800; color: #111827; line-height: 1.35; letter-spacing: -0.3px;">
                ${input.baslik}
              </h1>

              <!-- Dynamic Body Content -->
              <div style="color: #334155; font-size: 15px; line-height: 1.7; word-break: break-word;">
                ${content}
              </div>

              <!-- Action Button (CTA) if specified -->
              ${input.ctaUrl && input.ctaText ? `
              <div style="text-align: center; margin: 34px 0 16px 0;">
                <a href="${input.ctaUrl}" style="display: inline-block; background: linear-gradient(135deg, #E30A17 0%, #c40813 100%); color: #ffffff !important; text-decoration: none; font-size: 15px; font-weight: 700; padding: 14px 32px; border-radius: 10px; box-shadow: 0 4px 14px rgba(227, 10, 23, 0.35);">
                  ${input.ctaText} →
                </a>
              </div>` : ''}

              <!-- Signature -->
              <div style="margin-top: 32px; padding-top: 20px; border-top: 1px solid #f1f5f9; font-size: 14px; color: #475569; line-height: 1.6;">
                <p style="margin: 0 0 4px 0; font-weight: 700; color: #0f172a;">SporNerede.net Topluluk Ekibi</p>
                <p style="margin: 0; color: #64748b; font-size: 13px;">Kulübünüzün soru veya önerileri için bu e-postaya doğrudan yanıt verebilirsiniz.</p>
              </div>

            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="background-color: #f8f9fa; padding: 22px 28px; text-align: center; font-size: 12px; color: #94a3b8; border-top: 1px solid #e9ecef; line-height: 1.5;">
              <p style="margin: 0 0 6px 0;">
                Bu e-posta, kulübünüzün SporNerede.net sistemindeki kaydı kapsamında bilgilendirme amacıyla iletilmiştir.
              </p>
              <p style="margin: 0;">
                <a href="${unsubUrl}" style="color: #94a3b8; text-decoration: underline;">Bülten listesinden ayrıl</a> • 
                <a href="${siteUrl}" style="color: #94a3b8; text-decoration: underline;">spornerede.net</a>
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>
  `;

  return { subject, html };
}

export function buildPasswordResetMail(input: { resetUrl: string }) {
  const subject = 'Sifre sifirlama talebi';
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 620px; margin: 0 auto; padding: 20px;">
      <h2 style="margin:0 0 10px; color:#212529;">Sifre sifirlama</h2>
      <p style="color:#495057;">
        Hesabiniz icin sifre sifirlama talebi alindi. Asagidaki baglanti 15 dakika gecerlidir.
      </p>
      <p style="margin:18px 0;">
        <a href="${input.resetUrl}" style="display:inline-block; background:#E30A17; color:#fff; text-decoration:none; padding:10px 14px; border-radius:8px; font-weight:700;">
          Sifremi sifirla
        </a>
      </p>
      <p style="color:#6c757d; font-size:13px;">
        Bu istegi siz yapmadiysaniz bu e-postayi gormezden gelebilirsiniz.
      </p>
    </div>
  `;
  return { subject, html };
}
