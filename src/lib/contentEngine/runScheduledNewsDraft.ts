import {
  ensureSeoKeywordsBeforeDraft,
  pickKonuForNewsDraft,
} from './ensureSeoKeywordsBeforeDraft';
import { runNewsDraftFromAdmin } from './runNewsDraftFromAdmin';

export type ScheduledNewsResult =
  | { ok: true; legacyId: number; baslik: string; konu: string; autoPublished?: boolean }
  | { ok: false; code: string; message: string };

/** Zamanlayici — admin oturumu gerektirmez */
export async function runScheduledNewsDraft(options?: {
  autoPublish?: boolean;
}): Promise<ScheduledNewsResult> {
  const pbErr = await ensureSeoKeywordsBeforeDraft();
  if (pbErr) {
    return { ok: false, code: 'error', message: `seo_keywords hazir degil: ${pbErr}` };
  }

  const picked = await pickKonuForNewsDraft();
  if (!picked?.anahtar) {
    return {
      ok: false,
      code: 'no_topic',
      message: 'Kuyrukta keyword yok.',
    };
  }

  const extraEnv: Record<string, string> = {};
  if (options?.autoPublish) {
    extraEnv.SEO_AUTO_PUBLISH = 'true';
    extraEnv.SEO_NEWS_TEMPLATE_AUTO_PUBLISH = 'true';
  }

  try {
    const result = await runNewsDraftFromAdmin(picked.anahtar, picked.id, extraEnv);
    if (!result.ok) {
      return { ok: false, code: result.code, message: result.message };
    }
    return {
      ok: true,
      legacyId: result.legacyId,
      baslik: result.baslik,
      konu: result.konu,
      autoPublished: result.autoPublished,
    };
  } catch (e) {
    return {
      ok: false,
      code: 'error',
      message: e instanceof Error ? e.message : 'Zamanlanmis uretim basarisiz',
    };
  }
}
