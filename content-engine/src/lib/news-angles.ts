/** LLM haberlerinde sablon tekrarini kirmak icin rastgele yazi acisi */

export const NEWS_WRITING_ANGLES = [
  'Deneme dersinde nelere bakilir — kisa kontrol listesi',
  'Ebeveynler icin: cocugun bransa uyumu ve guvenlik',
  'Haftalik program ve okul-is spor dengesi',
  'Kulup seciminde ucret, mesafe ve antrenor kriterleri',
  'Sezon basi kayit: erken basvuru avantajlari ve tuzaklar',
  'Yeni baslayanlar icin ilk ay beklentileri',
  'Tesis ve grup yasi: pratik karsilastirma ipuclari',
  'Yaz/kis donemi program farklari ve kayit zamanlamasi',
  'Iki-uc kulubu yan yana karsilastirma: nelere bakmali',
  'Maliyet rehberi: aylik/yillik ucret, ekipman ve gizli kalemler',
  'Yas gruplarina gore program secimi (cocuk, genc, yetiskin)',
  'Sik sorulan sorular ve kisa net yanitlar',
  'Yetiskinler icin yeniden baslama: zaman ve motivasyon',
  'Sakatlik onleme, isinma ve guvenli antrenman',
  'Ekipman ve baslangic malzemesi: gercekten gerekenler',
  'Hobi mi rekabet mi: hedefe gore kulup secimi',
  'Mahalle/ulasim odakli: yakindan baslamanin avantajlari',
  'Online kayit, deneme ve iptal sureci pratikte nasil isler',
];

function hashSeed(seed: string): number {
  let h = 0;
  for (let i = 0; i < seed.length; i += 1) h = (h * 31 + seed.charCodeAt(i)) >>> 0;
  return h;
}

export function pickNewsWritingAngle(seed?: string): string {
  if (!seed) {
    return NEWS_WRITING_ANGLES[Math.floor(Math.random() * NEWS_WRITING_ANGLES.length)]!;
  }
  return NEWS_WRITING_ANGLES[hashSeed(seed) % NEWS_WRITING_ANGLES.length]!;
}

/** Verilen aciya esit olmayan, deterministik farkli bir aci (dedup yeniden uretiminde kullanilir) */
export function pickAlternativeAngle(seed: string, exclude: string): string {
  const base = hashSeed(seed);
  for (let i = 1; i <= NEWS_WRITING_ANGLES.length; i += 1) {
    const cand = NEWS_WRITING_ANGLES[(base + i) % NEWS_WRITING_ANGLES.length]!;
    if (cand !== exclude) return cand;
  }
  return exclude;
}

export function buildAvoidListForPrompt(
  history: Array<{ baslik: string; konu: string; templateId?: string }>,
  limit = 10,
): string {
  const lines = history.slice(0, limit).map((h) => `- ${h.baslik} (konu: ${h.konu})`);
  return lines.length
    ? `${lines.join('\n')}\nYASAK kalip: "... kursu: kayit ve secim rehberi" benzeri basliklar.`
    : '(henuz yayin yok)';
}
