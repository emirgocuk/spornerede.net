import {
  stripAllInternalLinksFooters,
  stripCeKonuFromOzet,
} from './contentEngine/newsDraftQuality';

function truncateAtWord(text: string, max: number): string {
  const t = text.trim();
  if (t.length <= max) return t;
  const cut = t.slice(0, max - 1);
  const lastSpace = cut.lastIndexOf(' ');
  const base = lastSpace > 48 ? cut.slice(0, lastSpace) : cut;
  return `${base.trim()}…`;
}

function htmlToPlainSnippet(html: string): string {
  const firstP = html.match(/<p[^>]*>([\s\S]*?)<\/p>/i)?.[1];
  const source = firstP ?? html;
  return source
    .replace(/<h2[^>]*>[\s\S]*?<\/h2>/gi, ' ')
    .replace(/<[^>]*>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

/** Haber listesi / kart — kisa ilgi cekici metin (tam makale degil) */
export function buildNewsCardExcerpt(
  input: { ozet?: string; seoDescription?: string; baslik?: string },
  maxLen = 155,
): string {
  const seo = String(input.seoDescription ?? '').trim();
  if (seo.length >= 48) return truncateAtWord(seo, maxLen);

  const raw = String(input.ozet ?? '');
  const { body } = stripCeKonuFromOzet(raw);
  const cleaned = stripAllInternalLinksFooters(body)
    .replace(/<!--[\s\S]*?-->/g, '')
    .trim();

  let plain = htmlToPlainSnippet(cleaned);
  if (plain.length < 40) {
    plain = cleaned
      .replace(/<[^>]*>/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();
  }
  if (plain.length < 24) {
    plain = String(input.baslik ?? '').trim();
  }

  return truncateAtWord(plain, maxLen);
}
