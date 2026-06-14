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

/** Keyword secimi — content-engine pickNewsKeyword (CE-5 + yayin kontrolu) */
export async function pickKonuForNewsDraft(): Promise<PickedKonu | null> {
  const result = await runContentEngineScript('src/cli/pick-news-keyword-json.ts', [], 60_000);
  if (!result.ok) return null;
  const lines = result.output
    .trim()
    .split('\n')
    .map((l) => l.trim())
    .filter(Boolean);
  const jsonLine = [...lines].reverse().find((l) => l.startsWith('{') || l === 'null');
  if (!jsonLine || jsonLine === 'null') return null;
  try {
    const parsed = JSON.parse(jsonLine) as { id?: string; anahtar?: string } | null;
    if (!parsed?.anahtar) return null;
    return { id: String(parsed.id ?? ''), anahtar: String(parsed.anahtar) };
  } catch {
    return null;
  }
}
