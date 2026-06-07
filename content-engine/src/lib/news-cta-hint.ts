import { parseKonu } from './parse-konu.js';
import { cfg } from '../config.js';

/** CE-8: Keyword niyetine göre son paragraf CTA yönlendirmesi. */
export function buildCtaHint(niyet: string | undefined, konu: string): string {
  const base = cfg.siteUrl.replace(/\/$/, '');
  const p = parseKonu(konu);
  const n = String(niyet ?? '').toLowerCase();

  if (n === 'islem' || n === 'yonlendirme') {
    const q: string[] = [];
    if (p.hasSehir) q.push(`il=${p.sehir}`);
    if (p.hasBrans) q.push(`brans=${p.brans}`);
    const href = q.length ? `${base}/ara?${q.join('&')}` : `${base}/ara`;
    return `Son paragraf SporNerede CTA: okuyucuyu yakinindaki kurslari bulmaya yonlendir — ${href} (dogal cumle, zorla reklam tonu yok).`;
  }

  if (n === 'bilgi') {
    return `Son paragraf SporNerede CTA: genel kurs aramasi — ${base}/ara — bilgi okuduktan sonra bir sonraki adim olarak sun.`;
  }

  return `Son paragraf SporNerede CTA: ${base}/ara uzerinden kurs aramayi veya ${base}/basvuru uzerinden kulup basvurusunu dogal sekilde an.`;
}
