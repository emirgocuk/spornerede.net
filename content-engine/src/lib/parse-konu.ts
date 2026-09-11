const SEHIRLER = ['istanbul', 'ankara', 'izmir', 'bursa', 'antalya', 'adana', 'konya'];
const BRANSLAR = [
  'voleybol', 'basketbol', 'yuzme', 'yüzme', 'tenis', 'futbol', 'jimnastik', 'cimnastik', 'atletizm',
  'boks', 'judo', 'karate', 'hentbol', 'badminton', 'pilates', 'yoga', 'bisiklet',
  'oryantiring', 'satranc', 'satranç', 'gures', 'güreş', 'okculuk', 'okçuluk',
  'krav maga', 'krav-maga', 'kravmaga',
  'sualti hokeyi', 'sualtı hokeyi', 'sualti-hokeyi',
];

const SEHIR_LABEL: Record<string, string> = {
  istanbul: 'İstanbul',
  ankara: 'Ankara',
  izmir: 'İzmir',
  bursa: 'Bursa',
  antalya: 'Antalya',
  adana: 'Adana',
  konya: 'Konya',
};

const BRANS_LABEL: Record<string, string> = {
  voleybol: 'Voleybol',
  basketbol: 'Basketbol',
  yuzme: 'Yüzme',
  yüzme: 'Yüzme',
  tenis: 'Tenis',
  futbol: 'Futbol',
  jimnastik: 'Cimnastik',
  cimnastik: 'Cimnastik',
  atletizm: 'Atletizm',
  boks: 'Boks',
  judo: 'Judo',
  karate: 'Karate',
  hentbol: 'Hentbol',
  badminton: 'Badminton',
  pilates: 'Pilates',
  yoga: 'Yoga',
  bisiklet: 'Bisiklet',
  oryantiring: 'Oryantiring',
  satranc: 'Satranç',
  satranç: 'Satranç',
  gures: 'Güreş',
  güreş: 'Güreş',
  okculuk: 'Okçuluk',
  okçuluk: 'Okçuluk',
  'krav maga': 'Krav Maga',
  'krav-maga': 'Krav Maga',
  kravmaga: 'Krav Maga',
  'sualti hokeyi': 'Sualtı Hokeyi',
  'sualtı hokeyi': 'Sualtı Hokeyi',
  'sualti-hokeyi': 'Sualtı Hokeyi',
};

const ILCE_MAP: Record<string, { slug: string; label: string; sehir: string }> = {
  kadikoy: { slug: 'kadikoy', label: 'Kadıköy', sehir: 'istanbul' },
  'kadıköy': { slug: 'kadikoy', label: 'Kadıköy', sehir: 'istanbul' },
  besiktas: { slug: 'besiktas', label: 'Beşiktaş', sehir: 'istanbul' },
  'beşiktaş': { slug: 'besiktas', label: 'Beşiktaş', sehir: 'istanbul' },
  uskudar: { slug: 'uskudar', label: 'Üsküdar', sehir: 'istanbul' },
  'üsküdar': { slug: 'uskudar', label: 'Üsküdar', sehir: 'istanbul' },
  sisli: { slug: 'sisli', label: 'Şişli', sehir: 'istanbul' },
  'şişli': { slug: 'sisli', label: 'Şişli', sehir: 'istanbul' },
  bakirkoy: { slug: 'bakirkoy', label: 'Bakırköy', sehir: 'istanbul' },
  'bakırköy': { slug: 'bakirkoy', label: 'Bakırköy', sehir: 'istanbul' },
  atasehir: { slug: 'atasehir', label: 'Ataşehir', sehir: 'istanbul' },
  'ataşehir': { slug: 'atasehir', label: 'Ataşehir', sehir: 'istanbul' },
  maltepe: { slug: 'maltepe', label: 'Maltepe', sehir: 'istanbul' },
  kartal: { slug: 'kartal', label: 'Kartal', sehir: 'istanbul' },
  pendik: { slug: 'pendik', label: 'Pendik', sehir: 'istanbul' },
  umraniye: { slug: 'umraniye', label: 'Ümraniye', sehir: 'istanbul' },
  'ümraniye': { slug: 'umraniye', label: 'Ümraniye', sehir: 'istanbul' },
  beylikduzu: { slug: 'beylikduzu', label: 'Beylikdüzü', sehir: 'istanbul' },
  'beylikdüzü': { slug: 'beylikduzu', label: 'Beylikdüzü', sehir: 'istanbul' },
  cankaya: { slug: 'cankaya', label: 'Çankaya', sehir: 'ankara' },
  'çankaya': { slug: 'cankaya', label: 'Çankaya', sehir: 'ankara' },
  etimesgut: { slug: 'etimesgut', label: 'Etimesgut', sehir: 'ankara' },
  kecioren: { slug: 'kecioren', label: 'Keçiören', sehir: 'ankara' },
  'keçiören': { slug: 'kecioren', label: 'Keçiören', sehir: 'ankara' },
  yenimahalle: { slug: 'yenimahalle', label: 'Yenimahalle', sehir: 'ankara' },
  mamak: { slug: 'mamak', label: 'Mamak', sehir: 'ankara' },
  golbasi: { slug: 'golbasi', label: 'Gölbaşı', sehir: 'ankara' },
  'gölbaşı': { slug: 'golbasi', label: 'Gölbaşı', sehir: 'ankara' },
  karsiyaka: { slug: 'karsiyaka', label: 'Karşıyaka', sehir: 'izmir' },
  'karşıyaka': { slug: 'karsiyaka', label: 'Karşıyaka', sehir: 'izmir' },
  bornova: { slug: 'bornova', label: 'Bornova', sehir: 'izmir' },
  konak: { slug: 'konak', label: 'Konak', sehir: 'izmir' },
  buca: { slug: 'buca', label: 'Buca', sehir: 'izmir' },
  bayrakli: { slug: 'bayrakli', label: 'Bayraklı', sehir: 'izmir' },
  'bayraklı': { slug: 'bayrakli', label: 'Bayraklı', sehir: 'izmir' },
  nilufer: { slug: 'nilufer', label: 'Nilüfer', sehir: 'bursa' },
  'nilüfer': { slug: 'nilufer', label: 'Nilüfer', sehir: 'bursa' },
  osmangazi: { slug: 'osmangazi', label: 'Osmangazi', sehir: 'bursa' },
  yildirim: { slug: 'yildirim', label: 'Yıldırım', sehir: 'bursa' },
  'yıldırım': { slug: 'yildirim', label: 'Yıldırım', sehir: 'bursa' },
  muratpasa: { slug: 'muratpasa', label: 'Muratpaşa', sehir: 'antalya' },
  'muratpaşa': { slug: 'muratpasa', label: 'Muratpaşa', sehir: 'antalya' },
  konyaalti: { slug: 'konyaalti', label: 'Konyaaltı', sehir: 'antalya' },
  'konyaaltı': { slug: 'konyaalti', label: 'Konyaaltı', sehir: 'antalya' },
  kepez: { slug: 'kepez', label: 'Kepez', sehir: 'antalya' },
  seyhan: { slug: 'seyhan', label: 'Seyhan', sehir: 'adana' },
  cukurova: { slug: 'cukurova', label: 'Çukurova', sehir: 'adana' },
  'çukurova': { slug: 'cukurova', label: 'Çukurova', sehir: 'adana' },
  selcuklu: { slug: 'selcuklu', label: 'Selçuklu', sehir: 'konya' },
  'selçuklu': { slug: 'selcuklu', label: 'Selçuklu', sehir: 'konya' },
  meram: { slug: 'meram', label: 'Meram', sehir: 'konya' },
};

export type ParsedKonu = {
  raw: string;
  lower: string;
  sehir: string;
  sehirLabel: string;
  ilce: string;
  ilceLabel: string;
  brans: string;
  bransLabel: string;
  hasSehir: boolean;
  hasIlce: boolean;
  hasBrans: boolean;
};

export function parseKonu(konu: string): ParsedKonu {
  const raw = konu.trim();
  const lower = raw.toLowerCase();
  let sehir = '';
  let ilce = '';
  let ilceLabel = '';
  let brans = '';

  for (const [key, meta] of Object.entries(ILCE_MAP)) {
    if (lower.includes(key)) {
      ilce = meta.slug;
      ilceLabel = meta.label;
      if (!sehir) sehir = meta.sehir;
      break;
    }
  }

  for (const s of SEHIRLER) {
    if (lower.includes(s)) {
      sehir = s;
      break;
    }
  }

  for (const b of BRANSLAR) {
    if (lower.includes(b)) {
      brans = b;
      break;
    }
  }

  return {
    raw,
    lower,
    sehir,
    sehirLabel: sehir ? (SEHIR_LABEL[sehir] ?? sehir) : 'Türkiye',
    ilce,
    ilceLabel,
    brans,
    bransLabel: brans ? (BRANS_LABEL[brans] ?? brans) : 'Spor',
    hasSehir: Boolean(sehir),
    hasIlce: Boolean(ilce),
    hasBrans: Boolean(brans),
  };
}
