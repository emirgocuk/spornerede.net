import { cfg, requirePocketBaseAdmin } from '../config.js';
import { getAdminPb, createFreshAdminPb } from '../pb/client.js';
import { createNewsDraft } from '../pb/news.js';
import { generateNewsParsed } from '../llm/generate-news.js';
import { buildNewsFromTemplate, wrapTemplateOzet } from '../lib/build-template-news.js';
import { polishTemplateNewsLlm } from '../llm/polish-template-news.js';
import {
  loadPublishedHistory,
  recentTemplateIds,
  isKonuAlreadyPublished,
} from '../lib/published-topics.js';
import { pickNewsKeyword, markKeywordUsed, markKeywordUsedByAnahtar, enrichKeywordForKonu } from '../lib/pick-news-keyword.js';
import {
  assessNewsDraft,
  ensureMinNewsWords,
  injectNewsInternalLinks,
  stripAllInternalLinksFooters,
} from '../lib/news-draft-quality.js';
import { injectNewsLinksWithPb } from '../lib/news-body-links.js';
import { buildCtaHint } from '../lib/news-cta-hint.js';
import { repairNewsHtml } from '../lib/repair-news-html.js';
import {
  pickNewsWritingAngle,
  pickAlternativeAngle,
  buildAvoidListForPrompt,
} from '../lib/news-angles.js';
import { buildNewsRealData } from '../lib/site-context.js';
import { loadRecentPublishedBodies } from '../lib/published-topics.js';
import { maxSimilarity } from '../lib/similarity.js';
import { ensureContentEngineCollections } from '../lib/ensure-collections.js';

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
  keyword?: { id: string; gscHint: string; avoidList: string; niyet?: string },
): Promise<NewsDraftRunResult> {
  const history = await loadPublishedHistory(pb);
  if (isKonuAlreadyPublished(konu, history, { includePassive: true })) {
    if (keyword?.id) {
      await markKeywordUsed(pb, keyword.id, { skip_reason: 'duplicate' });
    }
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
        ozetHtml: await injectNewsLinksWithPb(
          pb,
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

  built.ozetHtml = await injectNewsLinksWithPb(pb, built.ozetHtml, konu, cfg.siteUrl);
  built.ozetWrapped = wrapTemplateOzet(konu, built.templateId, built.ozetHtml, keyword?.id);

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
  } else {
    await markKeywordUsedByAnahtar(pb, konu, {
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
  keyword: { id: string; gscHint: string; avoidList: string; niyet?: string },
): Promise<NewsDraftRunResult> {
  const history = await loadPublishedHistory(pb);
  if (isKonuAlreadyPublished(konu, history, { includePassive: true })) {
    if (keyword.id) {
      await markKeywordUsed(pb, keyword.id, { skip_reason: 'duplicate' });
    }
    return {
      ok: false,
      code: 'duplicate',
      message: `Bu konu zaten yayinlandi veya taslakta: ${konu}`,
    };
  }

  const avoidList = buildAvoidListForPrompt(history);
  const seed = konu + (keyword.id || '');
  const angle = pickNewsWritingAngle(seed);
  const realData = await buildNewsRealData(pb, konu);
  if (realData) {
    console.error('[news] gercek veri eklendi (data-grounding)');
  }
  const recentBodies = await loadRecentPublishedBodies(pb, 20);

  const ctaHint = buildCtaHint(keyword.niyet, konu);

  type GenOk = {
    parsed: Awaited<ReturnType<typeof generateNewsParsed>>['parsed'];
    modelUsed: string;
    bodyHtml: string;
  };

  console.error('[news] LLM haber uretimi:', konu);
  const generateOnce = async (
    angleArg: string,
  ): Promise<GenOk | { error: NewsDraftRunResult }> => {
    let parsed;
    let modelUsed = cfg.openrouterModel;
    try {
      const result = await generateNewsParsed(konu, {
        gscHint: keyword.gscHint,
        avoidList,
        angle: angleArg,
        realData,
        ctaHint,
      });
      parsed = result.parsed;
      modelUsed = result.modelUsed;
    } catch (e) {
      const msg = String(e);
      if (msg.includes('429') || msg.toLowerCase().includes('rate-limited')) {
        return { error: { ok: false, code: 'rate_limit', message: 'Model kotasi (429).' } };
      }
      return { error: { ok: false, code: 'error', message: msg } };
    }

    const repaired = repairNewsHtml(parsed.ozetHtml).html;
    const bodyHtml = await injectNewsLinksWithPb(pb, repaired, konu, cfg.siteUrl);
    const check = assessNewsDraft(bodyHtml, konu, { template: false });
    if (!check.complete) {
      return {
        error: { ok: false, code: 'quality', message: `LLM kalite: ${check.issues.join('; ')}` },
      };
    }
    return { parsed, modelUsed, bodyHtml };
  };

  const first = await generateOnce(angle);
  if ('error' in first) return first.error;

  const similarityOf = (g: GenOk) =>
    recentBodies.length ? maxSimilarity(stripAllInternalLinksFooters(g.bodyHtml), recentBodies) : 0;

  let chosen = first;
  let usedAngle = angle;
  let sim = similarityOf(chosen);

  if (recentBodies.length && sim >= cfg.newsDedupMax) {
    console.warn(
      `[news] benzerlik yuksek (${sim.toFixed(2)} >= ${cfg.newsDedupMax}); alternatif aci ile yeniden uretiliyor`,
    );
    const altAngle = pickAlternativeAngle(seed, angle);
    const second = await generateOnce(altAngle);
    if (!('error' in second)) {
      const sim2 = similarityOf(second);
      if (sim2 < sim) {
        chosen = second;
        usedAngle = altAngle;
        sim = sim2;
      }
    }
  }

  const needsReview = recentBodies.length > 0 && sim >= cfg.newsDedupMax;
  if (needsReview) {
    console.warn(`[news] hala benzer (${sim.toFixed(2)}); incelemeye dusuruluyor (otomatik yayin yok)`);
  }

  const ozet = wrapLlmOzet(konu, chosen.bodyHtml, keyword.id);
  const shouldPublish = shouldAutoPublishNews() && !needsReview;

  const { legacyId, slug, record } = await createNewsDraft(pb, {
    baslik: chosen.parsed.baslik,
    kategori: chosen.parsed.kategori,
    kategoriRenk: chosen.parsed.kategoriRenk,
    ozet,
    seoTitle: chosen.parsed.seoTitle,
    seoDescription: chosen.parsed.seoDescription,
    aktif: shouldPublish,
  });

  if (shouldPublish) {
    await pb.collection('haberler').update(record.id, { aktif: true });
  }

  if (keyword.id) {
    await markKeywordUsed(pb, keyword.id, {
      haber_slug: slug,
      model: chosen.modelUsed,
      angle: usedAngle,
      similarity: Number(sim.toFixed(3)),
    });
  } else {
    await markKeywordUsedByAnahtar(pb, konu, {
      haber_slug: slug,
      model: chosen.modelUsed,
      angle: usedAngle,
      similarity: Number(sim.toFixed(3)),
    });
  }

  return {
    ok: true,
    legacyId,
    slug,
    baslik: chosen.parsed.baslik,
    modelUsed: chosen.modelUsed,
    konu,
    autoPublished: shouldPublish,
    duplicateSkipped: needsReview,
  };
}

export async function runNewsDraftPipeline(input?: {
  konu?: string;
  keywordId?: string;
}): Promise<NewsDraftRunResult> {
  requirePocketBaseAdmin();
  await ensureContentEngineCollections(undefined, { quiet: true });
  let pb = await createFreshAdminPb();

  const dailyLimit = Math.max(1, cfg.dailyArticleLimit);
  if ((await countTodayNews(pb)) >= dailyLimit) {
    return { ok: false, code: 'daily_limit', message: `Gunluk limit (${dailyLimit}) dolu.` };
  }

  const envKonu = process.env.SEO_NEWS_KONU?.trim() ?? '';
  const envKeywordId = process.env.SEO_NEWS_KEYWORD_ID?.trim() ?? '';
  const forcedKonu = input?.konu?.trim() || envKonu;
  const forcedKeywordId = input?.keywordId || envKeywordId;
  const maxAttempts = forcedKonu && forcedKeywordId ? 1 : 5;

  for (let attempt = 0; attempt < maxAttempts; attempt += 1) {
    let konu = attempt === 0 ? forcedKonu : '';
    let keywordPick: Awaited<ReturnType<typeof pickNewsKeyword>> = null;

    if (konu && forcedKeywordId && attempt === 0) {
      const history = await loadPublishedHistory(pb);
      keywordPick = {
        id: forcedKeywordId,
        anahtar: konu,
        niyet: '',
        siteContext: {},
        gscHint: '',
        avoidList: buildAvoidListForPrompt(history),
      };
    } else if (!konu) {
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
      niyet: keywordPick.niyet,
    };

    let result: NewsDraftRunResult;
    if (cfg.newsMode === 'llm') {
      result = await createFromLlmPipeline(pb, konu, keywordCtx);
    } else if (useTemplatePipeline()) {
      result = await createFromTemplatePipeline(pb, konu, keywordCtx);
      if (!result.ok && cfg.newsMode !== 'template' && cfg.newsMode !== 'template_llm') {
        console.warn('[news] sablon basarisiz, LLM yedegi:', result.message);
        result = await createFromLlmPipeline(pb, konu, keywordCtx);
      }
    } else {
      result = await createFromLlmPipeline(pb, konu, keywordCtx);
    }

    if (result.ok) return result;
    if (result.code === 'duplicate' && !forcedKonu) continue;
    return result;
  }

  return {
    ok: false,
    code: 'duplicate',
    message: 'Uygun yeni konu bulunamadi (tekrarlayan keywordler atlandi).',
  };
}
