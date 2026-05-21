import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { cfg, requireOpenRouter } from '../config.js';

const OPENROUTER_URL = 'https://openrouter.ai/api/v1/chat/completions';

export type ChatMessage = { role: 'system' | 'user' | 'assistant'; content: string };

export async function chatCompletion(
  messages: ChatMessage[],
  model: string,
): Promise<string> {
  const apiKey = requireOpenRouter();
  const res = await fetch(OPENROUTER_URL, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
      'HTTP-Referer': cfg.siteUrl,
      'X-Title': 'SporNerede Content Engine',
    },
    body: JSON.stringify({
      model,
      messages,
      temperature: 0.7,
      max_tokens: 8192,
    }),
  });

  if (!res.ok) {
    const body = await res.text();
    throw new Error(`OpenRouter ${res.status} (${model}): ${body.slice(0, 500)}`);
  }

  const data = (await res.json()) as {
    choices?: Array<{ message?: { content?: string } }>;
  };
  const content = data.choices?.[0]?.message?.content?.trim();
  if (!content) throw new Error(`OpenRouter bos yanit (${model})`);
  return content;
}

/** Birincil model, hata veya 429 benzeri durumda yedek model. */
export async function chatWithFallback(messages: ChatMessage[]): Promise<{
  content: string;
  modelUsed: string;
}> {
  const models = [cfg.openrouterModel, cfg.openrouterModelFallback].filter(Boolean);
  let lastError: unknown;
  for (const model of models) {
    try {
      const content = await chatCompletion(messages, model);
      return { content, modelUsed: model };
    } catch (e) {
      lastError = e;
      console.warn(`[llm] ${model} basarisiz, sonraki modele geciliyor...`);
    }
  }
  throw lastError;
}

export function loadPrompt(name: string): string {
  return readFileSync(resolve(cfg.contentEngineRoot, 'prompts', name), 'utf8');
}

export function buildArticlePrompt(params: {
  anahtar: string;
  kategori: string;
  niyet: string;
  siteContext: string;
  icLinkler: string;
}): ChatMessage[] {
  const brand = loadPrompt('brand-voice.txt');
  let template = loadPrompt('article-base.txt');
  let linkRules = loadPrompt('internal-links.txt');
  linkRules = linkRules.replace(/\{\{IC_LINK_LIST\}\}/g, params.icLinkler);
  template = template
    .replace(/\{\{ANAHTAR\}\}/g, params.anahtar)
    .replace(/\{\{KATEGORI\}\}/g, params.kategori)
    .replace(/\{\{NIYET\}\}/g, params.niyet)
    .replace(/\{\{SITE_CONTEXT\}\}/g, params.siteContext)
    .replace(/\{\{IC_LINKLER\}\}/g, linkRules);

  return [
    { role: 'system', content: brand },
    { role: 'user', content: template },
  ];
}
