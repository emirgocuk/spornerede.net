export async function sendClubProvisionedMail(input: {
  to: string;
  clubName: string;
  email: string;
  tempPassword: string;
}) {
  const env = (name: string) => process.env[name] ?? import.meta.env[name];
  const smtpHost = env('SMTP_HOST');
  const smtpPortRaw = env('SMTP_PORT') ?? '587';
  const smtpPort = Number(smtpPortRaw);
  const smtpUser = env('SMTP_USER');
  const smtpPass = env('SMTP_PASS');
  const mailFrom = env('MAIL_FROM') || smtpUser;

  if (!smtpHost || !smtpUser || !smtpPass) {
    return { sent: false as const, reason: 'smtp_not_configured' };
  }

  const nodemailer = await import('nodemailer');
  const transporter = nodemailer.default.createTransport({
    host: smtpHost,
    port: smtpPort,
    secure: String(smtpPortRaw) === '465',
    auth: { user: smtpUser, pass: smtpPass },
  });

  const panelUrl = `${env('SITE_URL') ?? 'https://spornerede.net'}/panel/giris`;
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 620px; margin: 0 auto; padding: 20px;">
      <h2 style="margin:0 0 10px; color:#212529;">Kulup panel hesabiniz hazir</h2>
      <p style="color:#495057;">Merhaba, <strong>${input.clubName}</strong> icin panel hesabi olusturuldu.</p>
      <div style="border:1px solid #e9ecef; border-radius:8px; padding:12px; background:#f8f9fa;">
        <p style="margin:0 0 6px;"><strong>Giris e-postasi:</strong> ${input.email}</p>
        <p style="margin:0;"><strong>Gecici sifre:</strong> ${input.tempPassword}</p>
      </div>
      <p style="margin-top:12px; color:#495057;">Panel girisi: <a href="${panelUrl}">${panelUrl}</a></p>
      <p style="color:#6c757d; font-size:13px;">Guvenlik nedeniyle ilk giriste sifrenizi degistirmeniz onerilir.</p>
    </div>
  `;

  await transporter.sendMail({
    from: `"SporNerede.net" <${mailFrom}>`,
    to: input.to,
    subject: `Kulup panel hesabi hazir: ${input.clubName}`,
    html,
  });

  return { sent: true as const };
}
