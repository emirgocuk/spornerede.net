import { cfg } from '../config.js';

const checks: Array<{ label: string; ok: boolean; hint?: string }> = [
  {
    label: 'POCKETBASE_URL',
    ok: Boolean(cfg.pocketbaseUrl),
  },
  {
    label: 'POCKETBASE_ADMIN_EMAIL / PASSWORD',
    ok: Boolean(cfg.pocketbaseAdminEmail && cfg.pocketbaseAdminPassword),
    hint: 'Adim 2 — PB admin',
  },
  {
    label: 'OPENROUTER_API_KEY',
    ok: Boolean(cfg.openrouterApiKey),
    hint: 'Adim 1 — OpenRouter key',
  },
  {
    label: 'SEO_OPENROUTER_MODEL (:free)',
    ok: cfg.openrouterModel.includes(':free'),
    hint: cfg.openrouterModel,
  },
  {
    label: 'SEO_OPENROUTER_MODEL_FALLBACK (:free)',
    ok: cfg.openrouterModelFallback.includes(':free'),
    hint: cfg.openrouterModelFallback,
  },
  {
    label: 'SEO_USE_PAID_APIS=false',
    ok: !cfg.usePaidApis,
  },
  {
    label: 'GSC (service account veya oauth)',
    ok:
      (cfg.gscAuthMode === 'oauth' &&
        Boolean(cfg.gscOAuthClientPath && cfg.gscOAuthTokenPath)) ||
      (cfg.gscAuthMode !== 'oauth' && Boolean(cfg.gscServiceAccountPath)),
    hint:
      cfg.gscAuthMode === 'oauth'
        ? 'npm run gsc:oauth'
        : cfg.gscServiceAccountPath || 'GSC-KURULUM-tr.md',
  },
];

console.log('\n=== Content Engine — ortam kontrolu ===\n');
let failed = 0;
for (const c of checks) {
  const mark = c.ok ? 'OK' : 'EKSIK';
  if (!c.ok) failed++;
  console.log(`[${mark}] ${c.label}${c.hint ? ` — ${c.hint}` : ''}`);
}

if (cfg.openrouterApiKey && !cfg.openrouterModel.includes(':free')) {
  console.warn('\nUyari: Model :free degil; ucretli cagri riski.');
  failed++;
}

console.log(failed ? '\nBazi zorunlu alanlar eksik. README Adim 1–3.\n' : '\nHazir. Siradaki: npm run setup:collections\n');
process.exit(failed ? 1 : 0);
