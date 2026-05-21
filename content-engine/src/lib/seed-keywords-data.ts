export type SeedRow = { anahtar: string; kategori: string; niyet: string };

const BRANSLAR = [
  'voleybol', 'basketbol', 'yuzme', 'tenis', 'futbol', 'jimnastik', 'atletizm',
  'boks', 'judo', 'karate', 'hentbol', 'badminton', 'pilates', 'yoga', 'bisiklet',
];

const SEHIRLER = ['istanbul', 'ankara', 'izmir', 'bursa', 'antalya'];

const BASE: SeedRow[] = [
  { anahtar: 'cocuk icin hangi spor secilmeli', kategori: 'ebeveyn', niyet: 'yonlendirme' },
  { anahtar: 'kac yasinda spora baslanmali', kategori: 'ebeveyn', niyet: 'bilgi' },
  { anahtar: 'okul sonrasi spor kursu secimi', kategori: 'ebeveyn', niyet: 'yonlendirme' },
  { anahtar: 'yaz spor kurslari rehberi', kategori: 'sezonsal', niyet: 'yonlendirme' },
  { anahtar: 'kis sporlari cocuklar icin', kategori: 'sezonsal', niyet: 'bilgi' },
  { anahtar: 'spor kulubu nasil secilir', kategori: 'ebeveyn', niyet: 'islem' },
];

export function buildSeedRows(): SeedRow[] {
  const rows: SeedRow[] = [...BASE];
  const seen = new Set(rows.map((r) => r.anahtar));

  const add = (row: SeedRow) => {
    if (!seen.has(row.anahtar)) {
      seen.add(row.anahtar);
      rows.push(row);
    }
  };

  for (const b of BRANSLAR) {
    add({ anahtar: `${b} nedir`, kategori: 'nedir', niyet: 'bilgi' });
    add({ anahtar: `${b} nasil ogrenilir`, kategori: 'nasil', niyet: 'bilgi' });
    add({ anahtar: `${b} faydalari`, kategori: 'faydalari', niyet: 'bilgi' });
    add({ anahtar: `cocuklar icin ${b}`, kategori: 'ebeveyn', niyet: 'yonlendirme' });
  }

  for (const s of SEHIRLER) {
    for (const b of BRANSLAR) {
      add({ anahtar: `${s} ${b} kursu`, kategori: 'sehir_brans', niyet: 'islem' });
    }
    add({ anahtar: `${s} spor kurslari`, kategori: 'sehir_brans', niyet: 'islem' });
  }

  return rows;
}
