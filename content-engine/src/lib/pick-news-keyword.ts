import type PocketBase from 'pocketbase';
import {
  buildAvoidanceBrief,
  buildGscHintText,
  isKonuAlreadyPublished,
  loadPublishedHistory,
} from './published-topics.js';
import { withCollectionRepair } from './ensure-collections.js';

export type PickedKeyword = {
  id: string;
  anahtar: string;
  siteContext: Record<string, unknown>;
  gscHint: string;
  avoidList: string;
};

export async function pickNewsKeyword(pb: PocketBase): Promise<PickedKeyword | null> {
  const history = await loadPublishedHistory(pb);
  const avoidList = buildAvoidanceBrief(history);

  const pageSize = 40;
  let page = 1;
  while (true) {
    const batch = await withCollectionRepair(pb, (client) =>
      client.collection('seo_keywords').getList(page, pageSize, {
        filter: 'durum = "kuyrukta"',
        sort: '-skor',
      }),
    );

    for (const row of batch.items) {
      const anahtar = String(row.anahtar ?? '').trim();
      if (!anahtar) continue;
      if (isKonuAlreadyPublished(anahtar, history, { includePassive: true })) {
        continue;
      }
      const siteContext = (row.site_context as Record<string, unknown>) ?? {};
      return {
        id: String(row.id),
        anahtar,
        siteContext,
        gscHint: buildGscHintText(siteContext, anahtar),
        avoidList,
      };
    }

    if (page * pageSize >= batch.totalItems || batch.items.length < pageSize) {
      break;
    }
    page += 1;
  }

  return null;
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
