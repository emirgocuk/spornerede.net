/** Anahtar kelime / konu tekrar kontrolu icin normalize imza */

const SEHIRLER = ['istanbul', 'ankara', 'izmir', 'bursa', 'antalya', 'adana', 'konya'];
const BRANSLAR = [
  'voleybol',
  'basketbol',
  'yuzme',
  'yüzme',
  'tenis',
  'futbol',
  'jimnastik',
  'cimnastik',
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
  'okçuluk',
  'satranc',
  'satranç',
  'gures',
  'güreş',
  'krav maga',
  'krav-maga',
  'kravmaga',
  'sualti hokeyi',
  'sualtı hokeyi',
  'sualti-hokeyi',
];

export function topicSignature(konu: string): string {
  const lower = konu.toLowerCase().trim();
  const tokens: string[] = [];

  for (const s of SEHIRLER) if (lower.includes(s)) tokens.push(`s:${s}`);
  for (const b of BRANSLAR) {
    const normB = b.replace('yüzme', 'yuzme').replace('cimnastik', 'jimnastik').replace('okçuluk', 'okculuk');
    if (lower.includes(b)) tokens.push(`b:${normB}`);
  }

  if (/\b(kursu|kurslari|kursları|kurs)\b/.test(lower)) tokens.push('intent:kurs');
  if (/\b(fiyat|ucret|ücret|maliyet)\b/.test(lower)) tokens.push('intent:fiyat');
  if (/\b(yas|yaş|kac yasinda|kaç yaşında)\b/.test(lower)) tokens.push('intent:yas');
  if (/\b(lisans|lisansi|lisansı)\b/.test(lower)) tokens.push('intent:lisans');
  if (/\b(kulup secimi|secerken|seçerken|tavsiye)\b/.test(lower)) tokens.push('intent:secim');
  if (/\b(antrenman|haftada)\b/.test(lower)) tokens.push('intent:antrenman');
  if (/\bnedir\b/.test(lower)) tokens.push('intent:nedir');
  if (/\bfayda/.test(lower)) tokens.push('intent:fayda');
  if (/\b(cocuk|çocuk)/.test(lower)) tokens.push('intent:cocuk');
  if (/\b(yaz|kis|kış|kamp|sezon)\b/.test(lower)) tokens.push('intent:sezon');

  // Tek başına sadece 'intent:cocuk' veya 'intent:kurs' gibi tek bir jenerik token kaldıysa konunun ayırt edici kökünü de ekle
  if (tokens.length <= 1) {
    const cleanWord = lower.replace(/[^\w\sğüşıöç]/g, '').split(/\s+/).filter((w) => w.length > 4).slice(0, 3).join('_');
    if (cleanWord) tokens.push(`topic:${cleanWord}`);
  }

  return [...new Set(tokens)].sort().join('|');
}

export function signaturesSimilar(a: string, b: string): boolean {
  if (a === b) return true;
  const setA = new Set(a.split('|'));
  const setB = new Set(b.split('|'));

  const brA = [...setA].find((x) => x.startsWith('b:'));
  const brB = [...setB].find((x) => x.startsWith('b:'));
  // Branşlar varsa ve farklıysa ASLA benzer değildir (örn: judo vs yüzme)
  if (brA && brB && brA !== brB) return false;

  const cityA = [...setA].find((x) => x.startsWith('s:'));
  const cityB = [...setB].find((x) => x.startsWith('s:'));
  // Şehirler varsa ve farklıysa ASLA benzer değildir (örn: ankara vs istanbul)
  if (cityA && cityB && cityA !== cityB) return false;

  // Farklı intentler (örn: yaş rehberi vs lisans rehberi vs fiyat rehberi) asla aynı sayılmaz
  const intentA = [...setA].filter((x) => x.startsWith('intent:') && x !== 'intent:cocuk');
  const intentB = [...setB].filter((x) => x.startsWith('intent:') && x !== 'intent:cocuk');
  if (intentA.length > 0 && intentB.length > 0) {
    const hasIntentOverlap = intentA.some((it) => intentB.includes(it));
    if (!hasIntentOverlap) return false;
  }

  let overlap = 0;
  for (const t of setA) if (setB.has(t)) overlap += 1;
  if (overlap >= 3) return true;

  if (setA.has('intent:kurs') && setB.has('intent:kurs')) {
    if (cityA && cityB && cityA === cityB && brA && brB && brA === brB) return true;
  }

  return false;
}
