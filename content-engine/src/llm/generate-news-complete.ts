import { polishNewsHtml } from '../lib/polish-news.js';
import { stripInternalLinksFooter } from '../lib/news-draft-quality.js';

/** Eski "ekleme" yerine tam metin duzenleme (rewrite) */
export async function completeNewsBody(params: {
  konu: string;
  baslik: string;
  existingHtml: string;
  realData?: string;
}): Promise<{ html: string; modelUsed: string; rewritten: boolean }> {
  const body = stripInternalLinksFooter(params.existingHtml);
  const polish = await polishNewsHtml(body, params.konu, {
    baslik: params.baslik,
    allowRewrite: true,
    realData: params.realData,
  });
  return {
    html: polish.html,
    modelUsed: polish.modelUsed ?? 'repair-only',
    rewritten: polish.rewritten,
  };
}
