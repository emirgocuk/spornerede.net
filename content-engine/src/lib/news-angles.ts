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
];

export function pickNewsWritingAngle(seed?: string): string {
  if (!seed) {
    return NEWS_WRITING_ANGLES[Math.floor(Math.random() * NEWS_WRITING_ANGLES.length)]!;
  }
  let h = 0;
  for (let i = 0; i < seed.length; i += 1) h = (h * 31 + seed.charCodeAt(i)) >>> 0;
  return NEWS_WRITING_ANGLES[h % NEWS_WRITING_ANGLES.length]!;
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
