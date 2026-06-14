import type PocketBase from 'pocketbase';
import {
  buildAvoidanceBrief,
  buildGscHintText,
  isKonuAlreadyPublished,
  loadPublishedHistory,
} from './published-topics.js';
import { withCollectionRepair } from './ensure-collections.js';
import {
  loadKeywordQueueRows,
  pickKeywordFromRows,
  type KeywordQueueRow,
} from './keyword-calendar.js';
import { isKeywordEligibleForNews } from './news-keyword-policy.js';
import { todayTrIso } from './tr-date.js';

export type PickedKeyword = {
  id: string;
  anahtar: string;
  niyet: string;
  siteContext: Record<string, unknown>;
  gscHint: string;
  avoidList: string;
};

function toPicked(row: KeywordQueueRow, avoidList: string): PickedKeyword {
  return {
    id: row.id,
    anahtar: row.anahtar,
    niyet: row.niyet,
    siteContext: {},
    gscHint: buildGscHintText(undefined, row.anahtar),
    avoidList,
  };
}

async function loadQueueWithContext(pb: PocketBase): Promise<KeywordQueueRow[]> {
  const rows = await loadKeywordQueueRows(pb);
  return rows;
}

export async function pickNewsKeyword(pb: PocketBase): Promise<PickedKeyword | null> {
  const history = await loadPublishedHistory(pb);
  const avoidList = buildAvoidanceBrief(history);
  const today = todayTrIso();

  const planned = await withCollectionRepair(pb, (client) =>
    client.collection('seo_keywords').getList(1, 20, {
      filter: `durum = "kuyrukta" && planlanan_tarih = "${today}"`,
      sort: '-skor',
    }),
  ).catch(() => null);

  if (planned?.items.length) {
    for (const row of planned.items) {
      const anahtar = String(row.anahtar ?? '').trim();
      const kategori = String(row.kategori ?? '');
      if (!anahtar || !isKeywordEligibleForNews(kategori)) continue;
      if (isKonuAlreadyPublished(anahtar, history, { includePassive: true })) continue;
      const siteContext = (row.site_context as Record<string, unknown>) ?? {};
      return {
        id: String(row.id),
        anahtar,
        niyet: String(row.niyet ?? ''),
        siteContext,
        gscHint: buildGscHintText(siteContext, anahtar),
        avoidList,
      };
    }
  }

  const allRows = await loadQueueWithContext(pb);
  const picked = pickKeywordFromRows(allRows, history, today);
  if (!picked) return null;

  try {
    const full = await pb.collection('seo_keywords').getOne(picked.id);
    const siteContext = (full.site_context as Record<string, unknown>) ?? {};
    return {
      id: picked.id,
      anahtar: picked.anahtar,
      niyet: picked.niyet,
      siteContext,
      gscHint: buildGscHintText(siteContext, picked.anahtar),
      avoidList,
    };
  } catch {
    return toPicked(picked, avoidList);
  }
}

export async function enrichKeywordForKonu(
  pb: PocketBase,
  konu: string,
  history?: Awaited<ReturnType<typeof loadPublishedHistory>>,
): Promise<PickedKeyword> {
  const hist = history ?? (await loadPublishedHistory(pb));
  const avoidList = buildAvoidanceBrief(hist);

  try {
    const escaped = konu.replace(/'/g, "\\'");
    const batch = await pb.collection('seo_keywords').getList(1, 3, {
      filter: `anahtar = '${escaped}'`,
    });
    const row = batch.items[0];
    if (row) {
      const siteContext = (row.site_context as Record<string, unknown>) ?? {};
      return {
        id: String(row.id),
        anahtar: konu,
        niyet: String(row.niyet ?? ''),
        siteContext,
        gscHint: buildGscHintText(siteContext, konu),
        avoidList,
      };
    }
  } catch {
    /* */
  }

  return {
    id: '',
    anahtar: konu,
    niyet: '',
    siteContext: {},
    gscHint: buildGscHintText(undefined, konu),
    avoidList,
  };
}

export async function markKeywordUsed(pb: PocketBase, keywordId: string, extra?: Record<string, unknown>) {
  if (!keywordId) return;
  try {
    const kw = await pb.collection('seo_keywords').getOne(keywordId);
    const ctx = (kw.site_context as Record<string, unknown>) ?? {};
    await pb.collection('seo_keywords').update(keywordId, {
      durum: 'yazildi',
      site_context: { ...ctx, ...extra, last_used_at: new Date().toISOString() },
    });
  } catch {
    /* */
  }
}
