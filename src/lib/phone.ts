/**
 * Telefon numarası temizleme ve standart formatlama kuralı.
 * İstenen standart: +90 531 707 26 96
 */

/**
 * Numaranın rakamlarını temizler ve uluslararası formatta '905xxxxxxxxx' haline getirir.
 */
export function cleanPhoneNumber(phone?: string | null): string | null {
  if (!phone) return null;
  let digits = String(phone).replace(/\D/g, '');
  if (!digits) return null;

  // Başındaki 0090 veya 90 temizliği
  if (digits.startsWith('0090')) {
    digits = digits.slice(4);
  } else if (digits.startsWith('90') && digits.length === 12) {
    digits = digits.slice(2);
  }

  // Başındaki 0 temizliği (örn 0531... -> 531...)
  if (digits.startsWith('0') && digits.length === 11) {
    digits = digits.slice(1);
  }

  // Eğer 10 haneli standart Türk cep telefonu ise (5XX...)
  if (digits.length === 10) {
    return `90${digits}`;
  }

  return digits;
}

/**
 * Kullanıcıya gösterilen görünüm formatı:
 * Örnek: '5317072696' veya '05317072696' -> '+90 531 707 26 96'
 */
export function formatPhoneDisplay(phone?: string | null): string {
  if (!phone) return 'Belirtilmedi';
  let digits = String(phone).replace(/\D/g, '');
  if (!digits) return String(phone);

  if (digits.startsWith('0090')) {
    digits = digits.slice(4);
  } else if (digits.startsWith('90') && digits.length === 12) {
    digits = digits.slice(2);
  }

  if (digits.startsWith('0') && digits.length === 11) {
    digits = digits.slice(1);
  }

  if (digits.length === 10) {
    // 531 707 26 96 -> +90 531 707 26 96
    const p1 = digits.slice(0, 3);
    const p2 = digits.slice(3, 6);
    const p3 = digits.slice(6, 8);
    const p4 = digits.slice(8, 10);
    return `+90 ${p1} ${p2} ${p3} ${p4}`;
  }

  return phone;
}

/**
 * href="tel:..." için link formatı
 */
export function formatPhoneTelLink(phone?: string | null): string | null {
  const cleaned = cleanPhoneNumber(phone);
  if (!cleaned) return null;
  return `tel:+${cleaned}`;
}

/**
 * Veritabanına kaydederken veya form doğrulamalarında standart format döndürür.
 * Geçersiz/boş ise boş string döner.
 */
export function normalizePhoneNumber(phone?: string | null): string {
  if (!phone) return '';
  const formatted = formatPhoneDisplay(phone);
  return formatted === 'Belirtilmedi' ? '' : formatted;
}
