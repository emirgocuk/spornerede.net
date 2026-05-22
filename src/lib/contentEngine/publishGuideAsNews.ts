import { getDb, hasDatabaseUrl } from '../../db/client';
import { sanitizeArticleHtml } from '../html/sanitizeArticleHtml.js';

function buildNewsSlug(title: string, legacyId: number) {
  const titlePart =
    title
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
      .replace(/^-|-$/g, '') || 'haber';
  return `${titlePart}-${legacyId}`;
}

function stripHtml(html: string) {
  return html.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();
}

/** Rehber kaydini haber olarak yayinlar (aktif). */
export async function publishGuideAsNews(guideId: string, aktif = true) {
  if (!hasDatabaseUrl()) {
    throw new Error('POCKETBASE_URL yapilandirilmamis.');
  }
  const db = await getDb();
  const guide = await db.collection('rehber_yazilari').getOne(guideId);

  const baslik = String(guide.baslik ?? '').trim();
  const ozet = sanitizeArticleHtml(String(guide.icerik_html ?? ''));
  const seoTitle = String(guide.meta_title ?? '').trim() || baslik;
  const seoDescription =
    String(guide.meta_description ?? '').trim() || stripHtml(ozet).slice(0, 160);

  if (!baslik || !ozet) {
    throw new Error('Baslik ve metin zorunlu.');
  }

  const legacyId = Date.now();
  const slug = buildNewsSlug(baslik, legacyId);
  const tarih = new Date().toISOString().slice(0, 10);

  const row = await db.collection('haberler').create({
    legacyId,
    kategori: 'Haber',
    kategoriRenk: 'red',
    tarih,
    baslik,
    ozet,
    link: '#',
    aktif,
    slug,
    seoTitle,
    seoDescription,
  });

  await db.collection('rehber_yazilari').update(guideId, {
    durum: 'arsiv',
  });

  return {
    newsId: Number(row.legacyId),
    slug: String(row.slug),
    baslik,
    previewUrl: `/haberler/${slug}`,
  };
}
