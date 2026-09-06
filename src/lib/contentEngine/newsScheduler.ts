import {
  describeNextRun,
  getOrCreateContentEngineSchedule,
  shouldRunScheduleNow,
  shouldRunWeeklyKeywordSync,
  shouldRunWeeklyNewsRewrite,
  updateContentEngineSchedule,
} from '../repositories/contentEngineSchedule';
import { runScheduledNewsDraft } from './runScheduledNewsDraft';
import { runContentEngineScript } from './spawnContentEngineWait';

const TICK_MS = 60_000;
const SCHEDULER_DISABLED = process.env.SEO_NEWS_SCHEDULER_DISABLED === 'true';

let started = false;
let ticking = false;
let runningJob = false;
let runningKeywordSync = false;
let runningNewsRewrite = false;

async function recordRun(status: 'ok' | 'error' | 'skipped', message: string) {
  await updateContentEngineSchedule({
    lastRunAt: new Date().toISOString(),
    lastRunStatus: status,
    lastRunMessage: message.slice(0, 500),
  });
}

async function recordKeywordSync(message: string) {
  await updateContentEngineSchedule({
    lastKeywordSyncAt: new Date().toISOString(),
    lastKeywordSyncMessage: message.slice(0, 500),
  });
}

async function recordNewsRewrite(message: string) {
  await updateContentEngineSchedule({
    lastNewsRewriteAt: new Date().toISOString(),
    lastNewsRewriteMessage: message.slice(0, 500),
  });
}

async function executeKeywordSync() {
  if (runningKeywordSync || runningJob || runningNewsRewrite) return;
  runningKeywordSync = true;
  try {
    const result = await runContentEngineScript('src/jobs/keyword-engine.ts', [], 240_000);
    const tail = result.output.trim().split('\n').slice(-3).join(' · ');
    if (result.ok) {
      await recordKeywordSync(tail || 'GSC skorlari guncellendi');
      console.log('[news-scheduler] keyword sync OK');
      return;
    }
    await recordKeywordSync(tail || 'Keyword sync basarisiz');
    console.warn('[news-scheduler] keyword sync fail:', tail);
  } catch (e) {
    const message = e instanceof Error ? e.message : String(e);
    await recordKeywordSync(message).catch(() => undefined);
    console.error('[news-scheduler] keyword sync:', message);
  } finally {
    runningKeywordSync = false;
  }
}

async function executeNewsRewrite() {
  if (runningNewsRewrite || runningJob || runningKeywordSync) return;
  runningNewsRewrite = true;
  try {
    const result = await runContentEngineScript('src/jobs/news-gsc-rewrite.ts', [], 360_000);
    const tail = result.output.trim().split('\n').slice(-3).join(' · ');
    if (result.ok) {
      await recordNewsRewrite(tail || 'GSC rewrite tamamlandi');
      console.log('[news-scheduler] GSC rewrite OK');
      return;
    }
    await recordNewsRewrite(tail || 'GSC rewrite basarisiz');
    console.warn('[news-scheduler] GSC rewrite fail:', tail);
  } catch (e) {
    const message = e instanceof Error ? e.message : String(e);
    await recordNewsRewrite(message).catch(() => undefined);
    console.error('[news-scheduler] GSC rewrite:', message);
  } finally {
    runningNewsRewrite = false;
  }
}

async function executeScheduledRun() {
  if (runningJob || runningKeywordSync || runningNewsRewrite) return;
  runningJob = true;
  try {
    const schedule = await getOrCreateContentEngineSchedule();
    if (!schedule.enabled) return;

    const result = await runScheduledNewsDraft({ autoPublish: schedule.autoPublish });
    if (result.ok) {
      const pub = result.autoPublished ? ' · yayında' : ' · taslak';
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
  if (ticking || SCHEDULER_DISABLED) return;
  ticking = true;
  try {
    const schedule = await getOrCreateContentEngineSchedule();

    if (shouldRunWeeklyKeywordSync(schedule.lastKeywordSyncAt)) {
      await executeKeywordSync();
    }

    if (shouldRunWeeklyNewsRewrite(schedule.lastNewsRewriteAt)) {
      await executeNewsRewrite();
    }

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
  if (process.env.npm_lifecycle_event === 'build' || process.argv.some((a) => a.includes('build'))) return;

  started = true;
  const timer = setInterval(() => {
    void tick();
  }, TICK_MS);
  if (typeof timer === 'object' && 'unref' in timer) {
    timer.unref();
  }
  void tick();
}

export async function getSchedulerStatusForAdmin() {
  const schedule = await getOrCreateContentEngineSchedule();
  return {
    ...schedule,
    nextRunLabel: describeNextRun(schedule),
    schedulerDisabled: SCHEDULER_DISABLED,
    nextKeywordSyncLabel: 'Pazartesi 04:00 (TR)',
    nextNewsRewriteLabel: 'Pazartesi 04:10 (TR)',
  };
}

/** Kayit sonrasi hemen calismasi gerekiyorsa (saat eslesiyorsa) */
export async function maybeRunScheduleAfterSave() {
  const schedule = await getOrCreateContentEngineSchedule();
  if (shouldRunScheduleNow(schedule)) {
    await executeScheduledRun();
  }
}
