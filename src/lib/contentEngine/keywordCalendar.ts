import { getDb } from '../../../db/client.js';

const TZ = 'Europe/Istanbul';

export function todayTrIso(): string {
  return new Intl.DateTimeFormat('en-CA', { timeZone: TZ }).format(new Date());
}

export function addDaysIso(iso: string, days: number): string {
  const [y, m, d] = iso.split('-').map(Number);
  const dt = new Date(Date.UTC(y!, m! - 1, d! + days));
  return dt.toISOString().slice(0, 10);
}

export type KeywordCalendarRow = {
  id: string;
  anahtar: string;
  skor: number;
  niyet: string;
  kategori: string;
  planlanan_tarih: string | null;
  gsc_impression: number | null;
  durum: string;
};

export type CalendarDay = {
  date: string;
  keyword: KeywordCalendarRow | null;
  source: 'planlanan' | 'tahmini' | 'bos';
};

function rowFrom(item: Record<string, unknown>): KeywordCalendarRow {
  const plan = item.planlanan_tarih;
  return {
    id: String(item.id),
    anahtar: String(item.anahtar ?? '').trim(),
    skor: Number(item.skor ?? 0),
    niyet: String(item.niyet ?? ''),
    kategori: String(item.kategori ?? ''),
    planlanan_tarih: plan ? String(plan).slice(0, 10) : null,
    gsc_impression: item.gsc_impression != null ? Number(item.gsc_impression) : null,
    durum: String(item.durum ?? ''),
  };
}

export async function loadKeywordCalendarData(): Promise<{
  today: string;
  queue: KeywordCalendarRow[];
  preview14: CalendarDay[];
  pickedToday: KeywordCalendarRow | null;
}> {
  const pb = await getDb();
  const today = todayTrIso();
  const queue: KeywordCalendarRow[] = [];
  let page = 1;
  const pageSize = 100;
  while (true) {
    const batch = await pb.collection('seo_keywords').getList(page, pageSize, {
      filter: 'durum = "kuyrukta"',
      sort: '-skor',
    });
    for (const item of batch.items) {
      queue.push(rowFrom(item as Record<string, unknown>));
    }
    if (batch.items.length < pageSize) break;
    page += 1;
  }

  const plannedToday = queue.filter((r) => r.planlanan_tarih === today);
  const pickedToday =
    plannedToday.sort((a, b) => b.skor - a.skor)[0] ??
    queue
      .filter((r) => !r.planlanan_tarih || r.planlanan_tarih <= today)
      .sort((a, b) => b.skor - a.skor)[0] ??
    null;

  const byDate = new Map<string, KeywordCalendarRow>();
  for (const r of queue) {
    if (r.planlanan_tarih) byDate.set(r.planlanan_tarih, r);
  }
  const unassigned = queue.filter((r) => !r.planlanan_tarih).sort((a, b) => b.skor - a.skor);
  let cursor = 0;
  const preview14: CalendarDay[] = [];
  for (let i = 0; i < 14; i += 1) {
    const date = addDaysIso(today, i);
    const planned = byDate.get(date);
    if (planned) {
      preview14.push({ date, keyword: planned, source: 'planlanan' });
      continue;
    }
    const next = unassigned[cursor];
    if (next) {
      preview14.push({ date, keyword: next, source: 'tahmini' });
      cursor += 1;
    } else {
      preview14.push({ date, keyword: null, source: 'bos' });
    }
  }

  return { today, queue: queue.slice(0, 30), preview14, pickedToday };
}

export async function updateKeywordPlanDate(id: string, planlanan_tarih: string | null): Promise<void> {
  const pb = await getDb();
  await pb.collection('seo_keywords').update(id, {
    planlanan_tarih: planlanan_tarih || '',
  });
}
