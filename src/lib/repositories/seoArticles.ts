import { ClientResponseError } from 'pocketbase';
import { getDb, hasDatabaseUrl } from '../../db/client';
import { sanitizeArticleHtml, pbDateNow } from '../html/sanitizeArticleHtml';

async function listAllRehberRows(): Promise<Array<Record<string, unknown>>> {
  const db = await getDb();
  const out: Array<Record<string, unknown>> = [];
  const pageSize = 50;
  let page = 1;
  while (true) {
    const batch = await db.collection('rehber_yazilari').getList(page, pageSize);
    out.push(...(batch.items as Array<Record<string, unknown>>));
    if (batch.items.length < pageSize) break;
    page += 1;
  }
  return out;
}

export type GuideArticle = {
  id: string;
  slug: string;
  baslik: string;
  metaTitle: string;
  metaDescription: string;
  icerikHtml: string;
  faq: Array<{ soru: string; cevap: string }>;
  semaTipi: string;
  yayinlanmaTarihi: string;
  yayinlanmaLabel: string;
};

function mapRow(row: Record<string, unknown>): GuideArticle {
  const slug = String(row.slug ?? '').trim();
  const baslik = String(row.baslik ?? '');
  const metaTitle = String(row.meta_title ?? '').trim() || baslik;
  const metaDescription = String(row.meta_description ?? '').trim();
  const rawJson = row.icerik_json;
  let faq: GuideArticle['faq'] = [];
  if (rawJson && typeof rawJson === 'object' && rawJson !== null && 'faq' in rawJson) {
    const f = (rawJson as { faq?: unknown }).faq;
    if (Array.isArray(f)) {
      faq = f
        .map((item) => {
          if (!item || typeof item !== 'object') return null;
          const o = item as { soru?: string; cevap?: string };
          return { soru: String(o.soru ?? ''), cevap: String(o.cevap ?? '') };
        })
        .filter((x): x is { soru: string; cevap: string } => Boolean(x?.soru));
    }
  }
  const tarihIso = String(row.yayinlanma_tarihi ?? row.created ?? '');
  const tarih = tarihIso
    ? new Date(tarihIso).toLocaleDateString('tr-TR', {
        day: 'numeric',
        month: 'long',
        year: 'numeric',
      })
    : '';

  return {
    id: String(row.id ?? ''),
    slug,
    baslik,
    metaTitle,
    metaDescription,
    icerikHtml: String(row.icerik_html ?? ''),
    faq,
    semaTipi: String(row.sema_tipi ?? 'Article'),
    yayinlanmaTarihi: tarihIso,
    yayinlanmaLabel: tarih,
  };
}

export async function getPublishedGuides(): Promise<GuideArticle[]> {
  if (!hasDatabaseUrl()) return [];
  try {
    const rows = (await listAllRehberRows()).filter((r) => String(r.durum) === 'yayinda');
    rows.sort((a, b) => {
      const ta = new Date(String(a.yayinlanma_tarihi ?? a.created ?? '')).getTime();
      const tb = new Date(String(b.yayinlanma_tarihi ?? b.created ?? '')).getTime();
      return tb - ta;
    });
    return rows.map(mapRow).filter((g) => g.slug);
  } catch (error) {
    console.error('Rehber listesi alinamadi:', error);
    return [];
  }
}

export type GuideAdminRow = GuideArticle & {
  durum: string;
  kaynak: string;
  gscTiklama: number;
  gscGosterim: number;
  gscKonum: number;
  gscCtr: number;
  anahtarKelimeId: string;
  keywordAnahtar: string;
  performansUyari: '' | 'dusuk_performans' | 'ctr_iyilestir';
};

type KeywordHint = { anahtar: string; oneri: string };

async function loadKeywordHints(): Promise<Map<string, KeywordHint>> {
  const db = await getDb();
  const map = new Map<string, KeywordHint>();
  const pageSize = 100;
  let page = 1;
  while (true) {
    const batch = await db.collection('seo_keywords').getList(page, pageSize);
    for (const kw of batch.items as Array<Record<string, unknown>>) {
      const ctx = kw.site_context;
      const oneri =
        ctx && typeof ctx === 'object' && ctx !== null && 'oneri' in ctx
          ? String((ctx as { oneri?: unknown }).oneri ?? '')
          : '';
      map.set(String(kw.id), {
        anahtar: String(kw.anahtar ?? ''),
        oneri,
      });
    }
    if (batch.items.length < pageSize) break;
    page += 1;
  }
  return map;
}

function resolvePerformansUyari(
  durum: string,
  gscGosterim: number,
  gscTiklama: number,
  keywordOneri: string,
): GuideAdminRow['performansUyari'] {
  if (durum === 'dusuk_performans') return 'dusuk_performans';
  if (keywordOneri === 'ctr_iyilestir') return 'ctr_iyilestir';
  if (gscGosterim >= 50) {
    const ctr = gscGosterim > 0 ? gscTiklama / gscGosterim : 0;
    if (ctr < 0.03) return 'ctr_iyilestir';
  }
  return '';
}

function mapAdminRow(row: Record<string, unknown>, keywordHints: Map<string, KeywordHint>): GuideAdminRow {
  const base = mapRow(row);
  const durum = String(row.durum ?? 'incelemede');
  const gscTiklama = Number(row.gsc_tiklama ?? 0);
  const gscGosterim = Number(row.gsc_gosterim ?? 0);
  const gscKonum = Number(row.gsc_konum ?? 0);
  const anahtarKelimeId = String(row.anahtar_kelime_id ?? '');
  const hint = keywordHints.get(anahtarKelimeId);
  const gscCtr = gscGosterim > 0 ? gscTiklama / gscGosterim : 0;

  return {
    ...base,
    durum,
    kaynak: String(row.kaynak ?? ''),
    gscTiklama,
    gscGosterim,
    gscKonum,
    gscCtr,
    anahtarKelimeId,
    keywordAnahtar: hint?.anahtar ?? '',
    performansUyari: resolvePerformansUyari(durum, gscGosterim, gscTiklama, hint?.oneri ?? ''),
  };
}

export async function getAllGuidesAdmin(): Promise<GuideAdminRow[]> {
  if (!hasDatabaseUrl()) return [];
  try {
    const rows = await listAllRehberRows();
    rows.sort((a, b) => {
      const ta = new Date(String(a.created ?? '')).getTime();
      const tb = new Date(String(b.created ?? '')).getTime();
      return tb - ta;
    });
    const keywordHints = await loadKeywordHints();
    return rows.map((r) => mapAdminRow(r, keywordHints));
  } catch (error) {
    console.error('Admin rehber listesi alinamadi:', error);
    return [];
  }
}

export async function requeueGuideKeywordAdmin(guideId: string): Promise<{ keywordId: string }> {
  if (!hasDatabaseUrl() || !guideId) {
    throw new Error('POCKETBASE_URL is not configured.');
  }
  const db = await getDb();
  const guide = await db.collection('rehber_yazilari').getOne(guideId);
  const keywordId = String(guide.anahtar_kelime_id ?? '').trim();
  if (!keywordId) {
    throw new Error('Bu rehberde bagli anahtar kelime yok.');
  }
  await db.collection('seo_keywords').update(keywordId, { durum: 'kuyrukta' });
  return { keywordId };
}

export async function getPendingGuidesCount(): Promise<number> {
  if (!hasDatabaseUrl()) return 0;
  try {
    const rows = await listAllRehberRows();
    return rows.filter((r) => {
      const d = String(r.durum);
      return d === 'incelemede' || d === 'taslak';
    }).length;
  } catch {
    return 0;
  }
}

export async function deleteGuideAdmin(id: string): Promise<void> {
  if (!hasDatabaseUrl() || !id) {
    throw new Error('POCKETBASE_URL is not configured.');
  }
  const db = await getDb();
  await db.collection('rehber_yazilari').delete(id);
}

export async function updateGuideAdmin(
  id: string,
  input: {
    baslik?: string;
    slug?: string;
    meta_title?: string;
    meta_description?: string;
    icerik_html?: string;
    durum?: string;
    sema_tipi?: string;
    yayinlanma_tarihi?: string;
  },
): Promise<void> {
  if (!hasDatabaseUrl() || !id) {
    throw new Error('POCKETBASE_URL is not configured.');
  }
  const db = await getDb();
  const payload: Record<string, unknown> = {};

  if (input.baslik !== undefined) {
    const baslik = String(input.baslik).trim();
    if (!baslik) throw new Error('Baslik bos olamaz.');
    payload.baslik = baslik;
  }
  if (input.meta_title !== undefined) payload.meta_title = String(input.meta_title).trim();
  if (input.meta_description !== undefined) {
    payload.meta_description = String(input.meta_description).trim();
  }
  if (input.icerik_html !== undefined) {
    payload.icerik_html = sanitizeArticleHtml(input.icerik_html);
  }
  if (input.durum !== undefined) payload.durum = input.durum;
  if (input.sema_tipi !== undefined) payload.sema_tipi = String(input.sema_tipi).trim();

  if (input.slug !== undefined) {
    const slug = String(input.slug).trim();
    if (!slug) throw new Error('Slug bos olamaz.');
    try {
      const dup = await db.collection('rehber_yazilari').getFirstListItem(
        `slug = ${JSON.stringify(slug)}`,
      );
      if (String(dup.id) !== id) {
        throw new Error(`Slug zaten kullaniliyor: ${slug}`);
      }
    } catch (e) {
      if (!(e instanceof ClientResponseError && e.status === 404)) {
        if (e instanceof Error && e.message.startsWith('Slug zaten')) throw e;
        throw e;
      }
    }
    payload.slug = slug;
  }

  if (input.durum === 'yayinda') {
    payload.yayinlanma_tarihi = input.yayinlanma_tarihi ?? pbDateNow();
  }

  try {
    await db.collection('rehber_yazilari').update(id, payload);
  } catch (e) {
    if (e instanceof ClientResponseError) {
      const detail = e.response?.data;
      const fields =
        detail && typeof detail === 'object' && 'data' in detail
          ? JSON.stringify((detail as { data?: unknown }).data)
          : '';
      throw new Error(fields || e.message || 'Kayit guncellenemedi.');
    }
    throw e;
  }
}

export async function getPublishedGuideBySlug(slug: string): Promise<GuideArticle | null> {
  if (!hasDatabaseUrl() || !slug.trim()) return null;
  const db = await getDb();
  try {
    const row = await db.collection('rehber_yazilari').getFirstListItem(
      `slug = ${JSON.stringify(slug.trim())} && durum = "yayinda"`,
    );
    return mapRow(row as Record<string, unknown>);
  } catch {
    return null;
  }
}
