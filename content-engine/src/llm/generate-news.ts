import { readFileSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { chatWithFallback, type ChatMessage } from './openrouter.js';
import { parseNewsOutput, type ParsedNews } from '../lib/parse-news.js';
import { enrichParsedNews, isNewsDraftComplete } from '../lib/enrich-news.js';
import { repairNewsHtml } from '../lib/repair-news-html.js';
import { polishNewsHtml } from '../lib/polish-news.js';
import { stripInternalLinksFooter } from '../lib/news-draft-quality.js';
import { cfg } from '../config.js';

/** LLM modunda ikinci tam rewrite cok yavas; sadece hybrid/template sonrasi */
const allowLlmRewrite = cfg.llmRewriteEnabled && cfg.newsMode !== 'llm';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '../..');
const brandVoice = readFileSync(resolve(root, 'prompts/brand-voice.txt'), 'utf8');
const qualityRules = readFileSync(resolve(root, 'prompts/news-quality-rules.txt'), 'utf8');
const newsBase = readFileSync(resolve(root, 'prompts/news-base.txt'), 'utf8');

const RETRY_HINT: ChatMessage = {
  role: 'user',
  content:
    'Onceki yanit hatali veya sablon gibi. ZORUNLU: ozgun baslik (kayit ve secim rehberi kalibi YASAK), 3-4 dolu h2, tek Kayit h2, CTA, ---END---',
};

export type NewsGenerationContext = {
  gscHint?: string;
  avoidList?: string;
  angle?: string;
  realData?: string;
  ctaHint?: string;
};

const DEFAULT_ANGLE =
  'Okuyucuya pratik, gundelik bir dilde tek bir net fayda sun (deneme dersi, zaman plani veya kulup secimi).';

const NO_REAL_DATA =
  '(Bu konu icin platform verisi yok. Uydurma somut sayi/isim verme; genel ama klise olmayan, konuya ozgu yaz.)';

export function buildNewsPrompt(konu: string, ctx?: NewsGenerationContext): ChatMessage[] {
  const user = newsBase
    .replace(/\{\{KONU\}\}/g, konu)
    .replace(/\{\{GSC_HINT\}\}/g, ctx?.gscHint?.trim() || `Anahtar: ${konu}`)
    .replace(/\{\{AVOID_LIST\}\}/g, ctx?.avoidList?.trim() || '(henuz yayin yok)')
    .replace(/\{\{REAL_DATA\}\}/g, ctx?.realData?.trim() || NO_REAL_DATA)
    .replace(/\{\{ANGLE\}\}/g, ctx?.angle?.trim() || DEFAULT_ANGLE)
    .replace(
      /\{\{CTA_HINT\}\}/g,
      ctx?.ctaHint?.trim() ||
        'Son paragraf SporNerede CTA — yakinindaki kurslari aramak icin platform.',
    );
  return [
    {
      role: 'system',
      content: `${brandVoice}\n\n${qualityRules}\n\nSablon kalibi tekrarlama; her haber ozgun baslik ve h2 yapisina sahip olsun.`,
    },
    { role: 'user', content: user },
  ];
}

export async function generateNewsParsed(
  konu: string,
  ctx?: NewsGenerationContext,
): Promise<{
  parsed: ParsedNews;
  modelUsed: string;
  polished: boolean;
}> {
  const messages = buildNewsPrompt(konu, ctx);
  let lastError: unknown;
  let lastParsed: ParsedNews | null = null;
  let modelUsed = 'unknown';

  console.error('[llm:news] uretim basliyor:', konu);
  for (let attempt = 0; attempt < 2; attempt++) {
    try {
      const msgs = attempt === 0 ? messages : [...messages, RETRY_HINT];
      console.error(`[llm:news] model zinciri (deneme ${attempt + 1}/2)...`);
      const { content, modelUsed: m } = await chatWithFallback(msgs, {
        temperature: cfg.newsTemperature,
      });
      modelUsed = m;
      let parsed = parseNewsOutput(content);
      parsed.ozetHtml = repairNewsHtml(parsed.ozetHtml).html;
      lastParsed = parsed;

      if (!isNewsDraftComplete(parsed.ozetHtml, konu) && attempt === 0) {
        console.warn('[llm:news] eksik, ikinci uretim...');
        continue;
      }
      break;
    } catch (e) {
      lastError = e;
      console.warn(`[llm:news] attempt ${attempt + 1} failed`);
    }
  }

  if (!lastParsed) throw lastError;

  const polish = await polishNewsHtml(
    stripInternalLinksFooter(lastParsed.ozetHtml),
    konu,
    { baslik: lastParsed.baslik, allowRewrite: allowLlmRewrite },
  );

  const enriched = enrichParsedNews({ ...lastParsed, ozetHtml: polish.html }, konu);

  return {
    parsed: enriched,
    modelUsed: polish.modelUsed ?? modelUsed,
    polished: polish.rewritten,
  };
}
