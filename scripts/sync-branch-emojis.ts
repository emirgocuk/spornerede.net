/**
 * PocketBase branslar koleksiyonundaki emoji/renk alanlarini gunceller.
 * Kullanim: npm run pb:sync-branch-emojis
 */
import { existsSync, readFileSync } from 'node:fs';
import { getDb, hasDatabaseUrl } from '../src/db/client';
import { enrichBranchFields } from '../src/lib/branches/branchEmoji';

function loadLocalEnv() {
  if (!existsSync('.env')) return;
  const lines = readFileSync('.env', 'utf8').split(/\r?\n/);
  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const separatorIndex = trimmed.indexOf('=');
    if (separatorIndex === -1) continue;
    const key = trimmed.slice(0, separatorIndex).trim();
    const rawValue = trimmed.slice(separatorIndex + 1).trim();
    if (!key || process.env[key]) continue;
    process.env[key] = rawValue.replace(/^["']|["']$/g, '');
  }
}

async function run() {
  loadLocalEnv();
  if (!hasDatabaseUrl()) {
    throw new Error('POCKETBASE_URL tanimli degil.');
  }

  const db = await getDb();
  const rows = await db.collection('branslar').getFullList({ sort: 'ad' });
  let updated = 0;

  for (const row of rows) {
    const slug = String(row.slug ?? '');
    const isim = String(row.ad ?? '');
    const next = enrichBranchFields({
      slug,
      isim,
      emoji: String(row.emoji ?? ''),
      renk: String(row.renk ?? ''),
    });

    if (row.emoji === next.emoji && row.renk === next.renk) continue;

    await db.collection('branslar').update(row.id, {
      emoji: next.emoji,
      renk: next.renk,
    });
    updated += 1;
    console.log(`${isim} (${slug}) → ${next.emoji}`);
  }

  console.log(`Tamam: ${updated}/${rows.length} brans guncellendi.`);
}

run().catch((error) => {
  console.error('Brans emoji senkron hatasi:', error);
  process.exit(1);
});
