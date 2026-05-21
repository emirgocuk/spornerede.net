import { buildArticlePrompt, chatWithFallback, type ChatMessage } from './openrouter.js';
import { parseArticleOutput, type ParsedArticle } from '../lib/parse-article.js';

const RETRY_HINT: ChatMessage = {
  role: 'user',
  content:
    'Onceki yanit parse edilemedi. ZORUNLU format: ---META--- ... ---BODY--- ... ---FAQ--- [json dizi]. Baska metin ekleme.',
};

export async function generateArticleParsed(
  params: Parameters<typeof buildArticlePrompt>[0],
): Promise<{ parsed: ParsedArticle; modelUsed: string }> {
  const messages = buildArticlePrompt(params);
  let lastError: unknown;

  for (let attempt = 0; attempt < 2; attempt++) {
    try {
      const msgs = attempt === 0 ? messages : [...messages, RETRY_HINT];
      const { content, modelUsed } = await chatWithFallback(msgs);
      const parsed = parseArticleOutput(content);
      return { parsed, modelUsed };
    } catch (e) {
      lastError = e;
      console.warn(`[llm] parse/generation attempt ${attempt + 1} failed`);
    }
  }

  throw lastError;
}
