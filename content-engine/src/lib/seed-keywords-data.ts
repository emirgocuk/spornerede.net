import type PocketBase from 'pocketbase';

export type SeedRow = {
  anahtar: string;
  kategori: string;
  niyet: string;
  skor?: number;
  siteContext?: Record<string, unknown>;
};

const BRANSLAR = [
  'voleybol',
  'basketbol',
  'yuzme',
  'tenis',
  'futbol',
  'jimnastik',
  'atletizm',
  'boks',
  'judo',
  'karate',
  'hentbol',
  'badminton',
  'pilates',
  'yoga',
  'bisiklet',
  'okculuk',
  'krav-maga',
];

// Ebeveyn karar süreçleri ve genel yüksek niyetli rehber anahtar kelimeler
const PARENT_DECISION_BASE: SeedRow[] = [
  { anahtar: 'cocuk icin hangi spor secilmeli', kategori: 'ebeveyn_karar', niyet: 'yonlendirme', skor: 20 },
  { anahtar: 'kac yasinda spora baslanmali cocuk gelisimi', kategori: 'ebeveyn_karar', niyet: 'bilgi', skor: 20 },
  { anahtar: 'cocuklar icin sporcu lisansi nasil cikarilir', kategori: 'lisans_rehber', niyet: 'bilgi', skor: 18 },
  { anahtar: 'spor kulubu secerken dikkat edilmesi gerekenler', kategori: 'ebeveyn_karar', niyet: 'yonlendirme', skor: 20 },
  { anahtar: 'okul sonrasi spor kursu secimi ve saat plani', kategori: 'ebeveyn_karar', niyet: 'yonlendirme', skor: 18 },
  { anahtar: 'spor kulubu deneme dersinde nelere bakilmali', kategori: 'ebeveyn_karar', niyet: 'arastirma', skor: 18 },
  { anahtar: 'bireysel spor mu takim sporu mu cocuk gelisimi', kategori: 'ebeveyn_karar', niyet: 'bilgi', skor: 18 },
  { anahtar: 'cocuklarda spor sakatliklarindan korunma rehberi', kategori: 'ebeveyn_karar', niyet: 'bilgi', skor: 16 },
  { anahtar: 'okul ve lisansli spor ayni anda nasil yurutulur', kategori: 'ebeveyn_karar', niyet: 'yonlendirme', skor: 18 },
  { anahtar: 'yaz spor okullari secim rehberi ve ucretler', kategori: 'sezonsal', niyet: 'yonlendirme', skor: 16 },
  { anahtar: 'kis donemi kapali salon spor kurslari rehberi', kategori: 'sezonsal', niyet: 'yonlendirme', skor: 16 },
];

function normalizeTr(s: string): string {
  return (s || '')
    .trim()
    .toLowerCase()
    .replace(/ğ/g, 'g')
    .replace(/ü/g, 'u')
    .replace(/ş/g, 's')
    .replace(/ı/g, 'i')
    .replace(/ö/g, 'o')
    .replace(/ç/g, 'c');
}

export async function buildSeedRows(pb?: PocketBase): Promise<SeedRow[]> {
  const rows: SeedRow[] = [...PARENT_DECISION_BASE];
  const seen = new Set(rows.map((r) => r.anahtar));

  const add = (row: SeedRow) => {
    const key = row.anahtar.trim().toLowerCase();
    if (!seen.has(key)) {
      seen.add(key);
      rows.push({ ...row, anahtar: key });
    }
  };

  // Branş bazlı ebeveyn karar ve maliyet süreçleri (KESİNLİKLE "nedir" yok)
  for (const b of BRANSLAR) {
    add({
      anahtar: `cocuklar kac yasinda ${b} sporuna baslamali`,
      kategori: 'ebeveyn_karar',
      niyet: 'bilgi',
      skor: 20,
    });
    add({
      anahtar: `${b} spor kulubu secerken nelere dikkat edilmeli`,
      kategori: 'ebeveyn_karar',
      niyet: 'yonlendirme',
      skor: 20,
    });
    add({
      anahtar: `${b} lisansi nasil cikarilir ebeveyn rehberi`,
      kategori: 'lisans_rehber',
      niyet: 'bilgi',
      skor: 18,
    });
    add({
      anahtar: `${b} kursu fiyatlari ve ekipman masraflari`,
      kategori: 'fiyat_arastirma',
      niyet: 'arastirma',
      skor: 19,
    });
    add({
      anahtar: `cocuklar icin ${b} egitimi faydalari ve gelisim`,
      kategori: 'ebeveyn_karar',
      niyet: 'yonlendirme',
      skor: 17,
    });
    add({
      anahtar: `haftada kac gun ${b} antrenmani yapilmali`,
      kategori: 'ebeveyn_karar',
      niyet: 'bilgi',
      skor: 16,
    });
  }

  // Eğer PocketBase varsa onaylı kayıtlı kulüplerin il/ilçe/branş verilerini analiz et!
  if (pb) {
    try {
      const [clubs, iller, ilceler, branslar, clubBranches] = await Promise.all([
        pb.collection('kulupler').getFullList({ filter: 'durum = "approved"' }).catch(() => []),
        pb.collection('iller').getFullList().catch(() => []),
        pb.collection('ilceler').getFullList().catch(() => []),
        pb.collection('branslar').getFullList().catch(() => []),
        pb.collection('kulup_branslar').getFullList().catch(() => []),
      ]);

      const ilMap = new Map(iller.map((i) => [Number(i.legacyId), i]));
      const ilceMap = new Map(ilceler.map((i) => [Number(i.legacyId), i]));
      const bransMap = new Map(branslar.map((b) => [Number(b.legacyId), b]));

      const clubBranchMap = new Map<number, any[]>();
      for (const cb of clubBranches) {
        const kId = Number(cb.kulupLegacyId);
        if (!clubBranchMap.has(kId)) clubBranchMap.set(kId, []);
        const b = bransMap.get(Number(cb.bransLegacyId));
        if (b) clubBranchMap.get(kId)!.push(b);
      }

      for (const club of clubs) {
        const il = ilMap.get(Number(club.ilLegacyId));
        const ilce = ilceMap.get(Number(club.ilceLegacyId));
        const cBranches = clubBranchMap.get(Number(club.legacyId)) || [];

        const ilceSlug = ilce?.slug || normalizeTr(ilce?.ad || '');
        const ilSlug = il?.slug || normalizeTr(il?.ad || '');

        if (!ilceSlug) continue;

        for (const b of cBranches) {
          const bSlug = b.slug || normalizeTr(b.ad || '');
          if (!bSlug) continue;

          // İlçe + Branş + Fiyat ve Kulüp araştırması (En yüksek dönüşüm niyeti)
          add({
            anahtar: `${ilceSlug} ${bSlug} kursu fiyatlari ve kulupleri`,
            kategori: 'yerel_fiyat',
            niyet: 'arastirma',
            skor: 25,
            siteContext: {
              kulupAd: club.ad,
              ilce: ilce?.ad,
              il: il?.ad,
              brans: b.ad,
              fiyat: club.fiyatBilgisi,
              yas: club.yasAraligi,
            },
          });

          add({
            anahtar: `${ilceSlug} cocuk ${bSlug} okulu kayit rehberi`,
            kategori: 'yerel_kulup',
            niyet: 'islem',
            skor: 22,
            siteContext: {
              kulupAd: club.ad,
              ilce: ilce?.ad,
              il: il?.ad,
              brans: b.ad,
            },
          });

          add({
            anahtar: `${ilceSlug} ${bSlug} kulubu tavsiyeleri ve secim`,
            kategori: 'yerel_kulup',
            niyet: 'yonlendirme',
            skor: 21,
            siteContext: {
              kulupAd: club.ad,
              ilce: ilce?.ad,
              il: il?.ad,
              brans: b.ad,
            },
          });
        }
      }
    } catch (e) {
      console.warn('[seed] Kulup analizi yapilirken hata, temel listeyle devam:', e);
    }
  }

  // İlçe bazlı temel kombinasyonlar (Yedek olarak major ilçeler)
  const MAJOR_ILCELER = [
    { ilce: 'kadikoy', il: 'istanbul' },
    { ilce: 'besiktas', il: 'istanbul' },
    { ilce: 'cankaya', il: 'ankara' },
    { ilce: 'etimesgut', il: 'ankara' },
    { ilce: 'kecioren', il: 'ankara' },
    { ilce: 'karsiyaka', il: 'izmir' },
    { ilce: 'nilufer', il: 'bursa' },
    { ilce: 'muratpasa', il: 'antalya' },
  ];

  const POPULAR_BRANSLAR = ['yuzme', 'basketbol', 'voleybol', 'futbol', 'tenis', 'jimnastik', 'judo'];

  for (const { ilce } of MAJOR_ILCELER) {
    for (const b of POPULAR_BRANSLAR) {
      add({
        anahtar: `${ilce} ${b} kursu fiyatlari ve kulupleri`,
        kategori: 'yerel_fiyat',
        niyet: 'arastirma',
      });
      add({
        anahtar: `${ilce} cocuk ${b} okullari`,
        kategori: 'yerel_kulup',
        niyet: 'islem',
      });
    }
  }

  return rows;
}
