import { getDb, hasDatabaseUrl } from '../../db/client';
import { parseNewsTarihMs, resolveNewsInstant } from '../newsTarih';
import { sanitizeArticleHtml } from '../html/sanitizeArticleHtml';
import {
  assessNewsDraft,
  stripCeKonuFromOzet,
  wrapOzetWithKonu,
} from '../contentEngine/newsDraftQuality';
import { repairNewsHtml } from '../contentEngine/repairNewsHtml';
import { injectNewsInternalLinks } from '../contentEngine/newsDraftQuality';
import { SITE_URL } from '../seo/jsonld';
import { buildNewsCardExcerpt } from '../newsExcerpt';

export type NewsItem = {
  id: number;
  kategori: string;
  kategoriRenk: string;
  tarih: string;
  tarihIso?: string;
  baslik: string;
  ozet: string;
  /** Liste / kart icin kisa duz metin */
  kartOzet: string;
  link: string;
  aktif: boolean;
  slug: string;
  seoTitle: string;
  seoDescription: string;
};

type NewsWriteInput = {
  kategori: string;
  kategoriRenk: string;
  tarih: string;
  baslik: string;
  ozet: string;
  link: string;
  aktif: boolean;
  slug?: string;
  seoTitle?: string;
  seoDescription?: string;
};

function slugify(value: string) {
  return value
    .toLowerCase()
    .trim()
    .replace(/ğ/g, 'g')
    .replace(/ü/g, 'u')
    .replace(/ş/g, 's')
    .replace(/ı/g, 'i')
    .replace(/ö/g, 'o')
    .replace(/ç/g, 'c')
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');
}

function stripHtml(html: string) {
  return html.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();
}

function buildNewsSlug(title: string, legacyId: number) {
  const titlePart = slugify(title) || 'haber';
  return `${titlePart}-${legacyId}`;
}

export async function getActiveNews(limit?: number) {
  if (!hasDatabaseUrl()) {
    return [];
  }
  const db = await getDb();
  let items: Array<Record<string, unknown>> = [];
  try {
    const rows = await db.collection('haberler').getFullList();
    items = rows as Array<Record<string, unknown>>;
  } catch (error) {
    console.error('Haberler listesi alinamadi:', error);
    return [];
  }

  const activeItems = items.filter((row) => Boolean(row.aktif));
  activeItems.sort((a, b) => {
    const aTime = parseNewsTarihMs(String(a.tarih ?? ''), String(a.created ?? ''), Number(a.legacyId ?? 0));
    const bTime = parseNewsTarihMs(String(b.tarih ?? ''), String(b.created ?? ''), Number(b.legacyId ?? 0));
    return bTime - aTime;
  });

  const sliced = typeof limit === 'number' && limit > 0 ? activeItems.slice(0, limit) : activeItems;

  return sliced.map((row) => {
    const id = Number(row.legacyId ?? 0);
    const baslik = String(row.baslik ?? '');
    const rawSummary = String(row.ozet ?? '');
    const seoTitle = String(row.seoTitle ?? '').trim();
    const seoDescriptionRaw = String(row.seoDescription ?? '').trim();
    const kartOzet = buildNewsCardExcerpt({
      ozet: rawSummary,
      seoDescription: seoDescriptionRaw,
      baslik,
    });
    const slug = String(row.slug ?? '').trim() || buildNewsSlug(baslik, id);
    const dateObj = resolveNewsInstant(String(row.tarih ?? ''), String(row.created ?? ''), id);
    const tarih = dateObj
      ? dateObj.toLocaleDateString('tr-TR', {
          day: 'numeric',
          month: 'long',
          year: 'numeric',
        })
      : String(row.tarih ?? '');
    const tarihIso = dateObj ? dateObj.toISOString() : String(row.tarih ?? '');

    return {
      id,
      kategori: String(row.kategori ?? 'Genel'),
      kategoriRenk: String(row.kategoriRenk ?? 'gray'),
      tarihIso,
      tarih,
      baslik,
      ozet: rawSummary,
      kartOzet,
      link: String(row.link ?? '#'),
      aktif: Boolean(row.aktif),
      slug,
      seoTitle: seoTitle || baslik,
      seoDescription: seoDescriptionRaw || kartOzet,
    };
  });
}

export async function getAllNewsAdmin() {
  if (!hasDatabaseUrl()) {
    return [];
  }
  const db = await getDb();
  let items: Array<Record<string, unknown>> = [];
  try {
    const rows = await db.collection('haberler').getFullList();
    items = rows as Array<Record<string, unknown>>;
  } catch (error) {
    console.error('Admin haber listesi alinamadi:', error);
    return [];
  }

  return items
    .sort((a, b) => {
      const aTime = parseNewsTarihMs(String(a.tarih ?? ''), String(a.created ?? ''), Number(a.legacyId ?? 0));
      const bTime = parseNewsTarihMs(String(b.tarih ?? ''), String(b.created ?? ''), Number(b.legacyId ?? 0));
      return bTime - aTime;
    })
    .map((row) => {
      const id = Number(row.legacyId ?? 0);
      const baslik = String(row.baslik ?? '');
      const rawSummary = String(row.ozet ?? '');
      const seoTitle = String(row.seoTitle ?? '').trim();
      const seoDescription = String(row.seoDescription ?? '').trim();
      const slug = String(row.slug ?? '').trim() || buildNewsSlug(baslik, id);
      const { konu, body } = stripCeKonuFromOzet(rawSummary);
      const isTemplate = /<!--\s*ce-template:/i.test(rawSummary);
      const draftQuality = assessNewsDraft(body, konu || baslik, { template: isTemplate });
      return {
        id,
        kategori: String(row.kategori ?? 'Genel'),
        kategoriRenk: String(row.kategoriRenk ?? 'gray'),
        tarih: String(row.tarih ?? ''),
        created: String(row.created ?? ''),
        baslik,
        ozet: rawSummary,
        link: String(row.link ?? '#'),
        aktif: Boolean(row.aktif),
        slug,
        seoTitle: seoTitle || baslik,
        seoDescription: seoDescription || stripHtml(rawSummary).slice(0, 160),
        ceKonu: konu,
        draftComplete: draftQuality.complete,
        draftWordCount: draftQuality.wordCount,
        draftIssues: draftQuality.issues,
      };
    });
}

export function assessNewsForPublish(ozet: string, baslik: string) {
  const { konu, body } = stripCeKonuFromOzet(ozet);
  const isTemplate = /<!--\s*ce-template:/i.test(ozet);
  return assessNewsDraft(body, konu || baslik, { template: isTemplate });
}

export async function getNewsAdminByLegacyId(legacyId: number) {
  const all = await getAllNewsAdmin();
  return all.find((n) => n.id === legacyId) ?? null;
}

export async function createNews(input: NewsWriteInput) {
  if (!hasDatabaseUrl()) {
    throw new Error('POCKETBASE_URL is not configured.');
  }
  const db = await getDb();
  const legacyId = Date.now();
  const row = await db.collection('haberler').create({
    legacyId,
    kategori: input.kategori,
    kategoriRenk: input.kategoriRenk,
    tarih: input.tarih,
    baslik: input.baslik,
    ozet: input.ozet,
    link: input.link,
    aktif: input.aktif,
    slug: buildNewsSlug(input.baslik, legacyId),
    seoTitle: input.seoTitle || input.baslik,
    seoDescription: input.seoDescription || stripHtml(input.ozet).slice(0, 160),
  });
  return { id: Number(row.legacyId) };
}

export async function updateNews(id: number, input: Partial<NewsWriteInput>) {
  if (!hasDatabaseUrl()) {
    throw new Error('POCKETBASE_URL is not configured.');
  }
  const db = await getDb();
  const existing = await db.collection('haberler').getFirstListItem(`legacyId = ${id}`);
  const payload: Record<string, unknown> = { ...input };
  if (input.ozet !== undefined) {
    const raw = String(input.ozet);
    const { konu, body } = stripCeKonuFromOzet(raw);
    const repaired = repairNewsHtml(body).html;
    const withLinks = injectNewsInternalLinks(
      repaired,
      konu || String(existing.baslik ?? ''),
      SITE_URL,
    );
    const cleaned = sanitizeArticleHtml(withLinks);
    payload.ozet = konu ? wrapOzetWithKonu(konu, cleaned) : cleaned;
  }
  if (input.baslik && !input.slug) {
    payload.slug = buildNewsSlug(String(input.baslik), id);
  }
  if (input.ozet && !input.seoDescription) {
    payload.seoDescription = stripHtml(String(input.ozet)).slice(0, 160);
  }
  await db.collection('haberler').update(existing.id, payload);
}

export async function deleteNews(id: number) {
  if (!hasDatabaseUrl()) {
    throw new Error('POCKETBASE_URL is not configured.');
  }
  const db = await getDb();
  const existing = await db.collection('haberler').getFirstListItem(`legacyId = ${id}`);
  await db.collection('haberler').delete(existing.id);
}

export async function getActiveNewsBySlug(slug: string) {
  const normalizedSlug = String(slug ?? '').trim().toLowerCase();
  if (!normalizedSlug) return null;
  const all = await getActiveNews();
  return all.find((item) => item.slug.toLowerCase() === normalizedSlug) ?? null;
}
