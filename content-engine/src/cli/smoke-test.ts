/**
 * Content engine uçtan uca duman testi (PB + GSC + opsiyonel taslak).
 * Kullanim: npm run smoke
 * Taslak uretmeden: npm run smoke -- --skip-draft
 */
import { cfg, requirePocketBaseAdmin } from '../config.js';
import { gscAuthConfigured, oauthTokenExists } from '../gsc/auth.js';
import { fetchGscQueries, listGscSiteEntries } from '../gsc/client.js';
import { formatPerfRuleSummary } from '../gsc/performance-rules.js';
import { getAdminPb } from '../pb/client.js';
import { listGuideRecords } from '../pb/list-guides.js';

const skipDraft = process.argv.includes('--skip-draft');

async function step(name: string, fn: () => Promise<void>) {
  process.stdout.write(`  ${name}... `);
  await fn();
  console.log('OK');
}

async function main() {
  console.log('\n=== Content Engine smoke test ===\n');

  if (!cfg.pocketbaseAdminEmail || !cfg.pocketbaseAdminPassword) {
    throw new Error('POCKETBASE_ADMIN_* eksik (content-engine/.env)');
  }
  if (!cfg.openrouterApiKey) {
    throw new Error('OPENROUTER_API_KEY eksik');
  }

  await step('PocketBase baglantisi', async () => {
    const pb = new (await import('pocketbase')).default(cfg.pocketbaseUrl);
    await pb.collection('_superusers').authWithPassword(
      cfg.pocketbaseAdminEmail,
      cfg.pocketbaseAdminPassword,
    );
    for (const c of ['seo_keywords', 'rehber_yazilari']) {
      const r = await pb.collection(c).getList(1, 1);
      if (r.totalItems < 0) throw new Error(`${c} liste hatasi`);
    }
  });

  await step('seo_keywords sayfa listesi', async () => {
    const pb = await getAdminPb();
    const batch = await pb.collection('seo_keywords').getList(1, 100);
    if (!batch.items.length) throw new Error('keyword yok — npm run seed:keywords');
  });

  if (!gscAuthConfigured()) {
    console.log('  GSC... ATLANDI (kimlik bilgisi yok)');
  } else if (cfg.gscAuthMode === 'oauth' && !oauthTokenExists()) {
    console.log('  GSC... ATLANDI (npm run gsc:oauth gerekli)');
  } else {
    await step('GSC API', async () => {
      const sites = await listGscSiteEntries();
      if (!sites.length) throw new Error('mulk listesi bos');
      const rows = await fetchGscQueries(7);
      if (!rows.length) throw new Error('sorgu verisi bos');
    });
    console.log(`  Kurallar: ${formatPerfRuleSummary()}`);
  }

  if (!skipDraft) {
    console.log('\n  Taslak uretimi (OpenRouter, ~1-3 dk)...');
    const { spawnSync } = await import('node:child_process');
    const r = spawnSync('npm', ['run', 'job:draft'], {
      cwd: cfg.contentEngineRoot,
      shell: true,
      stdio: 'pipe',
      encoding: 'utf8',
      env: process.env,
    });
    const out = `${r.stdout ?? ''}${r.stderr ?? ''}`;
    if (r.status !== 0) {
      if (out.includes('429') || out.toLowerCase().includes('rate-limited')) {
        console.warn(
          '  UYARI: Ucretsiz model kotasi dolu — diger adimlar OK. 30-60 dk sonra: npm run job:draft',
        );
      } else if (out.includes('Gunluk limit')) {
        console.log('  Gunluk limit dolu (beklenen).');
      } else {
        process.stderr.write(out);
        throw new Error('job:draft basarisiz');
      }
    } else {
      process.stdout.write(out);
    }
  } else {
    console.log('\n  Taslak atlandi (--skip-draft)');
  }

  const pb = await getAdminPb();
  const all = await listGuideRecords(pb);
  const pending = all.filter((r) =>
    ['incelemede', 'taslak'].includes(String(r.durum)),
  );
  const yayin = all.filter((r) =>
    ['yayinda', 'dusuk_performans'].includes(String(r.durum)),
  );

  console.log('\n--- Ozet ---');
  console.log(`  Incelemede/taslak: ${pending.length}`);
  console.log(`  Yayinda/dusuk_perf: ${yayin.length}`);
  if (yayin[0]) {
    console.log(`  Ornek yayin: /rehber/${yayin[0].slug}`);
  }
  console.log('\nSmoke test tamam.\n');
}

main().catch((e) => {
  console.error('\n[HATA]', e instanceof Error ? e.message : e);
  process.exit(1);
});
