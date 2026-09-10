import crypto from 'node:crypto';
import { sendDirectMail } from './service';

type OtpRecord = {
  code: string;
  expiresAt: number;
  attempts: number;
};

// In-memory OTP storage keyed by email
const otpStore = new Map<string, OtpRecord>();

const OTP_TTL_MS = 5 * 60 * 1000; // 5 minutes
const MAX_ATTEMPTS = 3;

export function maskEmail(email: string): string {
  const [user, domain] = email.split('@');
  if (!domain) return email;
  const maskedUser = user.length <= 3 
    ? user[0] + '***' 
    : user.slice(0, 2) + '***' + user.slice(-1);
  return `${maskedUser}@${domain}`;
}

export async function requestBulkMailOtp(email: string): Promise<{ success: boolean; maskedEmail: string }> {
  const normalizedEmail = email.toLowerCase().trim();
  
  // Generate cryptographically secure 6-digit numeric code
  const code = crypto.randomInt(100000, 999999).toString();
  const expiresAt = Date.now() + OTP_TTL_MS;

  otpStore.set(normalizedEmail, {
    code,
    expiresAt,
    attempts: 0,
  });

  const siteUrl = process.env.SITE_URL ?? 'https://spornerede.net';
  const subject = `🔐 Toplu E-Posta Gönderim Onay Kodu: ${code}`;

  const html = `
<!DOCTYPE html>
<html lang="tr">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${subject}</title>
</head>
<body style="margin: 0; padding: 0; background-color: #f1f3f5; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;">
  <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%" style="background-color: #f1f3f5; padding: 30px 12px;">
    <tr>
      <td align="center">
        <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%" style="max-width: 540px; background-color: #ffffff; border-radius: 16px; overflow: hidden; box-shadow: 0 10px 25px rgba(0,0,0,0.06); border: 1px solid #e9ecef;">
          
          <!-- Header with Logo -->
          <tr>
            <td style="background: linear-gradient(135deg, #18191c 0%, #0d0e10 100%); padding: 20px 28px; text-align: left; border-bottom: 3px solid #E30A17;">
              <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%">
                <tr>
                  <td valign="middle" align="left">
                    <img src="cid:spornerede-logo" alt="Spor Nerede?" width="140" height="56" style="display: block; border: 0; width: 140px; height: 56px;" />
                  </td>
                  <td valign="middle" align="right">
                    <div style="display: inline-block; background: rgba(227, 10, 23, 0.2); color: #ff4d57; font-size: 11px; font-weight: 700; padding: 5px 12px; border-radius: 999px; text-transform: uppercase;">
                      🔐 Güvenlik Onayı
                    </div>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Body -->
          <tr>
            <td style="padding: 32px 28px; text-align: center;">
              <h2 style="margin: 0 0 12px 0; color: #0f172a; font-size: 20px; font-weight: 800;">
                Toplu E-Posta Gönderim Onayı
              </h2>
              <p style="margin: 0 0 24px 0; color: #475569; font-size: 14px; line-height: 1.6;">
                SporNerede.net yönetim panelinden kayıtlı kulüplere toplu duyuru göndermek için bir işlem başlatıldı. Bu işlemi onaylamak için aşağıdaki 6 haneli güvenlik kodunu paneldeki ekrana girin:
              </p>

              <!-- OTP Code Display -->
              <div style="background: #FFF1F2; border: 2px dashed #E30A17; border-radius: 12px; padding: 18px 24px; display: inline-block; margin: 0 auto 24px auto;">
                <span style="font-family: 'Courier New', Courier, monospace; font-size: 34px; font-weight: 900; letter-spacing: 8px; color: #E30A17;">
                  ${code}
                </span>
              </div>

              <p style="margin: 0; color: #94a3b8; font-size: 12.5px; line-height: 1.5;">
                ⏱️ Bu kod <strong>5 dakika</strong> boyunca geçerlidir.<br>
                Bu işlemi siz başlatmadıysanız lütfen bu e-postayı dikkate almayın ve admin şifrenizi kontrol edin.
              </p>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="background-color: #f8f9fa; padding: 16px 28px; text-align: center; font-size: 11.5px; color: #94a3b8; border-top: 1px solid #e9ecef;">
              SporNerede.net Güvenlik Sistemi
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>
  `;

  await sendDirectMail({
    toEmail: normalizedEmail,
    subject,
    html,
  });

  return {
    success: true,
    maskedEmail: maskEmail(normalizedEmail),
  };
}

export function verifyBulkMailOtp(email: string, enteredCode: string): { valid: boolean; error?: string } {
  const normalizedEmail = email.toLowerCase().trim();
  const record = otpStore.get(normalizedEmail);

  if (!record) {
    return { valid: false, error: 'Güvenlik kodu bulunamadı veya süresi doldu. Lütfen tekrar kod isteyin.' };
  }

  if (Date.now() > record.expiresAt) {
    otpStore.delete(normalizedEmail);
    return { valid: false, error: 'Güvenlik kodunun süresi (5 dakika) doldu. Lütfen tekrar kod isteyin.' };
  }

  if (record.attempts >= MAX_ATTEMPTS) {
    otpStore.delete(normalizedEmail);
    return { valid: false, error: 'Çok fazla hatalı kod denendi. Güvenlik nedeniyle yeni bir kod istemeniz gerekir.' };
  }

  const cleanEntered = enteredCode.replace(/\s+/g, '').trim();
  if (cleanEntered !== record.code) {
    record.attempts++;
    const remaining = MAX_ATTEMPTS - record.attempts;
    return { valid: false, error: `Hatalı güvenlik kodu. Kalan deneme hakkı: ${remaining}` };
  }

  // Code is valid! Invalidate immediately to prevent replay attacks
  otpStore.delete(normalizedEmail);
  return { valid: true };
}
