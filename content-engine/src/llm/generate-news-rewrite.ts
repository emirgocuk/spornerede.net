import { readFileSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { chatWithFallback, type ChatMessage } from './openrouter.js';
import { parseNewsOutput } from '../lib/parse-news.js';
import { repairNewsHtml } from '../lib/repair-news-html.js';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '../..');
const brandVoice = readFileSync(resolve(root, 'prompts/brand-voice.txt'), 'utf8');
const qualityRules = readFileSync(resolve(root, 'prompts/news-quality-rules.txt'), 'utf8');
const rewriteTpl = readFileSync(resolve(root, 'prompts/news-rewrite.txt'), 'utf8');

const NO_REAL_DATA =
  '(Bu konu icin platform verisi yok. Yeni sayi/isim uydurma; mevcut metni dogal ve klise olmadan duzenle.)';

export async function rewriteNewsFull(params: {
  konu: string;
  baslik: string;
  draftHtml: string;
  realData?: string;
}): Promise<{ html: string; meta?: ReturnType<typeof parseNewsOutput>; modelUsed: string }> {
  const draft = String(params.draftHtml ?? '').trim().slice(0, 6000);
  const user = rewriteTpl
    .replace(/\{\{KONU\}\}/g, params.konu)
    .replace(/\{\{BASLIK\}\}/g, params.baslik)
    .replace(/\{\{DRAFT_HTML\}\}/g, draft)
    .replace(/\{\{REAL_DATA\}\}/g, params.realData?.trim() || NO_REAL_DATA);

  const messages: ChatMessage[] = [
    { role: 'system', content: `${brandVoice}\n\n${qualityRules}` },
    { role: 'user', content: user },
  ];

  const { content, modelUsed } = await chatWithFallback(messages);
  const parsed = parseNewsOutput(content);
  const { html } = repairNewsHtml(parsed.ozetHtml);
  return { html, meta: parsed, modelUsed };
}
