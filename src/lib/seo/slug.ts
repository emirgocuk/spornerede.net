/**
 * Slug yardimcilari.
 * URL'lerde Turkce karakter ve bosluk problemini cozer.
 * Format: <kanonik-slug>-<id>
 *
 * Ornek:
 *   - listing: "Atakoy Yuzme Baslangic Grubu" + id 42 -> "atakoy-yuzme-baslangic-grubu-42"
 *   - club:    "Atakoy Spor Kulubu" + id 17 -> "atakoy-spor-kulubu-17"
 */

function slugifyTr(value: string): string {
  const lower = String(value ?? '').toLocaleLowerCase('tr-TR');
  // Onerilen Turkce -> ASCII donusumu
  return lower
    .replace(/ğ/g, 'g')
    .replace(/ü/g, 'u')
    .replace(/ş/g, 's')
    .replace(/ı/g, 'i')
    .replace(/ö/g, 'o')
    .replace(/ç/g, 'c')
    .replace(/İ/g, 'i')
    .replace(/Ğ/g, 'g')
    .replace(/Ü/g, 'u')
    .replace(/Ş/g, 's')
    .replace(/I/g, 'i')
    .replace(/Ö/g, 'o')
    .replace(/Ç/g, 'c')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

export function clubSlug(input: { id: number | string; ad?: string }): string {
  const namePart = slugifyTr(input.ad ?? '');
  const part = namePart || 'kulup';
  return `${part}-${input.id}`;
}

export function listingSlug(input: {
  id: number | string;
  ad?: string;
  clubAd?: string;
}): string {
  const ilanPart = slugifyTr(input.ad ?? '') || 'ilan';
  const clubPart = slugifyTr(input.clubAd ?? '');
  const prefix = clubPart ? `${clubPart}-${ilanPart}` : ilanPart;
  return `${prefix}-${input.id}`;
}

/**
 * URL slug'inin sonundaki sayisal id'yi cikartir.
 * "atakoy-yuzme-42" -> 42
 * "42" -> 42
 * "abc" -> null
 */
export function extractIdFromSlug(slug: string | undefined): number | null {
  if (!slug) return null;
  const match = String(slug).match(/(\d+)\s*$/);
  if (!match) return null;
  const id = Number(match[1]);
  return Number.isFinite(id) ? id : null;
}

/**
 * Verilen slug pure-numeric mi?
 * "42" -> true, "atakoy-42" -> false
 */
export function isPureNumericSlug(slug: string | undefined): boolean {
  if (!slug) return false;
  return /^\d+$/.test(String(slug).trim());
}
