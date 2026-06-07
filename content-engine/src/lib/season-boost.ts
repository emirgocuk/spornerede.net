import { currentMonthTr } from './tr-date.js';

/** Sezon etiketine göre keyword skoruna eklenecek bonus (0 TL iş kuralı). */
export function seasonScoreBoost(anahtar: string, kategori: string, month = currentMonthTr()): number {
  const text = `${anahtar} ${kategori}`.toLowerCase();

  const isSummer =
    month >= 4 && month <= 6 && /\b(yaz|yaz\s*kamp|yaz\s*kurs|yaz\s*okul|yaz\s*donem)/i.test(text);
  const isBackToSchool =
    month >= 7 && month <= 9 &&
    /\b(okula\s*d[oö]n[uü][sş]|okul\s*oncesi|eylul|agustos|a[gğ]ustos|sezon\s*bas)/i.test(text);

  if (isSummer) return 8;
  if (isBackToSchool) return 8;
  return 0;
}
