import { config as loadEnv } from 'dotenv';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
loadEnv({ path: resolve(root, '.env') });

function req(name: string): string {
  const v = process.env[name]?.trim();
  if (!v) throw new Error(`Eksik ortam degiskeni: ${name}`);
  return v;
}

function opt(name: string, fallback = ''): string {
  return process.env[name]?.trim() ?? fallback;
}

export const cfg = {
  pocketbaseUrl: opt('POCKETBASE_URL', 'http://127.0.0.1:8090'),
  pocketbaseAdminEmail: opt('POCKETBASE_ADMIN_EMAIL'),
  pocketbaseAdminPassword: opt('POCKETBASE_ADMIN_PASSWORD'),
  openrouterApiKey: opt('OPENROUTER_API_KEY'),
  openrouterModel: opt(
    'SEO_OPENROUTER_MODEL',
    'deepseek/deepseek-v4-flash:free',
  ),
  openrouterModelFallback: opt(
    'SEO_OPENROUTER_MODEL_FALLBACK',
    'nvidia/nemotron-3-nano-omni-30b-a3b-reasoning:free',
  ),
  /** Virgulle ayrilmis ek :free modeller (ornek: qwen/qwen3-4b:free) */
  openrouterExtraModels: opt('SEO_OPENROUTER_MODELS', '')
    .split(',')
    .map((m) => m.trim())
    .filter(Boolean),
  draftFailSoft: opt('SEO_DRAFT_FAIL_SOFT', 'true') !== 'false',
  llmProvider: opt('SEO_LLM_PROVIDER', 'openrouter'),
  usePaidApis: opt('SEO_USE_PAID_APIS', 'false') === 'true',
  dailyArticleLimit: Math.max(1, Number(opt('SEO_DAILY_ARTICLE_LIMIT', '1')) || 1),
  autoPublish: opt('SEO_AUTO_PUBLISH', 'false') === 'true',
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
  ].filter(Boolean);
  return [...new Set(chain)];
}

export function requireOpenRouter() {
  return req('OPENROUTER_API_KEY');
}

export function requirePocketBaseAdmin() {
  req('POCKETBASE_ADMIN_EMAIL');
  req('POCKETBASE_ADMIN_PASSWORD');
  return cfg;
}
