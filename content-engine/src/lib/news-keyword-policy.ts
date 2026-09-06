/** Otomatik haber uretiminde kullanilmayacak keyword kategorileri (sehir landing ve ansiklopedik nedir/nasil/faydalar konulari haric tutulur). */
export const NEWS_EXCLUDED_CATEGORIES = new Set([
  'sehir_brans',
  'nedir',
  'nasil',
  'faydalari',
]);

export function isKeywordEligibleForNews(kategori: string): boolean {
  return !NEWS_EXCLUDED_CATEGORIES.has(String(kategori ?? '').trim());
}
