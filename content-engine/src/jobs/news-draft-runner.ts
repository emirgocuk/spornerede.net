import { cfg, requirePocketBaseAdmin } from '../config.js';
import { getAdminPb } from '../pb/client.js';
import { createNewsDraft } from '../pb/news.js';
import { generateNewsParsed } from '../llm/generate-news.js';
import { buildNewsFromTemplate, wrapTemplateOzet } from '../lib/build-template-news.js';
import { polishTemplateNewsLlm } from '../llm/polish-template-news.js';
import {
  loadPublishedHistory,
  recentTemplateIds,
  isKonuAlreadyPublished,
} from '../lib/published-topics.js';
import { pickNewsKeyword, markKeywordUsed, enrichKeywordForKonu } from '../lib/pick-news-keyword.js';
import {
  assessNewsDraft,
  ensureMinNewsWords,
  injectNewsInternalLinks,
} from '../lib/news-draft-quality.js';
import { repairNewsHtml } from '../lib/repair-news-html.js';
import { pickNewsWritingAngle, buildAvoidListForPrompt } from '../lib/news-angles.js';

export type NewsDraftRunResult =
  | {
      ok: true;
      legacyId: number;
      slug: string;
      baslik: string;
      modelUsed: string;
      konu: string;
      templateId?: string;
      autoPublished?: boolean;
      duplicateSkipped?: boolean;
    }
  | {
      ok: false;
      code: 'daily_limit' | 'no_topic' | 'rate_limit' | 'error' | 'quality' | 'duplicate';
      message: string;
    };

async function countTodayNews(pb: Awaited<ReturnType<typeof getAdminPb>>): Promise<number> {
  const start = new Date();
  start.setHours(0, 0, 0, 0);
  const rows = await pb.collection('haberler').getFullList();
  return rows.filter((row) => {
    const created = new Date(String(row.created ?? ''));
    return !Number.isNaN(created.getTime()) && created >= start;
  }).length;
}

function useTemplatePipeline() {
  return cfg.newsMode === 'template' || cfg.newsMode === 'template_llm' || cfg.newsMode === 'hybrid';
}

function useTemplateLlmPolish() {
  if (cfg.newsMode === 'template_llm') return cfg.templateLlmPolish;
  if (cfg.newsMode === 'template') return false;
  return cfg.templateLlmPolish;
}

function shouldAutoPublishNews() {
  return cfg.autoPublish || cfg.templateAutoPublish;
}

function wrapLlmOzet(konu: string, bodyHtml: string, keywordId?: string) {
  const kw = keywordId ? `\n<!-- ce-keyword:${keywordId} -->\n` : '\n';
  return `<!-- ce-konu:${konu} -->\n<!-- ce-mode:llm -->${kw}${bodyHtml}`;
}

async function createFromTemplatePipeline(
  pb: Awaited<ReturnType<typeof getAdminPb>>,
  konu: string,
  keyword?: { id: string; gscHint: string; avoidList: string },
): Promise<NewsDraftRunResult> {
  const history = await loadPublishedHistory(pb);
  if (isKonuAlreadyPublished(konu, history, { includePassive: true })) {
    return {
      ok: false,
      code: 'duplicate',
      message: `Bu konu zaten yayinlandi veya taslakta: ${konu}`,
    };
  }

  let built = buildNewsFromTemplate(konu, {
    recentTemplateIds: recentTemplateIds(history),
    keywordId: keyword?.id,
  });

  let modelUsed = `template:${built.templateId}`;

  if (useTemplateLlmPolish() && cfg.openrouterApiKey) {
    try {
      const polished = await polishTemplateNewsLlm({
        built,
        gscHint: keyword?.gscHint ?? `Anahtar: ${konu}`,
        avoidList: keyword?.avoidList ?? '',
      });
      built = {
        ...built,
        baslik: polished.baslik,
        seoTitle: polished.seoTitle,
        seoDescription: polished.seoDescription,
        ozetHtml: injectNewsInternalLinks(
          ensureMinNewsWords(repairNewsHtml(polished.ozetHtml).html, konu),
          konu,
          cfg.siteUrl,
        ),
      };
      built.ozetWrapped = wrapTemplateOzet(konu, built.templateId, built.ozetHtml, keyword?.id);
      const check = assessNewsDraft(built.ozetHtml, konu, { template: true });
      built.complete = check.complete;
      built.issues = check.issues;
      built.wordCount = check.wordCount;
      modelUsed = `template+llm:${built.templateId}`;
    } catch (e) {
      console.warn('[news] LLM cilalama atlandi:', e);
    }
  }

  if (!built.complete) {
    return {
      ok: false,
      code: 'quality',
      message: `Sablon kalite: ${built.issues.join('; ')}`,
    };
  }

  const shouldPublish = shouldAutoPublishNews();

  const { legacyId, slug, record } = await createNewsDraft(pb, {
    baslik: built.baslik,
    kategori: built.kategori,
    kategoriRenk: built.kategoriRenk,
    ozet: built.ozetWrapped,
    seoTitle: built.seoTitle,
    seoDescription: built.seoDescription,
    aktif: shouldPublish,
  });

  if (shouldPublish) {
    await pb.collection('haberler').update(record.id, { aktif: true });
  }

  if (keyword?.id) {
    await markKeywordUsed(pb, keyword.id, {
      haber_slug: slug,
      template_id: built.templateId,
      model: modelUsed,
    });
  }

  return {
    ok: true,
    legacyId,
    slug,
    baslik: built.baslik,
    modelUsed,
    konu,
    templateId: built.templateId,
    autoPublished: shouldPublish,
  };
}

async function createFromLlmPipeline(
  pb: Awaited<ReturnType<typeof getAdminPb>>,
  konu: string,
  keyword: { id: string; gscHint: string; avoidList: string },
): Promise<NewsDraftRunResult> {
  const history = await loadPublishedHistory(pb);
  if (isKonuAlreadyPublished(konu, history, { includePassive: true })) {
    return {
      ok: false,
      code: 'duplicate',
      message: `Bu konu zaten yayinlandi veya taslakta: ${konu}`,
    };
  }

  const avoidList = buildAvoidListForPrompt(history);
  const angle = pickNewsWritingAngle(konu + (keyword.id || ''));

  let parsed;
  let modelUsed = cfg.openrouterModel;
  console.error('[news] LLM haber uretimi:', konu);
  try {
    const result = await generateNewsParsed(konu, {
      gscHint: keyword.gscHint,
      avoidList,
      angle,
    });
    parsed = result.parsed;
    modelUsed = result.modelUsed;
  } catch (e) {
    const msg = String(e);
    if (msg.includes('429') || msg.toLowerCase().includes('rate-limited')) {
      return { ok: false, code: 'rate_limit', message: 'Model kotasi (429).' };
    }
    return { ok: false, code: 'error', message: msg };
  }

  const bodyHtml = injectNewsInternalLinks(
    repairNewsHtml(parsed.ozetHtml).html,
    konu,
    cfg.siteUrl,
  );
  const check = assessNewsDraft(bodyHtml, konu, { template: false });
  if (!check.complete) {
    return {
      ok: false,
      code: 'quality',
      message: `LLM kalite: ${check.issues.join('; ')}`,
    };
  }

  const ozet = wrapLlmOzet(konu, bodyHtml, keyword.id);
  const shouldPublish = shouldAutoPublishNews();

  const { legacyId, slug, record } = await createNewsDraft(pb, {
    baslik: parsed.baslik,
    kategori: parsed.kategori,
    kategoriRenk: parsed.kategoriRenk,
    ozet,
    seoTitle: parsed.seoTitle,
    seoDescription: parsed.seoDescription,
    aktif: shouldPublish,
  });

  if (shouldPublish) {
    await pb.collection('haberler').update(record.id, { aktif: true });
  }

  if (keyword.id) {
    await markKeywordUsed(pb, keyword.id, {
      haber_slug: slug,
      model: modelUsed,
      angle,
    });
  }

  return {
    ok: true,
    legacyId,
    slug,
    baslik: parsed.baslik,
    modelUsed,
    konu,
    autoPublished: shouldPublish,
  };
}

export async function runNewsDraftPipeline(input?: {
  konu?: string;
}): Promise<NewsDraftRunResult> {
  requirePocketBaseAdmin();
  const pb = await getAdminPb();

  const dailyLimit = Math.max(1, cfg.dailyArticleLimit);
  if ((await countTodayNews(pb)) >= dailyLimit) {
    return { ok: false, code: 'daily_limit', message: `Gunluk limit (${dailyLimit}) dolu.` };
  }

  let konu = input?.konu?.trim() ?? '';
  let keywordPick: Awaited<ReturnType<typeof pickNewsKeyword>> = null;

  if (!konu) {
    keywordPick = await pickNewsKeyword(pb);
    konu = keywordPick?.anahtar ?? '';
  }

  if (!konu) {
    return {
      ok: false,
      code: 'no_topic',
      message:
        'Uygun keyword yok (hepsi yayinlandi veya kuyruk bos). npm run job:keywords sonra tekrar deneyin.',
    };
  }

  if (!keywordPick) {
    keywordPick = await enrichKeywordForKonu(pb, konu);
  }

  const keywordCtx = {
    id: keywordPick.id,
    gscHint: keywordPick.gscHint,
    avoidList: keywordPick.avoidList || buildAvoidListForPrompt(await loadPublishedHistory(pb)),
  };

  if (cfg.newsMode === 'llm') {
    return createFromLlmPipeline(pb, konu, keywordCtx);
  }

  if (useTemplatePipeline()) {
    const fromTemplate = await createFromTemplatePipeline(pb, konu, keywordCtx);
    if (fromTemplate.ok) return fromTemplate;
    if (cfg.newsMode === 'template' || cfg.newsMode === 'template_llm') {
      return fromTemplate;
    }
    console.warn('[news] sablon basarisiz, LLM yedegi:', fromTemplate.message);
  }

  return createFromLlmPipeline(pb, konu, keywordCtx);
}
