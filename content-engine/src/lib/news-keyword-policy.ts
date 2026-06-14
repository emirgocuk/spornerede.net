/** Otomatik haber uretiminde kullanilmayacak keyword kategorileri (sehir landing icin, haber degil). */
export const NEWS_EXCLUDED_CATEGORIES = new Set(['sehir_brans']);

export function isKeywordEligibleForNews(kategori: string): boolean {
  return !NEWS_EXCLUDED_CATEGORIES.has(String(kategori ?? '').trim());
}
