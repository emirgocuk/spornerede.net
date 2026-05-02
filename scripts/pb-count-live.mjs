import PocketBase from 'pocketbase';

const pb = new PocketBase(process.env.POCKETBASE_URL);
await pb.collection('_superusers').authWithPassword(process.env.POCKETBASE_ADMIN_EMAIL, process.env.POCKETBASE_ADMIN_PASSWORD);

async function getAll(collection) {
  const rows = [];
  let page = 1;
  while (true) {
    const res = await pb.collection(collection).getList(page, 200, { sort: 'id' });
    rows.push(...res.items);
    if (page >= res.totalPages) break;
    page += 1;
  }
  return rows;
}

const cities = await getAll('iller');
const districts = await getAll('ilceler');

const trCities = cities.filter((c) => Number(c.legacyId) >= 1 && Number(c.legacyId) <= 81);
const trDistricts = districts.filter((d) => Number(d.ilLegacyId) >= 1 && Number(d.ilLegacyId) <= 81);

const cityDupes = trCities.length - new Set(trCities.map((c) => `${c.legacyId}|${c.slug}`)).size;
const districtDupes = trDistricts.length - new Set(trDistricts.map((d) => `${d.ilLegacyId}|${d.slug}`)).size;

console.log(JSON.stringify({
  allIller: cities.length,
  allIlceler: districts.length,
  trIller: trCities.length,
  trIlceler: trDistricts.length,
  trIllerUnique: new Set(trCities.map((c) => c.legacyId)).size,
  districtDupeByCitySlug: districtDupes,
  cityDupeByLegacySlug: cityDupes,
}));
