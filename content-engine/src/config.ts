import { config as loadEnv } from 'dotenv';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
loadEnv({ path: resolve(root, '.env'), override: false });

function req(name: string): string {
  const v = process.env[name]?.trim();
  if (!v) throw new Error(`Eksik ortam degiskeni: ${name}`);
  return v;
}

function opt(name: string, fallback = ''): string {
  const v = process.env[name]?.trim();
  return v || fallback;
}

export const cfg = {
  pocketbaseUrl: opt('POCKETBASE_URL', 'http://127.0.0.1:8090'),
  pocketbaseAdminEmail: opt('POCKETBASE_ADMIN_EMAIL'),
  pocketbaseAdminPassword: opt('POCKETBASE_ADMIN_PASSWORD'),
  openrouterApiKey: opt('OPENROUTER_API_KEY'),
  openrouterModel: opt(
    'SEO_OPENROUTER_MODEL',
    'meta-llama/llama-3.3-70b-instruct:free',
  ),
  openrouterModelFallback: opt(
    'SEO_OPENROUTER_MODEL_FALLBACK',
    'nvidia/nemotron-3-ultra-550b-a55b:free',
  ),
  /** Virgulle ayrilmis ek :free modeller */
  openrouterExtraModels: opt('SEO_OPENROUTER_MODELS', 'nvidia/nemotron-3-super-120b-a12b:free,google/gemma-4-31b-it:free,nvidia/nemotron-3-nano-30b-a3b:free,nvidia/nemotron-nano-9b-v2:free')
    .split(',')
    .map((m) => m.trim())
    .filter(Boolean),
  /** Bos yanit/429 sonrasi en fazla kac model denensin */
  openrouterMaxModelTries: Math.max(1, Number(opt('SEO_OPENROUTER_MAX_MODEL_TRIES', '3')) || 3),
  openrouterRequestTimeoutMs: Math.max(
    10_000,
    Number(opt('SEO_OPENROUTER_REQUEST_TIMEOUT_MS', '25000')) || 25_000,
  ),
  draftFailSoft: opt('SEO_DRAFT_FAIL_SOFT', 'true') !== 'false',
  llmProvider: opt('SEO_LLM_PROVIDER', 'openrouter'),
  usePaidApis: opt('SEO_USE_PAID_APIS', 'false') === 'true',
  dailyArticleLimit: Math.max(1, Number(opt('SEO_DAILY_ARTICLE_LIMIT', '1')) || 1),
  /**
   * llm = tam uretim (ozgunluk, varsayilan)
   * template_llm | template | hybrid = sablon tabanli
   */
  newsMode: opt('SEO_NEWS_MODE', 'hybrid') as
    | 'template'
    | 'template_llm'
    | 'llm'
    | 'hybrid',
  /** template_llm: sablon sonrasi hafif duzenleme */
  templateLlmPolish: opt('SEO_TEMPLATE_LLM_POLISH', 'true') !== 'false',
  /** Tam metin LLM rewrite (sablon modunda kapali tutun) */
  llmRewriteEnabled: opt('SEO_LLM_REWRITE', 'false') === 'true',
  autoPublish: opt('SEO_AUTO_PUBLISH', 'false') === 'true',
  /** Sablon + kalite OK ise otomatik aktif (SEO_AUTO_PUBLISH ile birlikte kullanilabilir) */
  templateAutoPublish: opt('SEO_NEWS_TEMPLATE_AUTO_PUBLISH', 'true') === 'true',
  /** LLM uretim sicakligi (yuksek = daha cesitli; data-grounding ile birlikte onerilir) */
  newsTemperature: Math.min(
    1.2,
    Math.max(0, Number(opt('SEO_NEWS_TEMPERATURE', '0.8')) || 0.8),
  ),
  /** Yayin oncesi benzerlik esigi (word-trigram Jaccard). Ustundeyse incelemeye duser. */
  newsDedupMax: Math.min(
    1,
    Math.max(0, Number(opt('SEO_NEWS_DEDUP_MAX', '0.45')) || 0.45),
  ),
  /** GSC dusuk CTR haberlerinde haftalik otomatik rewrite */
  newsRewriteEnabled: opt('SEO_NEWS_REWRITE_ENABLED', 'true') !== 'false',
  newsRewriteMaxPerWeek: Math.max(
    0,
    Number(opt('SEO_NEWS_REWRITE_MAX_PER_WEEK', '2')) || 2,
  ),
  /** Ayni habere tekrar rewrite icin min hafta */
  newsRewriteMinWeeks: Math.max(
    1,
    Number(opt('SEO_NEWS_REWRITE_MIN_WEEKS', '2')) || 2,
  ),
  /** Yayindan sonra rewrite icin min bekleme (hafta) */
  newsRewriteMinPublishWeeks: Math.max(
    1,
    Number(opt('SEO_NEWS_REWRITE_MIN_PUBLISH_WEEKS', '2')) || 2,
  ),
  gscSiteUrl: opt('SEO_GSC_SITE_URL', 'https://spornerede.net'),
  gscAuthMode: opt('SEO_GSC_AUTH_MODE', 'service_account') as 'service_account' | 'oauth',
  gscServiceAccountPath: opt('SEO_GSC_SERVICE_ACCOUNT_PATH'),
  gscOAuthClientPath: opt('SEO_GSC_OAUTH_CLIENT_PATH'),
  gscOAuthTokenPath: opt('SEO_GSC_OAUTH_TOKEN_PATH', './secrets/gsc-oauth-token.json'),
  siteUrl: opt('SITE_URL', 'https://spornerede.net').replace(/\/$/, ''),
  contentEngineRoot: root,
};

/** Birincil → yedek → SEO_OPENROUTER_MODELS (tekrarsiz) */
export function getOpenRouterModelChain(): string[] {
  const chain = [
    cfg.openrouterModel,
    cfg.openrouterModelFallback,
    ...cfg.openrouterExtraModels,
  ]
    .filter(Boolean)
    .filter((m) => !/embed|embedding|vision|vector|bge/i.test(m));
  const unique = [...new Set(chain)];
  return unique.slice(0, cfg.openrouterMaxModelTries);
}

export function requireOpenRouter() {
  return req('OPENROUTER_API_KEY');
}

export function requirePocketBaseAdmin() {
  req('POCKETBASE_ADMIN_EMAIL');
  req('POCKETBASE_ADMIN_PASSWORD');
  return cfg;
}
