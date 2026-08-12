import { readFileSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { chatWithFallback, type ChatMessage } from './openrouter.js';
import { extractBlock } from '../lib/parse-news.js';
import { repairNewsHtml } from '../lib/repair-news-html.js';
import { stripAllInternalLinksFooters } from '../lib/news-draft-quality.js';
import type { TemplateNewsResult } from '../lib/build-template-news.js';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '../..');
const brandVoice = readFileSync(resolve(root, 'prompts/brand-voice.txt'), 'utf8');
const polishTpl = readFileSync(resolve(root, 'prompts/news-template-polish.txt'), 'utf8');
const qualityRules = readFileSync(resolve(root, 'prompts/news-quality-rules.txt'), 'utf8');

export async function polishTemplateNewsLlm(params: {
  built: TemplateNewsResult;
  gscHint: string;
  avoidList: string;
}): Promise<{
  baslik: string;
  seoTitle: string;
  seoDescription: string;
  ozetHtml: string;
  modelUsed: string;
}> {
  const user = polishTpl
    .replace(/\{\{KONU\}\}/g, params.built.konu)
    .replace(/\{\{TEMPLATE_ID\}\}/g, params.built.templateId)
    .replace(/\{\{GSC_HINT\}\}/g, params.gscHint)
    .replace(/\{\{AVOID_LIST\}\}/g, params.avoidList)
    .replace(/\{\{BASLIK\}\}/g, params.built.baslik)
    .replace(/\{\{SEO_TITLE\}\}/g, params.built.seoTitle)
    .replace(/\{\{SEO_DESCRIPTION\}\}/g, params.built.seoDescription)
    .replace(/\{\{BODY_HTML\}\}/g, params.built.ozetHtml);

  const messages: ChatMessage[] = [
    { role: 'system', content: `${brandVoice}\n\n${qualityRules}\n\nSadece hafif duzenleme.` },
    { role: 'user', content: user },
  ];

  let content = '';
  let modelUsed = 'template-default';
  try {
    const res = await chatWithFallback(messages, { temperature: 0.35 });
    content = res.content;
    modelUsed = res.modelUsed;
  } catch (err) {
    console.warn('[llm:polish] LLM polish basarisiz, sablon varsayilani kullaniliyor:', err);
    return {
      baslik: params.built.baslik,
      seoTitle: params.built.seoTitle,
      seoDescription: params.built.seoDescription,
      ozetHtml: params.built.ozetHtml,
      modelUsed: 'template-fallback',
    };
  }
  const meta = extractBlock(content, '---META---', '---BODY---');
  const bodyRaw =
    extractBlock(content, '---BODY---', '---END---') || extractBlock(content, '---BODY---', '');

  let baslik = params.built.baslik;
  let seoTitle = params.built.seoTitle;
  let seoDescription = params.built.seoDescription;

  const line = (key: string) => {
    const re = new RegExp(`^${key}:\\s*(.+)$`, 'im');
    return meta.match(re)?.[1]?.trim();
  };
  baslik = line('baslik') || baslik;
  seoTitle = line('seo_title') || seoTitle;
  seoDescription = line('seo_description') || seoDescription;

  const cleaned = stripAllInternalLinksFooters(bodyRaw.trim() || params.built.ozetHtml);
  const { html: ozetHtml } = repairNewsHtml(cleaned);

  return { baslik, seoTitle, seoDescription, ozetHtml, modelUsed };
}
