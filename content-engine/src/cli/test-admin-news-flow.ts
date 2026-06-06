/**
 * Admin haber uretim akisini birebir test eder (spawn + env).
 * Calistir: npm run content-engine:test-admin-flow (proje kokunden)
 */
import { config as loadEnv } from 'dotenv';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const projectRoot = resolve(dirname(fileURLToPath(import.meta.url)), '../../..');
loadEnv({ path: resolve(projectRoot, '.env') });
loadEnv({ path: resolve(projectRoot, 'content-engine/.env'), override: true });

const { spawnContentEngineCli } = await import(
  '../../../src/lib/contentEngine/spawnContentEngine.js'
);
const { ensureSeoKeywordsBeforeDraft, pickKonuForNewsDraft } = await import(
  '../../../src/lib/contentEngine/ensureSeoKeywordsBeforeDraft.js'
);

async function spawnDraft(konu: string, keywordId: string) {
  return new Promise<{ code: number | null; out: string }>((resolvePromise) => {
    const child = spawnContentEngineCli('src/cli/run-news-draft-json.ts', ['--', konu], {
      cwd: resolve(projectRoot, 'content-engine'),
      env: { SEO_NEWS_KONU: konu, SEO_NEWS_KEYWORD_ID: keywordId },
    });
    let out = '';
    child.stdout?.on('data', (d) => {
      out += String(d);
    });
    child.stderr?.on('data', (d) => {
      out += String(d);
    });
    child.on('close', (code) => resolvePromise({ code, out }));
  });
}

console.log('1 ensureSeoKeywordsBeforeDraft...');
const err = await ensureSeoKeywordsBeforeDraft();
if (err) {
  console.error('FAIL ensure:', err);
  process.exit(1);
}
console.log('   OK');

console.log('2 pickKonuForNewsDraft...');
const picked = await pickKonuForNewsDraft();
if (!picked) {
  console.error('FAIL: kuyruk bos');
  process.exit(1);
}
console.log('   OK', picked.anahtar, picked.id);

console.log('3 spawn child (kuyruk sorgusu olmamali)...');
const { code, out } = await spawnDraft(picked.anahtar, picked.id);
if (/Missing collection context|perPage=40.*kuyrukta/i.test(out)) {
  console.error('FAIL: seo_keywords kuyruk 404');
  console.error(out.slice(-800));
  process.exit(1);
}
const jsonLine = out
  .split('\n')
  .map((l) => l.trim())
  .filter(Boolean)
  .reverse()
  .find((l) => l.startsWith('{'));
console.log('   exit', code);
console.log('   result', jsonLine ?? out.slice(-200));
if (!jsonLine) process.exit(1);
console.log('PASS');
