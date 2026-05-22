import { runNewsDraftFromAdmin } from './runNewsDraftFromAdmin';

/** Admin manuel taslak — content-engine pipeline (SEO_NEWS_MODE) */
export async function createManualNewsDraft(baslikRaw: string, konuRaw?: string) {
  const konu = (konuRaw || baslikRaw).trim();
  if (!konu) {
    throw new Error('Haber basligi veya konu gerekli.');
  }

  const result = await runNewsDraftFromAdmin(konu);
  if (!result.ok) {
    throw new Error(result.message || 'Haber uretilemedi.');
  }

  return {
    id: result.legacyId,
    slug: result.slug,
    baslik: result.baslik,
    konu: result.konu,
    templateId: result.templateId,
    modelUsed: result.modelUsed,
  };
}
