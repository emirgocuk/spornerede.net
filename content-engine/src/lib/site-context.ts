import type PocketBase from 'pocketbase';
import { cfg } from '../config.js';
import { parseKonu } from './parse-konu.js';

function uniqueNonEmpty(values: Array<string | undefined | null>, limit: number): string[] {
  const out: string[] = [];
  for (const raw of values) {
    const v = String(raw ?? '').trim();
    if (v && !out.includes(v)) out.push(v);
    if (out.length >= limit) break;
  }
  return out;
}

/**
 * LLM haberlerini gercek site verisine dayandirir (basma kalip onlemi).
 * Konudan sehir/brans cikarir, onayli kulupleri ve aktif programlari okur,
 * yalnizca yayina uygun (PII'siz) somut bilgileri prompt icin metne cevirir.
 * Eslesen veri yoksa bos string doner; bu durumda prompt genel ama klise-siz kalir.
 */
export async function buildNewsRealData(pb: PocketBase, anahtar: string): Promise<string> {
  const parsed = parseKonu(anahtar);
  try {
    let ilLegacyId: number | null = null;
    if (parsed.hasSehir) {
      const il = await pb
        .collection('iller')
        .getFirstListItem(`slug = "${parsed.sehir}"`)
        .catch(() => null);
      if (il) ilLegacyId = Number(il.legacyId);
    }

    let bransLegacyId: number | null = null;
    if (parsed.hasBrans) {
      const brans = await pb
        .collection('branslar')
        .getFirstListItem(`slug = "${parsed.brans}"`)
        .catch(() => null);
      if (brans) bransLegacyId = Number(brans.legacyId);
    }

    const clubFilter =
      ilLegacyId != null ? `durum = "approved" && ilLegacyId = ${ilLegacyId}` : 'durum = "approved"';
    let clubs = await pb.collection('kulupler').getFullList({ filter: clubFilter }).catch(() => []);

    if (bransLegacyId != null) {
      const links = await pb
        .collection('kulup_branslar')
        .getFullList({ filter: `bransLegacyId = ${bransLegacyId}` })
        .catch(() => []);
      const clubIds = new Set(links.map((l) => Number(l.kulupLegacyId)));
      clubs = clubs.filter((c) => clubIds.has(Number(c.legacyId)));
    }

    if (!clubs.length) return '';

    const ilceler = await pb.collection('ilceler').getFullList().catch(() => []);
    const ilceById = new Map(ilceler.map((d) => [Number(d.legacyId), String(d.ad ?? '')]));

    const topClubs = clubs.slice(0, 8);
    const topClubIds = new Set(topClubs.map((c) => Number(c.legacyId)));

    const allPrograms = await pb
      .collection('kulup_programlari')
      .getFullList({ filter: 'aktif = true' })
      .catch(() => []);
    const programs = allPrograms.filter((p) => topClubIds.has(Number(p.kulupLegacyId)));

    const clubAdById = new Map(topClubs.map((c) => [Number(c.legacyId), String(c.ad ?? '')]));

    const semtler = uniqueNonEmpty(
      topClubs.map((c) => ilceById.get(Number(c.ilceLegacyId))),
      6,
    );
    const yasGruplari = uniqueNonEmpty(
      topClubs.map((c) => c.yasAraligi as string | undefined),
      4,
    );
    const ucretler = uniqueNonEmpty(
      [
        ...topClubs.map((c) => c.fiyatBilgisi as string | undefined),
        ...programs.map((p) => p.ucretBilgisi as string | undefined),
      ],
      4,
    );

    const ornekProgramlar = programs.slice(0, 5).map((p) => {
      const kulup = clubAdById.get(Number(p.kulupLegacyId)) ?? '';
      const detay = uniqueNonEmpty(
        [p.gunSaat as string, p.seviye as string, p.ucretBilgisi as string],
        3,
      ).join(', ');
      const ad = String(p.ad ?? '').trim();
      return `- ${[kulup, ad].filter(Boolean).join(' — ')}${detay ? ` (${detay})` : ''}`;
    });

    const lines: string[] = [
      `Eslesen onayli kulup: ${clubs.length}, listelenen aktif program: ${programs.length}`,
    ];
    if (semtler.length) lines.push(`Semtler: ${semtler.join(', ')}`);
    if (yasGruplari.length) lines.push(`Yas gruplari: ${yasGruplari.join(', ')}`);
    if (ucretler.length) lines.push(`Ucret/paket ornekleri: ${ucretler.join(' | ')}`);
    if (ornekProgramlar.length) {
      lines.push('Ornek programlar:');
      lines.push(...ornekProgramlar);
    }

    return lines.join('\n');
  } catch (e) {
    console.warn('[site-context] gercek veri okunamadi:', e);
    return '';
  }
}

export async function buildSiteContext(pb: PocketBase, anahtar: string): Promise<string> {
  let kulupSayisi = 0;
  let programSayisi = 0;
  try {
    const clubs = await pb.collection('kulupler').getList(1, 1);
    kulupSayisi = clubs.totalItems;
  } catch {
    /* koleksiyon yoksa atla */
  }
  try {
    const programs = await pb.collection('programlar').getList(1, 1);
    programSayisi = programs.totalItems;
  } catch {
    /* */
  }
  return [
    `Platform: spornerede.net`,
    `Anahtar: ${anahtar}`,
    `Kayitli kulup (yaklasik): ${kulupSayisi}`,
    `Aktif program (yaklasik): ${programSayisi}`,
    `Site URL: ${cfg.siteUrl}`,
  ].join('\n');
}

export function buildInternalLinks(anahtar: string): string {
  const links = [
    `<a href="${cfg.siteUrl}/ara">Kurs ara</a>`,
    `<a href="${cfg.siteUrl}/basvuru">Kulüp başvurusu</a>`,
    `<a href="${cfg.siteUrl}/haberler">Haberler</a>`,
  ];
  const lower = anahtar.toLowerCase();
  if (lower.includes('voleybol')) links.push(`<a href="${cfg.siteUrl}/branslar/voleybol">Voleybol branşları</a>`);
  if (lower.includes('basketbol')) links.push(`<a href="${cfg.siteUrl}/branslar/basketbol">Basketbol branşları</a>`);
  if (lower.includes('yuzme') || lower.includes('yüzme')) {
    links.push(`<a href="${cfg.siteUrl}/branslar/yuzme">Yüzme branşları</a>`);
  }
  if (lower.includes('oryantiring')) {
    links.push(`<a href="${cfg.siteUrl}/branslar/oryantiring">Oryantiring branşları</a>`);
  }
  if (lower.includes('satranc') || lower.includes('satranç')) {
    links.push(`<a href="${cfg.siteUrl}/branslar/satranc">Satranç branşları</a>`);
  }
  if (lower.includes('istanbul') || lower.includes('İstanbul')) {
    links.push(`<a href="${cfg.siteUrl}/ara?il=istanbul">İstanbul kursları</a>`);
  }
  if (lower.includes('ankara')) {
    links.push(`<a href="${cfg.siteUrl}/ara?il=ankara">Ankara kursları</a>`);
  }
  return links.join('\n');
}
