const SEHIRLER = ['istanbul', 'ankara', 'izmir', 'bursa', 'antalya', 'adana', 'konya'];
const BRANSLAR = [
  'voleybol', 'basketbol', 'yuzme', 'tenis', 'futbol', 'jimnastik', 'atletizm',
  'boks', 'judo', 'karate', 'hentbol', 'badminton', 'pilates', 'yoga', 'bisiklet',
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
  tenis: 'Tenis',
  futbol: 'Futbol',
  jimnastik: 'Jimnastik',
  atletizm: 'Atletizm',
  boks: 'Boks',
  judo: 'Judo',
  karate: 'Karate',
  hentbol: 'Hentbol',
  badminton: 'Badminton',
  pilates: 'Pilates',
  yoga: 'Yoga',
  bisiklet: 'Bisiklet',
};

export type ParsedKonu = {
  raw: string;
  lower: string;
  sehir: string;
  sehirLabel: string;
  brans: string;
  bransLabel: string;
  hasSehir: boolean;
  hasBrans: boolean;
};

export function parseKonu(konu: string): ParsedKonu {
  const raw = konu.trim();
  const lower = raw.toLowerCase();
  let sehir = '';
  let brans = '';
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
    brans,
    bransLabel: brans ? (BRANS_LABEL[brans] ?? brans) : 'Spor',
    hasSehir: Boolean(sehir),
    hasBrans: Boolean(brans),
  };
}
