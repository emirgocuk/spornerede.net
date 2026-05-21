import { cfg, requirePocketBaseAdmin } from '../config.js';
import { fetchGscPages } from '../gsc/client.js';
import {
  formatPerfRuleSummary,
  getPerfRuleConfig,
  guidePagePath,
  normalizePagePath,
  shouldMarkLowPerformance,
  shouldSuggestCtrImprovement,
  weeksSincePublish,
} from '../gsc/performance-rules.js';
import { getAdminPb } from '../pb/client.js';

type ArticleRecord = {
  id: string;
  slug?: string;
  baslik?: string;
  durum?: string;
  yayinlanma_tarihi?: string;
  created?: string;
  anahtar_kelime_id?: string;
  gsc_gosterim?: number;
};

function buildPageIndex(pages: Awaited<ReturnType<typeof fetchGscPages>>) {
  const byPath = new Map<string, (typeof pages)[0]>();
  for (const row of pages) {
    const path = normalizePagePath(row.page);
    const prev = byPath.get(path);
    if (!prev || row.impressions > prev.impressions) {
      byPath.set(path, row);
    }
  }
  return byPath;
}

async function requeueKeyword(pb: Awaited<ReturnType<typeof getAdminPb>>, keywordId: string) {
  if (!keywordId) return;
  try {
    const kw = await pb.collection('seo_keywords').getOne(keywordId);
    const durum = String(kw.durum ?? '');
    if (durum === 'yazildi' || durum === 'yaziliyor') {
      await pb.collection('seo_keywords').update(keywordId, { durum: 'kuyrukta' });
    }
  } catch {
    /* keyword silinmis olabilir */
  }
}

async function main() {
  requirePocketBaseAdmin();
  const rules = getPerfRuleConfig();
  console.log('[gsc-reporter]', formatPerfRuleSummary(rules));

  const pb = await getAdminPb();
  const gscPages = await fetchGscPages(28);
  if (!gscPages.length) {
    console.log('[gsc-reporter] GSC sayfa verisi yok veya erisim kapali.');
    return;
  }

  const byPath = buildPageIndex(gscPages);
  const { listGuideRecords } = await import('../pb/list-guides.js');
  const articles = await listGuideRecords(pb, {
    durumIn: ['yayinda', 'dusuk_performans'],
  });

  let synced = 0;
  let markedLow = 0;
  let ctrHints = 0;

  for (const raw of articles) {
    const article = raw as unknown as ArticleRecord;
    const slug = String(article.slug ?? '');
    const path = guidePagePath(slug);
    const match = byPath.get(path);

    const impressions = match?.impressions ?? 0;
    const clicks = match?.clicks ?? 0;
    const ctr = match?.ctr ?? 0;
    const position = match?.position ?? 0;

    await pb.collection('rehber_yazilari').update(article.id, {
      gsc_tiklama: clicks,
      gsc_gosterim: impressions,
      gsc_konum: position,
    });
    synced++;

    if (article.durum !== 'yayinda') continue;

    const weeks = weeksSincePublish(article.yayinlanma_tarihi, article.created);

    if (shouldMarkLowPerformance(weeks, impressions, rules)) {
      await pb.collection('rehber_yazilari').update(article.id, {
        durum: 'dusuk_performans',
      });
      await requeueKeyword(pb, String(article.anahtar_kelime_id ?? ''));
      markedLow++;
      console.log(
        `  [dusuk_performans] ${slug} — ${weeks.toFixed(1)} hafta, ${impressions} gosterim`,
      );
      continue;
    }

    if (shouldSuggestCtrImprovement(impressions, ctr, rules)) {
      ctrHints++;
      console.log(
        `  [ctr_iyilestir] ${slug} — ${impressions} gosterim, CTR %${(ctr * 100).toFixed(2)}`,
      );
      const kwId = String(article.anahtar_kelime_id ?? '').trim();
      if (kwId) {
        try {
          const kw = await pb.collection('seo_keywords').getOne(kwId);
          const ctx = (kw.site_context as Record<string, unknown>) ?? {};
          await pb.collection('seo_keywords').update(kwId, {
            site_context: {
              ...ctx,
              oneri: 'ctr_iyilestir',
              slug,
              gsc_impressions: impressions,
              gsc_ctr: ctr,
              gsc_clicks: clicks,
            },
          });
        } catch {
          /* */
        }
      }
    }
  }

  console.log(
    `\nGSC sync: ${synced} makale | dusuk_performans: +${markedLow} | ctr_iyilestir ipucu: ${ctrHints}`,
  );
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
