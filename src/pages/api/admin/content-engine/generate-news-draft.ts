import type { APIRoute } from 'astro';
import { isAdminAuthorized } from '../../../../lib/adminAuth';
import { runNewsDraftFromAdmin, runNewsDraftAutoPick } from '../../../../lib/contentEngine/runNewsDraftFromAdmin';
import {
  ensureSeoKeywordsBeforeDraft,
  pickKonuForNewsDraft,
} from '../../../../lib/contentEngine/ensureSeoKeywordsBeforeDraft';
import { markKeywordWritten } from '../../../../lib/contentEngine/keywordCalendar';
import { getNewsAdminByLegacyId } from '../../../../lib/repositories/news';

export const prerender = false;

export const POST: APIRoute = async ({ request }) => {
  if (!(await isAdminAuthorized(request))) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), {
      status: 401,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  const payload = await request.json().catch(() => ({}));
  const konuInput = String((payload as { konu?: string }).konu ?? '').trim();

  const pbErr = await ensureSeoKeywordsBeforeDraft();
  if (pbErr) {
    return new Response(
      JSON.stringify({
        success: false,
        code: 'error',
        error: `seo_keywords hazir degil: ${pbErr}`,
      }),
      { status: 500, headers: { 'Content-Type': 'application/json' } },
    );
  }

  let result: Awaited<ReturnType<typeof runNewsDraftFromAdmin>>;
  try {
    if (konuInput) {
      result = await runNewsDraftFromAdmin(konuInput);
    } else {
      result = await runNewsDraftAutoPick();
    }
  } catch (e) {
    return new Response(
      JSON.stringify({
        success: false,
        code: 'error',
        error: e instanceof Error ? e.message : 'Haber uretimi basarisiz',
      }),
      { status: 500, headers: { 'Content-Type': 'application/json' } },
    );
  }

  if (!result.ok) {
    const status =
      result.code === 'rate_limit' || result.code === 'daily_limit'
        ? 429
        : result.code === 'timeout'
          ? 504
          : 400;
    return new Response(
      JSON.stringify({ success: false, code: result.code, error: result.message }),
      { status, headers: { 'Content-Type': 'application/json' } },
    );
  }

  const row = await getNewsAdminByLegacyId(result.legacyId);
  const isTemplate = String(result.modelUsed).startsWith('template:');

  await markKeywordWritten({
    id: (result as { konuId?: string }).konuId,
    anahtar: result.konu || konuInput,
  });

  return new Response(
    JSON.stringify({
      success: true,
      data: {
        id: result.legacyId,
        slug: result.slug,
        baslik: result.baslik,
        konu: result.konu,
        modelUsed: result.modelUsed,
        templateId: result.templateId ?? (isTemplate ? result.modelUsed.replace('template:', '') : undefined),
        previewUrl: `/haberler/${result.slug}`,
        aktif: Boolean(result.autoPublished),
        draftComplete: row?.draftComplete ?? isTemplate,
        draftIssues: row?.draftIssues ?? [],
        autoPublished: result.autoPublished,
      },
    }),
    { headers: { 'Content-Type': 'application/json' } },
  );
};
