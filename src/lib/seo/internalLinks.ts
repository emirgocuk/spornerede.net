import type { GuideArticle } from '../repositories/seoArticles';
import type { NewsItem } from '../repositories/news';

const BRANS_TERMS: Record<string, string> = {
  voleybol: 'voleybol',
  basketbol: 'basketbol',
  futbol: 'futbol',
  yuzme: 'yuzme',
  tenis: 'tenis',
  judo: 'judo',
  boks: 'boks',
  jimnastik: 'jimnastik',
  atletizm: 'atletizm',
};

function normalize(text: string) {
  return text
    .toLowerCase()
    .replace(/ğ/g, 'g')
    .replace(/ü/g, 'u')
    .replace(/ş/g, 's')
    .replace(/ı/g, 'i')
    .replace(/ö/g, 'o')
    .replace(/ç/g, 'c');
}

function extractBransToken(...parts: string[]): string {
  const blob = normalize(parts.join(' '));
  for (const [key, term] of Object.entries(BRANS_TERMS)) {
    if (blob.includes(key)) return term;
  }
  return '';
}

/** Haber metninden /ara arama sorgusu */
export function buildAraSearchFromNews(haber: Pick<NewsItem, 'baslik' | 'kategori' | 'seoDescription'>): {
  href: string;
  label: string;
} {
  const brans = extractBransToken(haber.kategori, haber.baslik, haber.seoDescription);
  const q = brans || haber.kategori || 'spor kursu';
  const href = `/ara?q=${encodeURIComponent(q)}`;
  return {
    href,
    label: brans ? `${brans} kurslari ara` : `${haber.kategori} yakinindaki kurslar`,
  };
}

/** Baslik / kategori ile eslesen rehberler */
export function pickGuidesForNews(
  haber: Pick<NewsItem, 'baslik' | 'kategori' | 'seoDescription'>,
  guides: GuideArticle[],
  limit = 3,
): GuideArticle[] {
  const tokens = normalize(`${haber.baslik} ${haber.kategori} ${haber.seoDescription}`)
    .split(/\s+/)
    .filter((t) => t.length > 3);

  const scored = guides
    .map((g) => {
      const blob = normalize(`${g.baslik} ${g.metaDescription} ${g.slug.replace(/-/g, ' ')}`);
      let score = 0;
      for (const t of tokens) {
        if (blob.includes(t)) score += 2;
      }
      const brans = extractBransToken(haber.kategori, haber.baslik);
      if (brans && blob.includes(brans)) score += 5;
      return { g, score };
    })
    .filter((x) => x.score > 0)
    .sort((a, b) => b.score - a.score);

  return scored.slice(0, limit).map((x) => x.g);
}
