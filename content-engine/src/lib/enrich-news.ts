import type { ParsedNews } from './parse-news.js';
import { cfg } from '../config.js';
import {
  assessNewsDraft,
  injectNewsInternalLinks,
  suggestNewsCategory,
} from './news-draft-quality.js';
import { repairNewsHtml } from './repair-news-html.js';

export function enrichParsedNews(parsed: ParsedNews, konu: string): ParsedNews {
  let ozetHtml = repairNewsHtml(parsed.ozetHtml).html;
  const suggested = suggestNewsCategory(konu);
  let kategori = parsed.kategori;
  let kategoriRenk = parsed.kategoriRenk;

  if (suggested && (kategori === 'Duyuru' || !kategori)) {
    kategori = suggested.kategori;
    kategoriRenk = suggested.kategoriRenk;
  }

  ozetHtml = injectNewsInternalLinks(ozetHtml, konu, cfg.siteUrl);

  return { ...parsed, ozetHtml, kategori, kategoriRenk };
}

export function isNewsDraftComplete(ozetHtml: string, konu: string): boolean {
  return assessNewsDraft(ozetHtml, konu).complete;
}
