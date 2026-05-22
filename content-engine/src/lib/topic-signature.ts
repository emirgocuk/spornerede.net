/** Anahtar kelime / konu tekrar kontrolu icin normalize imza */

const SEHIRLER = ['istanbul', 'ankara', 'izmir', 'bursa', 'antalya', 'adana', 'konya'];
const BRANSLAR = [
  'voleybol', 'basketbol', 'yuzme', 'tenis', 'futbol', 'jimnastik', 'atletizm',
  'boks', 'judo', 'karate', 'hentbol', 'badminton', 'pilates', 'yoga', 'bisiklet',
];

export function topicSignature(konu: string): string {
  const lower = konu.toLowerCase().trim();
  const tokens: string[] = [];
  for (const s of SEHIRLER) if (lower.includes(s)) tokens.push(`s:${s}`);
  for (const b of BRANSLAR) if (lower.includes(b)) tokens.push(`b:${b}`);
  if (/\b(kursu|kurslari|kursları|kurs)\b/.test(lower)) tokens.push('intent:kurs');
  if (/\bnedir\b/.test(lower)) tokens.push('intent:nedir');
  if (/\bfayda/.test(lower)) tokens.push('intent:fayda');
  if (/\b(cocuk|çocuk)/.test(lower)) tokens.push('intent:cocuk');
  if (/\b(yaz|kis|kış|kamp|sezon)\b/.test(lower)) tokens.push('intent:sezon');
  if (!tokens.length) tokens.push(`raw:${lower.replace(/\s+/g, '_').slice(0, 40)}`);
  return tokens.sort().join('|');
}

export function signaturesSimilar(a: string, b: string): boolean {
  if (a === b) return true;
  const setA = new Set(a.split('|'));
  const setB = new Set(b.split('|'));
  let overlap = 0;
  for (const t of setA) if (setB.has(t)) overlap += 1;
  if (overlap >= 2) return true;
  if (setA.has('intent:kurs') && setB.has('intent:kurs')) {
    const cityA = [...setA].find((x) => x.startsWith('s:'));
    const cityB = [...setB].find((x) => x.startsWith('s:'));
    const brA = [...setA].find((x) => x.startsWith('b:'));
    const brB = [...setB].find((x) => x.startsWith('b:'));
    if (cityA && cityB && cityA === cityB && brA && brB && brA === brB) return true;
  }
  return false;
}
