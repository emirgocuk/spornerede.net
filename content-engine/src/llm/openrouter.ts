import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { cfg, getOpenRouterModelChain, requireOpenRouter } from '../config.js';

const OPENROUTER_URL = 'https://openrouter.ai/api/v1/chat/completions';
const RETRY_DELAYS_MS = [0, 8_000, 18_000];

export type ChatMessage = { role: 'system' | 'user' | 'assistant'; content: string };

function sleep(ms: number) {
  return new Promise((r) => setTimeout(r, ms));
}

function isRateLimited(err: unknown): boolean {
  const msg = String(err);
  return msg.includes('429') || msg.toLowerCase().includes('rate-limited');
}

export async function chatCompletion(
  messages: ChatMessage[],
  model: string,
  opts?: { temperature?: number },
): Promise<string> {
  const apiKey = requireOpenRouter();
  let lastErr: unknown;
  for (let i = 0; i < RETRY_DELAYS_MS.length; i++) {
    if (RETRY_DELAYS_MS[i] > 0) {
      console.warn(`[llm] ${model} 429 — ${RETRY_DELAYS_MS[i] / 1000}s bekleniyor...`);
      await sleep(RETRY_DELAYS_MS[i]);
    }
    try {
      return await chatCompletionOnce(messages, model, apiKey, opts?.temperature);
    } catch (e) {
      lastErr = e;
      if (!isRateLimited(e) || i === RETRY_DELAYS_MS.length - 1) throw e;
    }
  }
  throw lastErr;
}

async function chatCompletionOnce(
  messages: ChatMessage[],
  model: string,
  apiKey: string,
  temperature = 0.7,
): Promise<string> {
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
      temperature,
      max_tokens: 4096,
    }),
    signal: AbortSignal.timeout(cfg.openrouterRequestTimeoutMs),
  });

  if (!res.ok) {
    const body = await res.text();
    throw new Error(`OpenRouter ${res.status} (${model}): ${body.slice(0, 500)}`);
  }

  const data = (await res.json()) as {
    choices?: Array<{
      message?: { content?: string | null; reasoning?: string | null };
      finish_reason?: string;
    }>;
    error?: { message?: string };
  };

  if (data.error?.message) {
    throw new Error(`OpenRouter API (${model}): ${data.error.message}`);
  }

  const msg = data.choices?.[0]?.message;
  const content = msg?.content?.trim();
  if (content) return content;

  const finish = data.choices?.[0]?.finish_reason ?? '';
  const reasoningOnly = Boolean(msg?.reasoning?.trim() && !content);
  if (reasoningOnly || finish === 'length') {
    throw new Error(
      `OpenRouter bos veya yarim yanit (${model})${finish ? ` [${finish}]` : ''}`,
    );
  }
  throw new Error(`OpenRouter bos yanit (${model})`);
}

/** Model zinciri: birincil → yedek → SEO_OPENROUTER_MODELS */
export async function chatWithFallback(
  messages: ChatMessage[],
  opts?: { temperature?: number },
): Promise<{
  content: string;
  modelUsed: string;
}> {
  const models = getOpenRouterModelChain();
  let lastError: unknown;
  for (const model of models) {
    try {
      const content = await chatCompletion(messages, model, opts);
      return { content, modelUsed: model };
    } catch (e) {
      lastError = e;
      const brief = String(e).slice(0, 120);
      console.warn(`[llm] ${model} basarisiz (${brief}), sonraki model...`);
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
