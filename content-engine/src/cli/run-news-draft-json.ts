import { ClientResponseError } from 'pocketbase';
import { runNewsDraftPipeline } from '../jobs/news-draft-runner.js';
import {
  ensureContentEngineCollections,
  isMissingCollectionError,
} from '../lib/ensure-collections.js';
import { cfg } from '../config.js';
import { resetAdminPb } from '../pb/client.js';

function parseKonuFromArgv(): string | undefined {
  const raw = process.argv.slice(2);
  const body = raw[0] === '--' ? raw.slice(1) : raw;
  const withoutScript = body.filter(
    (a) => !a.endsWith('.ts') && !a.includes('run-news-draft-json'),
  );
  const joined = (withoutScript.length ? withoutScript : body).join(' ').trim();
  return joined || undefined;
}

const konu =
  process.env.SEO_NEWS_KONU?.trim() || parseKonuFromArgv() || undefined;

function emitError(message: string, code = 'error') {
  console.log(JSON.stringify({ ok: false, code, message }));
  process.exit(1);
}

async function run() {
  try {
    const result = await runNewsDraftPipeline(konu ? { konu } : undefined);
    console.log(JSON.stringify(result));
  } catch (e) {
    if (isMissingCollectionError(e)) {
      resetAdminPb();
      await ensureContentEngineCollections();
      const retry = await runNewsDraftPipeline(konu ? { konu } : undefined);
      console.log(JSON.stringify(retry));
      return;
    }
    if (e instanceof ClientResponseError) {
      const detail = e.response?.data ? JSON.stringify(e.response.data) : '';
      emitError(`${e.message} ${detail} (${cfg.pocketbaseUrl})`);
    }
    emitError(e instanceof Error ? e.message : String(e));
  }
}

run().catch((e) => {
  emitError(e instanceof Error ? e.message : String(e));
});
