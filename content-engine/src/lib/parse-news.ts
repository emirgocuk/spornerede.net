export type ParsedNews = {
  baslik: string;
  seoTitle: string;
  seoDescription: string;
  kategori: string;
  kategoriRenk: string;
  ozetHtml: string;
};

export function extractBlock(raw: string, start: string, end: string) {
  const s = raw.indexOf(start);
  if (s < 0) return '';
  const from = s + start.length;
  const e = raw.indexOf(end, from);
  return (e < 0 ? raw.slice(from) : raw.slice(from, e)).trim();
}

function metaLine(block: string, key: string) {
  const re = new RegExp(`^${key}:\\s*(.+)$`, 'im');
  const m = block.match(re);
  return m?.[1]?.trim() ?? '';
}

const RENKLER = new Set(['red', 'blue', 'green', 'orange', 'purple', 'gray']);

export function parseNewsOutput(raw: string): ParsedNews {
  const meta = extractBlock(raw, '---META---', '---BODY---');
  const body = extractBlock(raw, '---BODY---', '---END---') || extractBlock(raw, '---BODY---', '');

  let baslik = metaLine(meta, 'baslik');
  let seoTitle = metaLine(meta, 'seo_title');
  let seoDescription = metaLine(meta, 'seo_description');

  const normalizeCase = (s: string) => {
    const t = s.trim();
    if (!t) return t;
    if (t === t.toUpperCase() && t.length > 12) {
      return t.charAt(0) + t.slice(1).toLowerCase();
    }
    return t;
  };

  baslik = normalizeCase(baslik);
  seoTitle = normalizeCase(seoTitle);
  seoDescription = normalizeCase(seoDescription);

  if (!baslik || /^haber$/i.test(baslik)) {
    baslik = seoTitle || 'Spor duyurusu';
  }
  if (!seoTitle) seoTitle = baslik.slice(0, 60);
  if (!seoDescription) seoDescription = baslik.slice(0, 155);
  const kategori = metaLine(meta, 'kategori') || 'Duyuru';
  let kategoriRenk = metaLine(meta, 'kategori_renk').toLowerCase();
  if (!RENKLER.has(kategoriRenk)) kategoriRenk = 'blue';

  const ozetHtml = body.trim() || `<p>${baslik}</p>`;

  return { baslik, seoTitle, seoDescription, kategori, kategoriRenk, ozetHtml };
}
