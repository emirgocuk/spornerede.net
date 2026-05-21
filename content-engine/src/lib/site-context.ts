import type PocketBase from 'pocketbase';
import { cfg } from '../config.js';

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
    `<a href="${cfg.siteUrl}/basvuru">Kulup basvurusu</a>`,
    `<a href="${cfg.siteUrl}/haberler">Haberler</a>`,
  ];
  const lower = anahtar.toLowerCase();
  if (lower.includes('voleybol')) links.push(`<a href="${cfg.siteUrl}/branslar/voleybol">Voleybol branslari</a>`);
  if (lower.includes('basketbol')) links.push(`<a href="${cfg.siteUrl}/branslar/basketbol">Basketbol branslari</a>`);
  if (lower.includes('yuzme') || lower.includes('yüzme')) {
    links.push(`<a href="${cfg.siteUrl}/branslar/yuzme">Yuzme branslari</a>`);
  }
  if (lower.includes('istanbul')) {
    links.push(`<a href="${cfg.siteUrl}/ara?il=istanbul">Istanbul kurslari</a>`);
  }
  if (lower.includes('ankara')) {
    links.push(`<a href="${cfg.siteUrl}/ara?il=ankara">Ankara kurslari</a>`);
  }
  return links.join('\n');
}
