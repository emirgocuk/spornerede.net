export type ParsedArticle = {
  baslik: string;
  meta_title: string;
  meta_description: string;
  slug: string;
  sema_tipi: string;
  icerik_html: string;
  icerik_json: { faq: Array<{ soru: string; cevap: string }> };
};

function field(block: string, key: string): string {
  const re = new RegExp(`^${key}:\\s*(.+)$`, 'im');
  const m = block.match(re);
  return m?.[1]?.trim() ?? '';
}

export function parseArticleOutput(raw: string): ParsedArticle {
  const metaMatch = raw.match(/---META---([\s\S]*?)---BODY---/i);
  const bodyMatch = raw.match(/---BODY---([\s\S]*?)---FAQ---/i);
  const faqMatch = raw.match(/---FAQ---([\s\S]*?)$/i);

  if (!metaMatch || !bodyMatch) {
    throw new Error('Cikti formati gecersiz (META/BODY bloklari yok)');
  }

  const metaBlock = metaMatch[1];
  const baslik = field(metaBlock, 'baslik');
  const meta_title = field(metaBlock, 'meta_title');
  const meta_description = field(metaBlock, 'meta_description');
  const slug = field(metaBlock, 'slug').replace(/[^a-z0-9-]/g, '');
  const sema_tipi = field(metaBlock, 'sema_tipi') || 'Article';

  let faq: Array<{ soru: string; cevap: string }> = [];
  if (faqMatch) {
    const faqRaw = faqMatch[1].trim();
    const jsonStart = faqRaw.indexOf('[');
    if (jsonStart >= 0) {
      try {
        faq = JSON.parse(faqRaw.slice(jsonStart)) as typeof faq;
      } catch {
        faq = [];
      }
    }
  }

  const icerik_html = bodyMatch[1].trim();
  if (!baslik || !icerik_html) {
    throw new Error('baslik veya BODY bos');
  }

  return {
    baslik,
    meta_title: meta_title || baslik.slice(0, 60),
    meta_description: meta_description || baslik.slice(0, 155),
    slug: slug || 'rehber-taslak',
    sema_tipi,
    icerik_html,
    icerik_json: { faq },
  };
}
