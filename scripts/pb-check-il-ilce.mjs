/**
 * Yerel/canlı PB'de il/ilçe kayıt sayısı ve örnek (Çorum plaka 19).
 * Kullanım: node scripts/pb-check-il-ilce.mjs
 */
import PocketBase from 'pocketbase';
import { existsSync, readFileSync } from 'node:fs';

function loadLocalEnv() {
  if (!existsSync('.env')) return;
  const lines = readFileSync('.env', 'utf8').split(/\r?\n/);
  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const i = trimmed.indexOf('=');
    if (i === -1) continue;
    const key = trimmed.slice(0, i).trim();
    const raw = trimmed.slice(i + 1).trim().replace(/^["']|["']$/g, '');
    if (key && process.env[key] === undefined) process.env[key] = raw;
  }
}

async function fullList(pb, name) {
  const out = [];
  let page = 1;
  const perPage = 200;
  while (true) {
    const res = await pb.collection(name).getList(page, perPage, { sort: 'ad' });
    out.push(...res.items);
    if (page >= res.totalPages) break;
    page += 1;
  }
  return out;
}

loadLocalEnv();
const url = process.env.POCKETBASE_URL;
const email = process.env.POCKETBASE_ADMIN_EMAIL;
const pass = process.env.POCKETBASE_ADMIN_PASSWORD;
if (!url || !email || !pass) {
  console.error('Eksik: POCKETBASE_URL, POCKETBASE_ADMIN_EMAIL, POCKETBASE_ADMIN_PASSWORD (.env)');
  process.exit(1);
}

const pb = new PocketBase(url);
await pb.collection('_superusers').authWithPassword(email, pass);

const iller = await fullList(pb, 'iller');
const ilceler = await fullList(pb, 'ilceler');

const corumCity = iller.find((r) => String(r.slug ?? '').toLowerCase() === 'corum');
const plate = 19;
const byCityLegacy = corumCity
  ? ilceler.filter((d) => Number(d.ilLegacyId) === Number(corumCity.legacyId))
  : [];
const byPlate = ilceler.filter((d) => Number(d.ilLegacyId) === plate);

console.log(
  JSON.stringify(
    {
      pocketbaseUrl: url,
      illerCount: iller.length,
      ilcelerCount: ilceler.length,
      corumIller: corumCity
        ? { slug: corumCity.slug, legacyId: corumCity.legacyId, ad: corumCity.ad }
        : null,
      ilcelerForCorumCityLegacy: byCityLegacy.length,
      ilcelerForPlate19: byPlate.length,
      sampleCorumDistricts: byPlate.slice(0, 5).map((d) => ({ ad: d.ad, slug: d.slug, ilLegacyId: d.ilLegacyId })),
    },
    null,
    2,
  ),
);

if (ilceler.length === 0) {
  console.error('\n→ ilceler bos. Calistir: node scripts/pb-import-il-ilce.mjs');
  process.exit(2);
}
