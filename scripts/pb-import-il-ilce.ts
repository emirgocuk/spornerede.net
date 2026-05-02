import { getDb, hasDatabaseUrl } from '../src/db/client';
import { existsSync, readFileSync } from 'node:fs';

type SourceDistrict = {
  id: string;
  il_id: string;
  name: string;
};

type SourceCity = {
  id: string;
  name: string;
};

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

function normalizeSlug(value: string) {
  return String(value ?? '')
    .trim()
    .toLocaleLowerCase('tr-TR')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

function normalizeName(value: string) {
  return String(value ?? '').trim();
}

function escapeFilter(value: string) {
  return value.replace(/\\/g, '\\\\').replace(/"/g, '\\"');
}

function makeLegacyId(...parts: Array<string | number>) {
  const key = parts.join('|');
  let hash = 2166136261;
  for (let i = 0; i < key.length; i += 1) {
    hash ^= key.charCodeAt(i);
    hash = Math.imul(hash, 16777619);
  }
  return Math.abs(hash >>> 0);
}

type PhpMyAdminExport<T> = {
  type: string;
  name?: string;
  data?: T[];
};

async function fetchSourceData() {
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

  const cityJson = (await citiesResponse.json()) as unknown;
  const districtJson = (await districtsResponse.json()) as unknown;
  if (!Array.isArray(cityJson) || !Array.isArray(districtJson)) {
    throw new Error('Kaynak veri formati beklenen dizi yapisinda degil.');
  }

  const cityTable = (cityJson as PhpMyAdminExport<SourceCity>[]).find(
    (entry) => entry.type === 'table' && entry.name === 'il',
  );
  const districtTable = (districtJson as PhpMyAdminExport<SourceDistrict>[]).find(
    (entry) => entry.type === 'table' && entry.name === 'ilce',
  );

  return {
    cities: Array.isArray(cityTable?.data) ? cityTable.data : [],
    districts: Array.isArray(districtTable?.data) ? districtTable.data : [],
  };
}

async function run() {
  loadLocalEnv();
  if (!hasDatabaseUrl()) {
    throw new Error('POCKETBASE_URL tanimli degil. Once .env ayarlayin.');
  }

  const db = await getDb();
  const { cities: sourceCities, districts: sourceDistricts } = await fetchSourceData();
  const districtsByCityId = sourceDistricts.reduce<Map<number, SourceDistrict[]>>((map, district) => {
    const cityCode = Number(district.il_id);
    if (!cityCode || cityCode > 81) return map;
    const group = map.get(cityCode);
    if (group) {
      group.push(district);
    } else {
      map.set(cityCode, [district]);
    }
    return map;
  }, new Map<number, SourceDistrict[]>());

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
    const existingCity = await db.collection('iller').getFirstListItem(cityFilter).catch(() => null);

    if (existingCity) {
      await db.collection('iller').update(existingCity.id, {
        ad: cityName,
        slug: citySlug,
        legacyId: cityLegacyId,
      });
      cityUpdated += 1;
    } else {
      await db.collection('iller').create({
        legacyId: cityLegacyId,
        ad: cityName,
        slug: citySlug,
      });
      cityCreated += 1;
    }

    const cityRow = await db.collection('iller').getFirstListItem(cityFilter);
    const cityId = Number(cityRow.legacyId);
    const districts = districtsByCityId.get(cityLegacyId) ?? [];

    for (const sourceDistrict of districts) {
      const districtName = normalizeName(sourceDistrict.name);
      const districtSlug = normalizeSlug(sourceDistrict.name);
      if (!districtName || !districtSlug) continue;

      const districtLegacyId = makeLegacyId('district', citySlug, districtSlug);
      const districtFilter = `ilLegacyId = ${cityId} && slug = "${escapeFilter(districtSlug)}"`;
      const existingDistrict = await db.collection('ilceler').getFirstListItem(districtFilter).catch(() => null);

      if (existingDistrict) {
        await db.collection('ilceler').update(existingDistrict.id, {
          ad: districtName,
          slug: districtSlug,
          ilLegacyId: cityId,
        });
        districtUpdated += 1;
      } else {
        await db.collection('ilceler').create({
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

run()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error('Il/ilce import hatasi:', error);
    process.exit(1);
  });
