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

export function buildApplicationNotificationMail(input: ApplicationNotificationInput) {
  const subject = `Yeni Kulup Basvurusu: ${input.kulupad} - ${input.brans} (${input.il}/${input.ilce})`;
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #f8f9fa; padding: 24px; border-radius: 12px;">
      <div style="background: #E30A17; color: white; padding: 16px 20px; border-radius: 8px;">
        <h1 style="margin:0; font-size:1.2rem;">Yeni Kulup Basvurusu</h1>
        <p style="margin:6px 0 0; opacity:0.9;">${input.kulupad} - ${input.brans} (${input.il}/${input.ilce})</p>
      </div>
      <div style="background: white; padding: 18px 20px; border: 1px solid #e9ecef; border-radius: 8px; margin-top: 12px;">
        <p><strong>Yetkili:</strong> ${input.yetkili}</p>
        <p><strong>Telefon:</strong> ${input.telefon}</p>
        <p><strong>E-posta:</strong> ${input.email}</p>
        <p><strong>Branş sayısı:</strong> ${input.paket}</p>
        ${input.aciklama ? `<p><strong>Aciklama:</strong> ${input.aciklama}</p>` : ''}
      </div>
    </div>
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
