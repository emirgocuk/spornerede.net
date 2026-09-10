/** Haber taslağı kalite kontrolü — admin ve Content Engine */

export const MIN_NEWS_WORDS = 250;
export const MIN_NEWS_WORDS_TEMPLATE = 200;

const INTERNAL_LINKS_FOOTER_RE =
  /<p[^>]*>\s*(?:<strong>\s*)?(?:I|İ|i)lgili\s+sayfalar[\s\S]*?<\/p>/gi;
const RELATED_HABER_BLOCK_RE =
  /<p[^>]*>\s*(?:<strong>\s*)?(?:I|İ|i)lgili\s+haber(?:ler)?:[\s\S]*?<\/p>/gi;
const CLUB_LINKS_BLOCK_RE =
  /<p[^>]*>\s*(?:<strong>\s*)?(?:Platformda|Öne\s+çıkan)[\s\S]*?<\/p>/gi;
export const MIN_NEWS_H2 = 3;

const BRANSLAR = [
  'voleybol', 'basketbol', 'yuzme', 'yüzme', 'tenis', 'futbol', 'jimnastik', 'cimnastik', 'atletizm',
  'boks', 'judo', 'karate', 'hentbol', 'badminton', 'pilates', 'yoga', 'bisiklet', 'oryantiring',
  'satranc', 'satranç', 'gures', 'güreş', 'okculuk', 'okçuluk', 'kurek', 'kürek',
  'krav maga', 'krav-maga', 'kravmaga',
];

const INCOMPLETE_TAIL = /\b(ve|ile|icin|için|olan|olarak|kayit|kayıt|den|da|de|bir|the)\s*$/i;

export type NewsDraftAssessment = {
  complete: boolean;
  wordCount: number;
  h2Count: number;
  hasCta: boolean;
  hasInternalLinks: boolean;
  hasCompleteEnding: boolean;
  issues: string[];
};

export function stripCeKonuFromOzet(raw: string): { konu: string; body: string } {
  const html = String(raw ?? '');
  const match = html.match(/<!--\s*ce-konu:([\s\S]*?)\s*-->/i);
  const konu = match?.[1]?.trim() ?? '';
  const body = konu ? html.replace(/<!--\s*ce-konu:[\s\S]*?-->\s*/i, '').trim() : html.trim();
  return { konu, body };
}

export function wrapOzetWithKonu(konu: string, bodyHtml: string): string {
  const k = konu.trim();
  const body = String(bodyHtml ?? '').trim();
  if (!k) return body;
  return `<!-- ce-konu:${k} -->\n${body}`;
}

export function htmlToPlainText(html: string): string {
  return String(html ?? '')
    .replace(/<[^>]*>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

export function countWordsFromHtml(html: string): number {
  const text = htmlToPlainText(html);
  if (!text) return 0;
  return text.split(/\s+/).filter(Boolean).length;
}

export function countH2(html: string): number {
  return (String(html ?? '').match(/<h2[\s>]/gi) ?? []).length;
}

export function stripAllInternalLinksFooters(html: string): string {
  let out = String(html ?? '');
  const patterns = [INTERNAL_LINKS_FOOTER_RE, RELATED_HABER_BLOCK_RE, CLUB_LINKS_BLOCK_RE];
  for (const re of patterns) {
    let prev = '';
    while (prev !== out) {
      prev = out;
      out = out.replace(re, '');
    }
  }
  return out
    .replace(/<div[^>]*class="[^"]*ql-tooltip[^"]*"[\s\S]*?<\/div>/gi, '')
    .trim();
}

export function stripInternalLinksFooter(html: string): string {
  return stripAllInternalLinksFooters(html);
}

export function hasInternalLinksFooter(html: string): boolean {
  return /(?:I|İ|i)lgili\s+sayfalar/i.test(String(html ?? ''));
}

export function hasIncompleteEnding(html: string): boolean {
  const raw = String(html ?? '').trim();
  if (/<h2[^>]*>[^<]*$/i.test(raw)) return true;

  const mainHtml = stripInternalLinksFooter(raw);
  const text = htmlToPlainText(mainHtml);
  if (!text || text.length < 80) return true;

  const sentences = text.split(/(?<=[.!?…;])\s+/).filter((s) => s.trim().length > 12);
  const lastSentence = (sentences[sentences.length - 1] ?? text).trim();

  if (INCOMPLETE_TAIL.test(lastSentence)) return true;
  if (/[.!?…»"]\s*$/.test(lastSentence)) return false;

  if (text.length >= 200 && (text.match(/[.!?…]/g) ?? []).length >= 2) {
    return false;
  }

  const last = lastSentence.slice(-1);
  return lastSentence.length > 40 && !/[.!?…»"]/.test(last);
}

export function assessNewsDraft(bodyHtml: string, konu = '', opts?: { template?: boolean }): NewsDraftAssessment {
  const minWords = opts?.template ? MIN_NEWS_WORDS_TEMPLATE : MIN_NEWS_WORDS;
  const body = String(bodyHtml ?? '').trim();
  const wordCount = countWordsFromHtml(body);
  const h2Count = countH2(body);
  const text = htmlToPlainText(body).toLowerCase();
  const hasCta =
    text.includes('spornerede') &&
    (text.includes('ara') || text.includes('kayit') || text.includes('kayıt') || text.includes('takip'));
  const hasInternalLinks = /<a\s+[^>]*href=/i.test(body);
  const issues: string[] = [];

  if (wordCount < minWords) {
    issues.push(`Metin kisa (${wordCount}/${minWords} kelime).`);
  }
  if (h2Count < MIN_NEWS_H2) {
    issues.push(`En az ${MIN_NEWS_H2} alt baslik (h2) olmali (simdi: ${h2Count}).`);
  }
  const hasCompleteEnding = !hasIncompleteEnding(body);
  if (!hasCompleteEnding) {
    issues.push('Ana metin tam bitmiyor (son cumle nokta veya ünlem ile bitmeli).');
  }
  if (!hasCta) {
    issues.push('Son bolumde SporNerede CTA eksik.');
  }
  if (konu && !text.includes(konu.toLowerCase().split(/\s+/)[0] ?? '')) {
    const firstKw = konu.toLowerCase().split(/\s+/).find((w) => w.length > 3);
    if (firstKw && !text.includes(firstKw)) {
      issues.push(`Konu anahtari metinde zayif: "${konu}".`);
    }
  }

  const complete =
    wordCount >= minWords &&
    h2Count >= MIN_NEWS_H2 &&
    hasCompleteEnding &&
    hasCta;

  return {
    complete,
    wordCount,
    h2Count,
    hasCta,
    hasInternalLinks,
    hasCompleteEnding,
    issues,
  };
}

export function suggestNewsCategory(konu: string): { kategori: string; kategoriRenk: string } | null {
  const lower = konu.toLowerCase();
  const isBranch = BRANSLAR.some((b) => lower.includes(b));
  const isCityCourse = /\b(kursu|kurslari|kursları|kamplari|kampları)\b/.test(lower);
  if (isBranch || isCityCourse) {
    return { kategori: 'Spor', kategoriRenk: 'green' };
  }
  if (lower.includes('platform') || lower.includes('spornerede')) {
    return { kategori: 'Platform', kategoriRenk: 'purple' };
  }
  return null;
}

export function buildNewsInternalLinksHtml(konu: string, siteUrl: string): string {
  const base = siteUrl.replace(/\/$/, '');
  const links: string[] = [
    `<a href="${base}/ara">Kurs ara</a>`,
    `<a href="${base}/haberler">Haberler</a>`,
  ];
  const lower = konu.toLowerCase();
  if (lower.includes('voleybol')) links.push(`<a href="${base}/branslar/voleybol">Voleybol branşları</a>`);
  if (lower.includes('basketbol')) links.push(`<a href="${base}/branslar/basketbol">Basketbol branşları</a>`);
  if (lower.includes('yuzme') || lower.includes('yüzme')) {
    links.push(`<a href="${base}/branslar/yuzme">Yüzme branşları</a>`);
  }
  if (lower.includes('futbol')) links.push(`<a href="${base}/branslar/futbol">Futbol branşları</a>`);
  if (lower.includes('oryantiring')) links.push(`<a href="${base}/branslar/oryantiring">Oryantiring branşları</a>`);
  if (lower.includes('satranc') || lower.includes('satranç')) links.push(`<a href="${base}/branslar/satranc">Satranç branşları</a>`);
  if (lower.includes('istanbul') || lower.includes('İstanbul')) links.push(`<a href="${base}/ara?il=istanbul">İstanbul kursları</a>`);
  if (lower.includes('ankara')) links.push(`<a href="${base}/ara?il=ankara">Ankara kursları</a>`);
  if (lower.includes('izmir') || lower.includes('İzmir')) links.push(`<a href="${base}/ara?il=izmir">İzmir kursları</a>`);
  return `<p><strong>İlgili sayfalar:</strong> ${links.join(' · ')}.</p>`;
}

export function ensureMinNewsWords(bodyHtml: string, konu: string, min = MIN_NEWS_WORDS_TEMPLATE): string {
  let body = stripAllInternalLinksFooters(bodyHtml);
  if (countWordsFromHtml(body) >= min) return body;

  const topic = konu.trim() || 'spor kursu';
  const supplement = `<h2>Pratik öneriler</h2>
<p>${topic} seçerken deneme dersi, grup yoğunluğu, antrenör deneyimi ve ulaşım süresini birlikte değerlendirmek kayıt sonrası sürprizleri azaltır. Ücret, ekipman ve iptal koşullarını yazılı olarak teyit edin; mümkünse birkaç kulübün programını yan yana karşılaştırın. <strong>SporNerede</strong> ilanlarında konum, iletişim ve branş filtreleriyle kısa liste oluşturup kayıt için doğrudan başvuru yapabilirsiniz.</p>`;

  const kayitIdx = body.search(/<h2[^>]*>[^<]*kay[ıi]t[^<]*<\/h2>/i);
  if (kayitIdx >= 0) {
    const afterKayit = body.slice(kayitIdx);
    const nextH2 = afterKayit.slice(1).search(/<h2[\s>]/i);
    if (nextH2 >= 0) {
      const insertAt = kayitIdx + 1 + nextH2;
      return `${body.slice(0, insertAt)}\n${supplement}\n${body.slice(insertAt)}`.trim();
    }
  }
  return `${body}\n${supplement}`.trim();
}

export function injectNewsInternalLinks(
  bodyHtml: string,
  konu: string,
  siteUrl: string,
  extraBlocks?: string,
): string {
  let body = stripAllInternalLinksFooters(bodyHtml);
  const middle = String(extraBlocks ?? '').trim();
  const footer = buildNewsInternalLinksHtml(konu, siteUrl);
  if (!body && !middle) return footer.trim();
  if (!body) return `${middle}\n${footer}`.trim();
  if (!middle) return `${body}\n${footer}`;
  return `${body}\n${middle}\n${footer}`;
}

export function mergeCompletedNewsHtml(existing: string, addition: string): string {
  let base = String(existing ?? '').trim();
  let add = String(addition ?? '').trim();
  if (!add) return base;
  add = add.replace(/---META---[\s\S]*?---BODY---/i, '').replace(/---END---/gi, '').trim();
  if (base && !hasIncompleteEnding(base)) {
    const cut = base.replace(/\s*<p>\s*<strong>\s*Ilgili sayfalar:/i, '');
    return `${cut.trim()}\n${add}`.trim();
  }
  if (!base) return add;
  return `${base}\n${add}`.trim();
}

export function renderDraftChecklistHtml(
  assessment: NewsDraftAssessment,
  opts?: { template?: boolean },
): string {
  const minWords = opts?.template ? MIN_NEWS_WORDS_TEMPLATE : MIN_NEWS_WORDS;
  const items = [
    { ok: assessment.wordCount >= minWords, label: `Kelime (${assessment.wordCount}/${minWords})` },
    { ok: assessment.h2Count >= MIN_NEWS_H2, label: `Alt baslik h2 (${assessment.h2Count}/${MIN_NEWS_H2})` },
    { ok: assessment.hasCta, label: 'SporNerede CTA' },
    { ok: assessment.hasCompleteEnding, label: 'Tam bitis (ana metin)' },
  ];
  return items
    .map(
      (i) =>
        `<li class="news-check-item ${i.ok ? 'is-ok' : 'is-warn'}">${i.ok ? '✓' : '○'} ${i.label}</li>`,
    )
    .join('');
}
