/** Basit metin benzerligi — kelime-trigram Jaccard (basma kalip / duplicate yakalama) */

/** HTML etiketlerini sok, kucuk harfe cevir, noktalama temizle, bosluklari daralt */
export function normalizeForSimilarity(input: string): string {
  return String(input ?? '')
    .replace(/<[^>]*>/g, ' ')
    .toLocaleLowerCase('tr-TR')
    .replace(/[^\p{L}\p{N}\s]/gu, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function wordTrigrams(text: string): Set<string> {
  const words = normalizeForSimilarity(text).split(' ').filter(Boolean);
  const grams = new Set<string>();
  if (words.length < 3) {
    if (words.length) grams.add(words.join(' '));
    return grams;
  }
  for (let i = 0; i + 3 <= words.length; i += 1) {
    grams.add(`${words[i]} ${words[i + 1]} ${words[i + 2]}`);
  }
  return grams;
}

/** 0 (alakasiz) .. 1 (ayni) — kelime trigram kume Jaccard benzerligi */
export function trigramJaccard(a: string, b: string): number {
  const ga = wordTrigrams(a);
  const gb = wordTrigrams(b);
  if (ga.size === 0 || gb.size === 0) return 0;
  let inter = 0;
  for (const g of ga) if (gb.has(g)) inter += 1;
  const union = ga.size + gb.size - inter;
  return union === 0 ? 0 : inter / union;
}

/** Aday metnin korpustaki en yakin esleseme benzerligi */
export function maxSimilarity(candidate: string, corpus: string[]): number {
  let max = 0;
  for (const item of corpus) {
    const s = trigramJaccard(candidate, item);
    if (s > max) max = s;
    if (max >= 0.999) break;
  }
  return max;
}
