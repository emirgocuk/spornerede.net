import { assessNewsDraft, injectNewsInternalLinks, stripInternalLinksFooter } from './news-draft-quality.js';
import { needsFullRewrite, repairNewsHtml } from './repair-news-html.js';
import { rewriteNewsFull } from '../llm/generate-news-rewrite.js';
import { cfg } from '../config.js';

export type PolishResult = {
  html: string;
  fixes: string[];
  complete: boolean;
  issues: string[];
  modelUsed?: string;
  rewritten: boolean;
};

function isTemplateGenerated(html: string) {
  return /<!--\s*ce-template:/i.test(html);
}

/** Onarim + gerekirse tam yeniden yazim (sablon metinlerde LLM rewrite yok) */
export async function polishNewsHtml(
  html: string,
  konu: string,
  options?: { baslik?: string; allowRewrite?: boolean; realData?: string },
): Promise<PolishResult> {
  let body = stripInternalLinksFooter(html);
  const fromTemplate = isTemplateGenerated(html);
  let { html: repaired, fixes } = repairNewsHtml(body);
  let assessment = assessNewsDraft(repaired, konu);
  let modelUsed: string | undefined;
  let rewritten = false;

  const allowRewrite = Boolean(options?.allowRewrite) && !fromTemplate;
  const shouldRewrite =
    allowRewrite &&
    Boolean(options?.baslik) &&
    (!assessment.complete || needsFullRewrite(repaired));

  if (shouldRewrite && options?.baslik) {
    try {
      const result = await rewriteNewsFull({
        konu,
        baslik: options.baslik,
        draftHtml: repaired,
        realData: options.realData,
      });
      const again = repairNewsHtml(result.html);
      repaired = again.html;
      fixes = [...fixes, ...again.fixes, 'llm_full_rewrite'];
      modelUsed = result.modelUsed;
      rewritten = true;
      assessment = assessNewsDraft(repaired, konu);
    } catch (e) {
      console.warn('[polish-news] rewrite failed', e);
    }
  }

  repaired = injectNewsInternalLinks(repaired, konu, cfg.siteUrl);
  assessment = assessNewsDraft(stripInternalLinksFooter(repaired), konu);

  return {
    html: repaired,
    fixes,
    complete: assessment.complete,
    issues: assessment.issues,
    modelUsed,
    rewritten,
  };
}
