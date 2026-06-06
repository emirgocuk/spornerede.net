import type { APIRoute } from 'astro';
import { isAdminAuthorized } from '../../../../lib/adminAuth';
import {
  getSchedulerStatusForAdmin,
  maybeRunScheduleAfterSave,
} from '../../../../lib/contentEngine/newsScheduler';
import { updateContentEngineSchedule } from '../../../../lib/repositories/contentEngineSchedule';

export const prerender = false;

export const GET: APIRoute = async ({ request }) => {
  if (!(await isAdminAuthorized(request))) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401 });
  }

  const data = await getSchedulerStatusForAdmin();
  return new Response(JSON.stringify({ data }), {
    headers: { 'Content-Type': 'application/json' },
  });
};

export const PUT: APIRoute = async ({ request }) => {
  if (!(await isAdminAuthorized(request))) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401 });
  }

  const body = await request.json().catch(() => ({}));
  const runTime = String((body as { runTime?: string }).runTime ?? '').trim();
  let runHour: number | undefined;
  let runMinute: number | undefined;
  if (runTime.includes(':')) {
    const [h, m] = runTime.split(':');
    runHour = Number(h);
    runMinute = Number(m);
  }

  const updated = await updateContentEngineSchedule({
    enabled:
      (body as { enabled?: boolean }).enabled !== undefined
        ? Boolean((body as { enabled?: boolean }).enabled)
        : undefined,
    runHour: Number.isFinite(runHour) ? runHour : undefined,
    runMinute: Number.isFinite(runMinute) ? runMinute : undefined,
    autoPublish:
      (body as { autoPublish?: boolean }).autoPublish !== undefined
        ? Boolean((body as { autoPublish?: boolean }).autoPublish)
        : undefined,
  });

  if (updated.enabled) {
    await maybeRunScheduleAfterSave();
  }

  const data = await getSchedulerStatusForAdmin();
  return new Response(JSON.stringify({ data, saved: updated }), {
    headers: { 'Content-Type': 'application/json' },
  });
};
