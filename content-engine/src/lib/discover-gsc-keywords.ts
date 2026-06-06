import type PocketBase from 'pocketbase';
import type { GscQueryRow } from '../gsc/client.js';

const SPORT_HINTS = [
  'spor',
  'kurs',
  'kursu',
  'kulup',
  'kulüb',
  'antrenman',
  'voleybol',
  'basketbol',
  'futbol',
  'yuzme',
  'yüzme',
  'tenis',
  'jimnastik',
  'kano',
  'bisiklet',
  'pilates',
  'yoga',
  'hentbol',
  'badminton',
  'atletizm',
  'boks',
  'judo',
  'karate',
];

const MIN_IMPRESSIONS = 15;
const MAX_NEW_PER_RUN = 12;

function isRelevantGscQuery(query: string): boolean {
  const n = query.toLowerCase().trim();
  if (n.length < 5 || n.length > 90) return false;
  if (/^(site:|spornerede)/i.test(n)) return false;
  return SPORT_HINTS.some((h) => n.includes(h));
}

function scoreFromGsc(row: GscQueryRow): number {
  let skor = 12;
  skor += Math.min(50, Math.floor(row.impressions / 10));
  if (row.impressions >= 50 && row.ctr < 0.03) skor += 15;
  if (row.clicks >= 5) skor += 5;
  return skor;
}

function guessCategory(query: string): { kategori: string; niyet: string } {
  const n = query.toLowerCase();
  if (/\b(nedir|fayda|faydalari)\b/.test(n)) return { kategori: 'nedir', niyet: 'bilgi' };
  if (/\b(nasil|nasıl)\b/.test(n)) return { kategori: 'nasil', niyet: 'bilgi' };
  if (/\b(cocuk|çocuk|okul|ebeveyn)\b/.test(n)) return { kategori: 'ebeveyn', niyet: 'yonlendirme' };
  return { kategori: 'gsc_kesif', niyet: 'islem' };
}

/** GSC'de gorunen ama kuyrukta olmayan sorgulari keyword olarak ekler */
export async function discoverGscKeywords(
  pb: PocketBase,
  gscRows: GscQueryRow[],
  existingKeys: Set<string>,
): Promise<number> {
  const candidates = gscRows
    .filter((r) => r.query && !existingKeys.has(r.query))
    .filter((r) => r.impressions >= MIN_IMPRESSIONS)
    .filter((r) => isRelevantGscQuery(r.query))
    .sort((a, b) => b.impressions - a.impressions);

  let added = 0;
  for (const row of candidates) {
    if (added >= MAX_NEW_PER_RUN) break;
    const { kategori, niyet } = guessCategory(row.query);
    try {
      await pb.collection('seo_keywords').create({
        anahtar: row.query,
        kategori,
        niyet,
        durum: 'kuyrukta',
        skor: scoreFromGsc(row),
        gsc_impression: row.impressions,
        site_context: {
          kaynak: 'gsc_kesif',
          gsc_clicks: row.clicks,
          gsc_ctr: row.ctr,
          gsc_position: row.position,
        },
      });
      existingKeys.add(row.query);
      added++;
    } catch {
      /* duplicate race */
    }
  }
  return added;
}
