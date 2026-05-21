import { getDb, hasDatabaseUrl } from '../../db/client';

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
  const db = await getDb();
  try {
    const rows = await db.collection('rehber_yazilari').getFullList({
      filter: 'durum = "yayinda"',
      sort: '-yayinlanma_tarihi',
    });
    return (rows as Array<Record<string, unknown>>)
      .map(mapRow)
      .filter((g) => g.slug);
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
};

function mapAdminRow(row: Record<string, unknown>): GuideAdminRow {
  const base = mapRow(row);
  return {
    ...base,
    durum: String(row.durum ?? 'incelemede'),
    kaynak: String(row.kaynak ?? ''),
    gscTiklama: Number(row.gsc_tiklama ?? 0),
    gscGosterim: Number(row.gsc_gosterim ?? 0),
    gscKonum: Number(row.gsc_konum ?? 0),
  };
}

export async function getAllGuidesAdmin(): Promise<GuideAdminRow[]> {
  if (!hasDatabaseUrl()) return [];
  const db = await getDb();
  try {
    const rows = await db.collection('rehber_yazilari').getFullList({ sort: '-created' });
    return (rows as Array<Record<string, unknown>>).map(mapAdminRow);
  } catch (error) {
    console.error('Admin rehber listesi alinamadi:', error);
    return [];
  }
}

export async function getPendingGuidesCount(): Promise<number> {
  if (!hasDatabaseUrl()) return 0;
  const db = await getDb();
  try {
    const list = await db.collection('rehber_yazilari').getList(1, 1, {
      filter: 'durum = "incelemede" || durum = "taslak"',
    });
    return list.totalItems;
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
  const payload: Record<string, unknown> = { ...input };
  if (input.durum === 'yayinda' && !input.yayinlanma_tarihi) {
    payload.yayinlanma_tarihi = new Date().toISOString();
  }
  await db.collection('rehber_yazilari').update(id, payload);
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
