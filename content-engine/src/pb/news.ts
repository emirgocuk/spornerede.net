import type PocketBase from 'pocketbase';
import { cfg } from '../config.js';
import {
  injectNewsInternalLinks,
  stripCeKonuFromOzet,
  suggestNewsCategory,
  wrapOzetWithKonu,
} from '../lib/news-draft-quality.js';
import { injectFeaturedImageToHtml } from '../lib/sports-images.js';
import { buildNewsSlug, stripHtml } from '../lib/slugify.js';

export type NewsDraftInput = {
  baslik: string;
  kategori?: string;
  kategoriRenk?: string;
  tarih?: string;
  ozet?: string;
  link?: string;
  aktif?: boolean;
  seoTitle?: string;
  seoDescription?: string;
};

export async function listNewsRecords(pb: PocketBase) {
  const rows = await pb.collection('haberler').getFullList();
  return [...(rows as Array<Record<string, unknown>>)].sort((a, b) => {
    const aTime = new Date(String(a.tarih ?? a.created ?? '')).getTime();
    const bTime = new Date(String(b.tarih ?? b.created ?? '')).getTime();
    return (Number.isNaN(bTime) ? 0 : bTime) - (Number.isNaN(aTime) ? 0 : aTime);
  });
}

export async function createNewsDraft(pb: PocketBase, input: NewsDraftInput) {
  const legacyId = Date.now();
  const baslik = input.baslik.trim();
  const rawOzet = input.ozet?.trim() ?? '';
  const metaPrefix = rawOzet.match(/(?:<!--\s*ce-(?:konu|template|keyword):[\s\S]*?-->\s*)+/i)?.[0]?.trim() ?? '';
  const parsed = rawOzet ? stripCeKonuFromOzet(rawOzet) : { konu: '', body: '' };
  const konu = parsed.konu || baslik;
  let body =
    parsed.body
      .replace(/<!--\s*ce-template:[\s\S]*?-->\s*/gi, '')
      .replace(/<!--\s*ce-keyword:[\s\S]*?-->\s*/gi, '')
      .trim() ||
    `<p><strong>${baslik}</strong> — SEO haber taslagidir.</p>
<h2>Kimler icin uygun?</h2><p>...</p>
<h2>Program</h2><ul><li>...</li></ul>
<h2>Kayit ve kayit sureci</h2><p>SporNerede ile kurs ara.</p>`;
  body = injectFeaturedImageToHtml(body, konu);
  body = injectNewsInternalLinks(body, konu, cfg.siteUrl);
  const ozet = metaPrefix ? `${metaPrefix}\n${body}` : wrapOzetWithKonu(konu, body);
  const suggested = suggestNewsCategory(konu);
  const slug = buildNewsSlug(baslik, legacyId);
  const tarih = input.tarih || new Date().toISOString();

  const record = await pb.collection('haberler').create({
    legacyId,
    kategori: input.kategori || suggested?.kategori || 'Duyuru',
    kategoriRenk: input.kategoriRenk || suggested?.kategoriRenk || 'blue',
    tarih,
    baslik,
    ozet,
    link: input.link || '#',
    aktif: input.aktif ?? false,
    slug,
    seoTitle: input.seoTitle || baslik,
    seoDescription:
      input.seoDescription || stripHtml(ozet).slice(0, 160),
  });

  return { record, legacyId, slug };
}

export async function publishNewsBySlug(pb: PocketBase, slug: string) {
  const record = await pb.collection('haberler').getFirstListItem(
    `slug = ${JSON.stringify(slug)}`,
  );
  await pb.collection('haberler').update(record.id, { aktif: true });
  return record;
}
