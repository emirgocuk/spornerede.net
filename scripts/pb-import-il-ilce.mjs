import PocketBase from 'pocketbase';
import { existsSync, readFileSync } from 'node:fs';

const CITIES_SOURCE_URL =
  'https://raw.githubusercontent.com/volkansenturk/turkiye-iller-ilceler/master/il.json';
const DISTRICTS_SOURCE_URL =
  'https://raw.githubusercontent.com/volkansenturk/turkiye-iller-ilceler/master/ilce.json';

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

function normalizeSlug(value) {
  return String(value ?? '')
    .trim()
    .toLocaleLowerCase('tr-TR')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

function normalizeName(value) {
  return String(value ?? '').trim();
}

function escapeFilter(value) {
  return value.replace(/\\/g, '\\\\').replace(/"/g, '\\"');
}

function makeLegacyId(...parts) {
  const key = parts.join('|');
  let hash = 2166136261;
  for (let i = 0; i < key.length; i += 1) {
    hash ^= key.charCodeAt(i);
    hash = Math.imul(hash, 16777619);
  }
  return Math.abs(hash >>> 0);
}

async function run() {
  loadLocalEnv();
  if (!process.env.POCKETBASE_URL) {
    throw new Error('POCKETBASE_URL tanimli degil.');
  }
  if (!process.env.POCKETBASE_ADMIN_EMAIL || !process.env.POCKETBASE_ADMIN_PASSWORD) {
    throw new Error('POCKETBASE admin bilgileri tanimli degil.');
  }

  const pb = new PocketBase(process.env.POCKETBASE_URL);
  await pb
    .collection('_superusers')
    .authWithPassword(process.env.POCKETBASE_ADMIN_EMAIL, process.env.POCKETBASE_ADMIN_PASSWORD);

  const [citiesResponse, districtsResponse] = await Promise.all([
    fetch(CITIES_SOURCE_URL, { headers: { Accept: 'application/json' } }),
    fetch(DISTRICTS_SOURCE_URL, { headers: { Accept: 'application/json' } }),
  ]);
  if (!citiesResponse.ok) {
    throw new Error(`Il verisi cekilemedi. HTTP ${citiesResponse.status}`);
  }
  if (!districtsResponse.ok) {
    throw new Error(`Ilce verisi cekilemedi. HTTP ${districtsResponse.status}`);
  }

  const cityJson = await citiesResponse.json();
  const districtJson = await districtsResponse.json();
  if (!Array.isArray(cityJson) || !Array.isArray(districtJson)) {
    throw new Error('Kaynak veri formati beklenen dizi yapisinda degil.');
  }
  const cityTable = cityJson.find((entry) => entry?.type === 'table' && entry?.name === 'il');
  const districtTable = districtJson.find((entry) => entry?.type === 'table' && entry?.name === 'ilce');
  const sourceCities = Array.isArray(cityTable?.data) ? cityTable.data : [];
  const sourceDistricts = Array.isArray(districtTable?.data) ? districtTable.data : [];
  const districtsByCityId = sourceDistricts.reduce((map, district) => {
    const cityCode = Number(district?.il_id);
    if (!cityCode || cityCode > 81) return map;
    if (!map.has(cityCode)) {
      map.set(cityCode, []);
    }
    map.get(cityCode).push(district);
    return map;
  }, new Map());

  let cityCreated = 0;
  let cityUpdated = 0;
  let districtCreated = 0;
  let districtUpdated = 0;

  for (const sourceCity of sourceCities) {
    const cityName = normalizeName(sourceCity.name);
    const citySlug = normalizeSlug(sourceCity.name);
    if (!cityName || !citySlug) continue;

    const cityLegacyId = Number(sourceCity.id) || makeLegacyId('city', citySlug);
    const cityFilter = `slug = "${escapeFilter(citySlug)}"`;
    const existingCity = await pb.collection('iller').getFirstListItem(cityFilter).catch(() => null);

    if (existingCity) {
      await pb.collection('iller').update(existingCity.id, {
        ad: cityName,
        slug: citySlug,
      });
      cityUpdated += 1;
    } else {
      await pb.collection('iller').create({
        legacyId: cityLegacyId,
        ad: cityName,
        slug: citySlug,
      });
      cityCreated += 1;
    }

    const cityRow = await pb.collection('iller').getFirstListItem(cityFilter);
    const cityId = Number(cityRow.legacyId);
    const districts = districtsByCityId.get(cityLegacyId) ?? [];

    for (const sourceDistrict of districts) {
      const districtName = normalizeName(sourceDistrict.name);
      const districtSlug = normalizeSlug(sourceDistrict.name);
      if (!districtName || !districtSlug) continue;

      const districtLegacyId = makeLegacyId('district', citySlug, districtSlug);
      const districtFilter = `ilLegacyId = ${cityId} && slug = "${escapeFilter(districtSlug)}"`;
      const existingDistrict = await pb.collection('ilceler').getFirstListItem(districtFilter).catch(() => null);

      if (existingDistrict) {
        await pb.collection('ilceler').update(existingDistrict.id, {
          ad: districtName,
          slug: districtSlug,
          ilLegacyId: cityId,
        });
        districtUpdated += 1;
      } else {
        await pb.collection('ilceler').create({
          legacyId: districtLegacyId,
          ad: districtName,
          slug: districtSlug,
          ilLegacyId: cityId,
        });
        districtCreated += 1;
      }
    }
  }

  console.log('Il/ilce import tamamlandi.');
  console.log(`Il: +${cityCreated} yeni, ~${cityUpdated} guncellendi`);
  console.log(`Ilce: +${districtCreated} yeni, ~${districtUpdated} guncellendi`);
}

run().catch((error) => {
  console.error('Il/ilce import hatasi:', error);
  process.exit(1);
});
