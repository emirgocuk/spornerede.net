import {
  describeNextRun,
  getOrCreateContentEngineSchedule,
  shouldRunScheduleNow,
  updateContentEngineSchedule,
} from '../repositories/contentEngineSchedule';
import { runScheduledNewsDraft } from './runScheduledNewsDraft';

const TICK_MS = 60_000;
const SCHEDULER_DISABLED = process.env.SEO_NEWS_SCHEDULER_DISABLED === 'true';

let started = false;
let ticking = false;
let runningJob = false;

async function recordRun(status: 'ok' | 'error' | 'skipped', message: string) {
  await updateContentEngineSchedule({
    lastRunAt: new Date().toISOString(),
    lastRunStatus: status,
    lastRunMessage: message.slice(0, 500),
  });
}

async function executeScheduledRun() {
  if (runningJob) return;
  runningJob = true;
  try {
    const schedule = await getOrCreateContentEngineSchedule();
    if (!schedule.enabled) return;

    const result = await runScheduledNewsDraft({ autoPublish: schedule.autoPublish });
    if (result.ok) {
      const pub = result.autoPublished ? ' · yayinda' : ' · taslak';
      await recordRun('ok', `${result.baslik}${pub}`);
      console.log('[news-scheduler] OK:', result.baslik);
      return;
    }

    if (result.code === 'daily_limit') {
      await recordRun('skipped', result.message);
      console.log('[news-scheduler] atlandi:', result.message);
      return;
    }

    await recordRun('error', result.message);
    console.warn('[news-scheduler] hata:', result.message);
  } catch (e) {
    const message = e instanceof Error ? e.message : String(e);
    await recordRun('error', message).catch(() => undefined);
    console.error('[news-scheduler]', message);
  } finally {
    runningJob = false;
  }
}

async function tick() {
  if (ticking || runningJob || SCHEDULER_DISABLED) return;
  ticking = true;
  try {
    const schedule = await getOrCreateContentEngineSchedule();
    if (shouldRunScheduleNow(schedule)) {
      await executeScheduledRun();
    }
  } catch (e) {
    console.error('[news-scheduler] tick:', e instanceof Error ? e.message : e);
  } finally {
    ticking = false;
  }
}

/** Astro SSR process basladiginda bir kez cagrilir */
export function ensureNewsScheduler() {
  if (started || SCHEDULER_DISABLED) return;
  if (typeof process === 'undefined') return;
  if (process.env.NODE_ENV === 'test') return;

  started = true;
  setInterval(() => {
    void tick();
  }, TICK_MS);
  void tick();
}

export async function getSchedulerStatusForAdmin() {
  const schedule = await getOrCreateContentEngineSchedule();
  return {
    ...schedule,
    nextRunLabel: describeNextRun(schedule),
    schedulerDisabled: SCHEDULER_DISABLED,
  };
}

/** Kayit sonrasi hemen calismasi gerekiyorsa (saat eslesiyorsa) */
export async function maybeRunScheduleAfterSave() {
  const schedule = await getOrCreateContentEngineSchedule();
  if (shouldRunScheduleNow(schedule)) {
    await executeScheduledRun();
  }
}
