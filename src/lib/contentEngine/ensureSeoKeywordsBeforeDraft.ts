import { getDb, resetDb } from '../../db/client.js';
import { runContentEngineScript } from './spawnContentEngineWait.js';

const KEYWORD_QUERY = {
  filter: 'durum = "kuyrukta"',
  sort: '-skor',
} as const;

export type PickedKonu = {
  id: string;
  anahtar: string;
};

async function queryKeywords(page: number, pageSize: number) {
  const pb = await getDb();
  return pb.collection('seo_keywords').getList(page, pageSize, KEYWORD_QUERY);
}

async function repairSeoKeywords(): Promise<string | null> {
  resetDb();
  const repair = await runContentEngineScript('src/cli/force-repair-seo-keywords.ts');
  resetDb();
  if (!repair.ok) {
    return repair.output.trim().slice(-500) || 'force-repair basarisiz';
  }
  try {
    resetDb();
    await queryKeywords(1, 40);
    return null;
  } catch (e) {
    const err = e as { message?: string };
    return err.message ?? 'Onarim sonrasi sorgu hala basarisiz';
  }
}

/** Admin haber uretiminden once */
export async function ensureSeoKeywordsBeforeDraft(): Promise<string | null> {
  resetDb();
  try {
    await queryKeywords(1, 40);
    return null;
  } catch (e) {
    const err = e as { status?: number; message?: string };
    if (err.status !== 404) {
      return err.message ?? 'seo_keywords sorgusu basarisiz';
    }
  }
  return repairSeoKeywords();
}

/** Keyword secimini Astro tarafinda yap — child seo_keywords kuyruk sorgusunu atlar */
export async function pickKonuForNewsDraft(): Promise<PickedKonu | null> {
  resetDb();
  const pageSize = 40;
  let page = 1;
  while (true) {
    let batch;
    try {
      batch = await queryKeywords(page, pageSize);
    } catch (e) {
      const err = e as { status?: number };
      if (err.status === 404) {
        const repairErr = await repairSeoKeywords();
        if (repairErr) throw new Error(repairErr);
        batch = await queryKeywords(page, pageSize);
      } else {
        throw e;
      }
    }

    for (const row of batch.items) {
      const anahtar = String(row.anahtar ?? '').trim();
      if (anahtar) {
        return { id: String(row.id), anahtar };
      }
    }
    if (page * pageSize >= batch.totalItems || batch.items.length < pageSize) {
      break;
    }
    page += 1;
  }
  return null;
}
