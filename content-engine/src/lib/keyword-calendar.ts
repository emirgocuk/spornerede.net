import type PocketBase from 'pocketbase';
import { addDaysIso, todayTrIso } from './tr-date.js';
import { isKonuAlreadyPublished, loadPublishedHistory, type PublishedEntry } from './published-topics.js';
import { isKeywordEligibleForNews } from './news-keyword-policy.js';

export type KeywordQueueRow = {
  id: string;
  anahtar: string;
  skor: number;
  niyet: string;
  kategori: string;
  planlanan_tarih: string | null;
  gsc_impression: number | null;
  durum: string;
};

export type CalendarDayPreview = {
  date: string;
  keyword: KeywordQueueRow | null;
  source: 'planlanan' | 'tahmini' | 'bos';
};

function rowFromRecord(row: Record<string, unknown>): KeywordQueueRow {
  const plan = row.planlanan_tarih;
  return {
    id: String(row.id),
    anahtar: String(row.anahtar ?? '').trim(),
    skor: Number(row.skor ?? 0),
    niyet: String(row.niyet ?? ''),
    kategori: String(row.kategori ?? ''),
    planlanan_tarih: plan ? String(plan).slice(0, 10) : null,
    gsc_impression: row.gsc_impression != null ? Number(row.gsc_impression) : null,
    durum: String(row.durum ?? ''),
  };
}

function isEligibleForPick(
  row: KeywordQueueRow,
  today: string,
  history: PublishedEntry[],
  allowFuturePlanned = false,
): boolean {
  if (row.durum !== 'kuyrukta' || !row.anahtar) return false;
  if (!isKeywordEligibleForNews(row.kategori)) return false;
  if (isKonuAlreadyPublished(row.anahtar, history, { includePassive: true })) return false;
  if (!allowFuturePlanned && row.planlanan_tarih && row.planlanan_tarih > today) return false;
  return true;
}

/** Scheduler / manuel üretimde kullanılan seçim mantığı (CE-5). */
export function pickKeywordFromRows(
  rows: KeywordQueueRow[],
  history: PublishedEntry[],
  today = todayTrIso(),
): KeywordQueueRow | null {
  const eligible = rows.filter((r) => isEligibleForPick(r, today, history, false));

  const plannedToday = eligible
    .filter((r) => r.planlanan_tarih === today)
    .sort((a, b) => b.skor - a.skor);
  if (plannedToday.length) return plannedToday[0]!;

  const pool = eligible
    .filter((r) => !r.planlanan_tarih || r.planlanan_tarih <= today)
    .sort((a, b) => b.skor - a.skor);
  if (pool.length) return pool[0]!;

  // Manuel üretimde bugünün haberi yazılmışsa sıradaki en yüksek skorlu keyword'den devam et
  const fallbackEligible = rows.filter((r) => isEligibleForPick(r, today, history, true));
  const fallbackPool = fallbackEligible.sort((a, b) => b.skor - a.skor);
  return fallbackPool[0] ?? null;
}

export async function loadKeywordQueueRows(pb: PocketBase): Promise<KeywordQueueRow[]> {
  const out: KeywordQueueRow[] = [];
  const pageSize = 100;
  let page = 1;
  while (true) {
    const batch = await pb.collection('seo_keywords').getList(page, pageSize, {
      filter: 'durum = "kuyrukta"',
      sort: '-skor',
    });
    for (const item of batch.items) {
      out.push(rowFromRecord(item as Record<string, unknown>));
    }
    if (batch.items.length < pageSize) break;
    page += 1;
  }
  return out;
}

export function buildCalendarPreview(
  rows: KeywordQueueRow[],
  history: PublishedEntry[],
  days = 14,
  today = todayTrIso(),
): CalendarDayPreview[] {
  const eligible = rows.filter((r) => isEligibleForPick(r, today, history));
  const byDate = new Map<string, KeywordQueueRow>();
  for (const r of eligible) {
    if (r.planlanan_tarih) byDate.set(r.planlanan_tarih, r);
  }

  const unassigned = eligible
    .filter((r) => !r.planlanan_tarih)
    .sort((a, b) => b.skor - a.skor);
  let cursor = 0;

  const preview: CalendarDayPreview[] = [];
  for (let i = 0; i < days; i += 1) {
    const date = addDaysIso(today, i);
    const planned = byDate.get(date);
    if (planned) {
      preview.push({ date, keyword: planned, source: 'planlanan' });
      continue;
    }
    const next = unassigned[cursor];
    if (next) {
      preview.push({ date, keyword: next, source: 'tahmini' });
      cursor += 1;
    } else {
      preview.push({ date, keyword: null, source: 'bos' });
    }
  }
  return preview;
}
