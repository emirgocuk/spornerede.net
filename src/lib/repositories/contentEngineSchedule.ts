import { getDb, hasDatabaseUrl } from '../../db/client';

export type ContentEngineSchedule = {
  legacyId: number;
  enabled: boolean;
  runHour: number;
  runMinute: number;
  autoPublish: boolean;
  lastRunAt: string | null;
  lastRunStatus: string | null;
  lastRunMessage: string | null;
};

const DEFAULT_SCHEDULE: Omit<ContentEngineSchedule, 'legacyId'> = {
  enabled: false,
  runHour: 7,
  runMinute: 0,
  autoPublish: true,
  lastRunAt: null,
  lastRunStatus: null,
  lastRunMessage: null,
};

const LEGACY_ID = 1;

function clampHour(value: unknown) {
  const n = Number(value);
  if (!Number.isFinite(n)) return DEFAULT_SCHEDULE.runHour;
  return Math.min(23, Math.max(0, Math.floor(n)));
}

function clampMinute(value: unknown) {
  const n = Number(value);
  if (!Number.isFinite(n)) return DEFAULT_SCHEDULE.runMinute;
  return Math.min(59, Math.max(0, Math.floor(n)));
}

function mapRow(row: Record<string, unknown>): ContentEngineSchedule {
  return {
    legacyId: Number(row.legacyId ?? LEGACY_ID),
    enabled: Boolean(row.enabled),
    runHour: clampHour(row.runHour),
    runMinute: clampMinute(row.runMinute),
    autoPublish: row.autoPublish !== false,
    lastRunAt: row.lastRunAt ? String(row.lastRunAt) : null,
    lastRunStatus: row.lastRunStatus ? String(row.lastRunStatus) : null,
    lastRunMessage: row.lastRunMessage ? String(row.lastRunMessage) : null,
  };
}

async function findScheduleRow() {
  const db = await getDb();
  try {
    const rows = await db.collection('content_engine_schedule').getFullList({
      filter: `legacyId = ${LEGACY_ID}`,
    });
    return (rows[0] as Record<string, unknown> | undefined) ?? null;
  } catch (error) {
    const status = (error as { status?: number }).status;
    if (status === 404) return null;
    throw error;
  }
}

export async function getContentEngineSchedule(): Promise<ContentEngineSchedule | null> {
  if (!hasDatabaseUrl()) return null;
  const row = await findScheduleRow();
  if (!row) return null;
  return mapRow(row);
}

export async function getOrCreateContentEngineSchedule(): Promise<ContentEngineSchedule> {
  if (!hasDatabaseUrl()) {
    return { legacyId: LEGACY_ID, ...DEFAULT_SCHEDULE };
  }

  const existing = await findScheduleRow();
  if (existing) return mapRow(existing);

  const db = await getDb();
  const created = await db.collection('content_engine_schedule').create({
    legacyId: LEGACY_ID,
    ...DEFAULT_SCHEDULE,
  });
  return mapRow(created as Record<string, unknown>);
}

export async function updateContentEngineSchedule(
  patch: Partial<
    Pick<
      ContentEngineSchedule,
      'enabled' | 'runHour' | 'runMinute' | 'autoPublish' | 'lastRunAt' | 'lastRunStatus' | 'lastRunMessage'
    >
  >,
): Promise<ContentEngineSchedule> {
  const current = await getOrCreateContentEngineSchedule();
  const db = await getDb();
  const rows = await db.collection('content_engine_schedule').getFullList({
    filter: `legacyId = ${LEGACY_ID}`,
  });
  const row = rows[0] as { id: string } | undefined;
  if (!row) {
    const created = await db.collection('content_engine_schedule').create({
      legacyId: LEGACY_ID,
      ...DEFAULT_SCHEDULE,
      ...patch,
      runHour: patch.runHour !== undefined ? clampHour(patch.runHour) : DEFAULT_SCHEDULE.runHour,
      runMinute:
        patch.runMinute !== undefined ? clampMinute(patch.runMinute) : DEFAULT_SCHEDULE.runMinute,
    });
    return mapRow(created as Record<string, unknown>);
  }

  const updated = await db.collection('content_engine_schedule').update(row.id, {
    enabled: patch.enabled !== undefined ? patch.enabled : current.enabled,
    runHour: patch.runHour !== undefined ? clampHour(patch.runHour) : current.runHour,
    runMinute: patch.runMinute !== undefined ? clampMinute(patch.runMinute) : current.runMinute,
    autoPublish: patch.autoPublish !== undefined ? patch.autoPublish : current.autoPublish,
    lastRunAt: patch.lastRunAt !== undefined ? patch.lastRunAt : current.lastRunAt,
    lastRunStatus: patch.lastRunStatus !== undefined ? patch.lastRunStatus : current.lastRunStatus,
    lastRunMessage:
      patch.lastRunMessage !== undefined ? patch.lastRunMessage : current.lastRunMessage,
  });
  return mapRow(updated as Record<string, unknown>);
}

export function formatScheduleTime(hour: number, minute: number) {
  return `${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}`;
}

export function getIstanbulNowParts(date = new Date()) {
  const fmt = new Intl.DateTimeFormat('en-GB', {
    timeZone: 'Europe/Istanbul',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  });
  const parts = fmt.formatToParts(date);
  const pick = (type: string) => parts.find((p) => p.type === type)?.value ?? '';
  return {
    year: pick('year'),
    month: pick('month'),
    day: pick('day'),
    hour: Number(pick('hour')),
    minute: Number(pick('minute')),
    dateKey: `${pick('year')}-${pick('month')}-${pick('day')}`,
  };
}

export function sameIstanbulDay(a: Date | string, b: Date = new Date()) {
  const left = getIstanbulNowParts(new Date(a));
  const right = getIstanbulNowParts(b);
  return left.dateKey === right.dateKey;
}

export function shouldRunScheduleNow(schedule: ContentEngineSchedule, now = new Date()) {
  if (!schedule.enabled) return false;
  const parts = getIstanbulNowParts(now);
  if (parts.hour !== schedule.runHour || parts.minute !== schedule.runMinute) return false;
  if (schedule.lastRunAt && sameIstanbulDay(schedule.lastRunAt, now)) return false;
  return true;
}

export function describeNextRun(schedule: ContentEngineSchedule, now = new Date()) {
  if (!schedule.enabled) return 'Kapalı';
  const parts = getIstanbulNowParts(now);
  const todayRunPassed =
    parts.hour > schedule.runHour ||
    (parts.hour === schedule.runHour && parts.minute >= schedule.runMinute);
  const ranToday = schedule.lastRunAt ? sameIstanbulDay(schedule.lastRunAt, now) : false;
  if (!todayRunPassed && !ranToday) {
    return `Bugün ${formatScheduleTime(schedule.runHour, schedule.runMinute)}`;
  }
  return `Yarın ${formatScheduleTime(schedule.runHour, schedule.runMinute)}`;
}
