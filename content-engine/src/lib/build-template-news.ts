import { cfg } from '../config.js';
import {
  assessNewsDraft,
  ensureMinNewsWords,
  injectNewsInternalLinks,
} from './news-draft-quality.js';
import { repairNewsHtml } from './repair-news-html.js';
import { parseKonu } from './parse-konu.js';
import { pickNewsTemplate } from './news-templates.js';

export type TemplateNewsResult = {
  templateId: string;
  templateName: string;
  konu: string;
  baslik: string;
  seoTitle: string;
  seoDescription: string;
  kategori: string;
  kategoriRenk: string;
  ozetHtml: string;
  ozetWrapped: string;
  complete: boolean;
  issues: string[];
  wordCount: number;
};

export function wrapTemplateOzet(konu: string, templateId: string, body: string, keywordId?: string) {
  const kw = keywordId ? `\n<!-- ce-keyword:${keywordId} -->\n` : '\n';
  return `<!-- ce-konu:${konu} -->\n<!-- ce-template:${templateId} -->${kw}${body}`;
}

export function buildNewsFromTemplate(
  konuRaw: string,
  opts?: { recentTemplateIds?: string[]; keywordId?: string },
): TemplateNewsResult {
  const konu = konuRaw.trim();
  const parsed = parseKonu(konu);
  const template = pickNewsTemplate(konu, opts?.recentTemplateIds ?? []);

  let body = template.body(parsed);
  const repaired = repairNewsHtml(body);
  body = repaired.html;
  body = ensureMinNewsWords(body, konu);
  body = injectNewsInternalLinks(body, konu, cfg.siteUrl);

  const assessment = assessNewsDraft(body, konu, { template: true });
  const ozetWrapped = wrapTemplateOzet(konu, template.id, body, opts?.keywordId);

  return {
    templateId: template.id,
    templateName: template.name,
    konu,
    baslik: template.baslik(parsed),
    seoTitle: template.seoTitle(parsed),
    seoDescription: template.seoDescription(parsed),
    kategori: template.kategori,
    kategoriRenk: template.kategoriRenk,
    ozetHtml: body,
    ozetWrapped,
    complete: assessment.complete,
    issues: assessment.issues,
    wordCount: assessment.wordCount,
  };
}
