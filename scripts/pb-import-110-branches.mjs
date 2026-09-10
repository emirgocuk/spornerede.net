import PocketBase from 'pocketbase';
import { existsSync, readFileSync } from 'node:fs';

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
    .replace(/ğ/g, 'g')
    .replace(/ü/g, 'u')
    .replace(/ş/g, 's')
    .replace(/ı/g, 'i')
    .replace(/ö/g, 'o')
    .replace(/ç/g, 'c')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
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

const BRANCH_NAMES = [
  'Futbol',
  'Futsal',
  'Plaj Futbolu',
  'Kadın Futbolu',
  'Basketbol',
  '3x3 Basketbol',
  'Voleybol',
  'Plaj Voleybolu',
  'Hentbol',
  'Plaj Hentbolu',
  'Yüzme',
  'Su Topu',
  'Dalış',
  'Serbest Dalış',
  'Kürek',
  'Kano',
  'Dragon Bot',
  'Rafting',
  'Yelken',
  'Rüzgar Sörfü',
  'Kitesurf',
  'Sörf',
  'SUP',
  'Wakeboard',
  'Su Kayağı',
  'Triatlon',
  'Duatlon',
  'Akuatlon',
  'Atletizm',
  'Maraton',
  'Yürüyüş',
  'Dağ Koşusu',
  'Koşu',
  'Bisiklet',
  'Yol Bisikleti',
  'Dağ Bisikleti',
  'BMX',
  'Pist Bisikleti',
  'Tenis',
  'Masa Tenisi',
  'Badminton',
  'Squash',
  'Padel',
  'Pickleball',
  'Teqball',
  'Boks',
  'Kick Boks',
  'Muay Thai',
  'Karate',
  'Taekwondo',
  'Judo',
  'Aikido',
  'Jiu Jitsu',
  'Wushu',
  'Krav Maga',
  'Eskrim',
  'Güreş',
  'Yağlı Güreş',
  'Sambo',
  'Halter',
  'Vücut Geliştirme',
  'Fitness',
  'Crossfit',
  'Pilates',
  'Yoga',
  'Cimnastik',
  'Artistik Cimnastik',
  'Ritmik Cimnastik',
  'Trambolin',
  'Akrobasi',
  'Dans',
  'Bale',
  'Modern Dans',
  'Hip Hop Dans',
  'Salsa',
  'Tango',
  'Zumba',
  'Halk Oyunları',
  'Capoeira',
  'Buz Pateni',
  'Artistik Buz Pateni',
  'Sürat Pateni',
  'Rulman Pateni',
  'Kayak',
  'Alp Disiplini',
  'Kuzey Kayağı',
  'Kayakla Atlama',
  'Snowboard',
  'Biathlon',
  'Buz Hokeyi',
  'Curling',
  'Okçuluk',
  'Geleneksel Okçuluk',
  'Atıcılık',
  'Atış Poligonu',
  'Binicilik',
  'Engel Atlama',
  'Atlı Dayanıklılık',
  'Polo',
  'Motor Sporları',
  'Ralli',
  'Karting',
  'Motokros',
  'Enduro',
  'ATV',
  'UTV',
  'Side by Side',
  'Trial Motosiklet',
  'Speedway',
  'Superbike',
  'Supermoto',
  '4x4 Offroad',
  'E-Spor',
  'Satranç',
  'Briç',
  'Bilardo',
  'Snooker',
  'Dart',
  'Bocce',
  'Petank',
  'Ragbi',
  'Amerikan Futbolu',
  'Beyzbol',
  'Softbol',
  'Lacrosse',
  'Yamaç Paraşütü',
  'Modern Pentatlon',
  'Bowling',
  'Oryantiring',
];

async function run() {
  loadLocalEnv();
  if (!process.env.POCKETBASE_URL) throw new Error('POCKETBASE_URL tanimli degil.');
  if (!process.env.POCKETBASE_ADMIN_EMAIL || !process.env.POCKETBASE_ADMIN_PASSWORD) {
    throw new Error('POCKETBASE admin bilgileri tanimli degil.');
  }

  const trimmed = BRANCH_NAMES.map((name) => name.trim()).filter(Boolean);
  const unique = Array.from(new Set(trimmed));
  if (unique.length !== trimmed.length) {
    const seen = new Set();
    const dupes = trimmed.filter((name) => {
      if (seen.has(name)) return true;
      seen.add(name);
      return false;
    });
    throw new Error(`Tekrarlayan brans adi: ${[...new Set(dupes)].join(', ')}`);
  }

  const pb = new PocketBase(process.env.POCKETBASE_URL);
  await pb
    .collection('_superusers')
    .authWithPassword(process.env.POCKETBASE_ADMIN_EMAIL, process.env.POCKETBASE_ADMIN_PASSWORD);

  let created = 0;
  let updated = 0;

  for (const name of unique) {
    const slug = normalizeSlug(name);
    if (!slug) continue;
    const filter = `slug = "${escapeFilter(slug)}"`;
    const existing = await pb.collection('branslar').getFirstListItem(filter).catch(() => null);

    if (existing) {
      await pb.collection('branslar').update(existing.id, {
        ad: name,
        slug,
      });
      updated += 1;
      continue;
    }

    await pb.collection('branslar').create({
      legacyId: makeLegacyId('branch', slug),
      ad: name,
      slug,
      aciklama: `${name} eğitimi`,
      emoji: '🏅',
      renk: '#E30A17',
    });
    created += 1;
  }

  const totals = await pb.collection('branslar').getList(1, 1);
  console.log('Brans import tamamlandi.');
  console.log(`+${created} yeni, ~${updated} guncellendi`);
  console.log(`Toplam brans sayisi: ${totals.totalItems}`);
}

run().catch((error) => {
  console.error('Brans import hatasi:', error);
  process.exit(1);
});
