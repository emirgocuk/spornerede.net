import { cfg, requireOpenRouter, requirePocketBaseAdmin } from '../config.js';
import { fetchGscPages } from '../gsc/client.js';
import {
  getPerfRuleConfig,
  newsPagePath,
  normalizePagePath,
  shouldSuggestCtrImprovement,
  weeksSincePublish,
  formatPerfRuleSummary,
} from '../gsc/performance-rules.js';
import { getAdminPb } from '../pb/client.js';
import { rewriteNewsFull } from '../llm/generate-news-rewrite.js';
import {
  assessNewsDraft,
  stripAllInternalLinksFooters,
  stripCeKonuFromOzet,
} from '../lib/news-draft-quality.js';
import { injectNewsLinksWithPb } from '../lib/news-body-links.js';
import { repairNewsHtml } from '../lib/repair-news-html.js';
import { buildNewsRealData } from '../lib/site-context.js';
import { loadRecentPublishedBodies } from '../lib/published-topics.js';
import { maxSimilarity } from '../lib/similarity.js';
import {
  preserveOzetMetaPrefix,
  stampCeRewriteMeta,
  weeksSinceCeRewrite,
} from '../lib/news-rewrite-meta.js';
import { stripHtml } from '../lib/slugify.js';

type HaberRecord = {
  id: string;
  slug?: string;
  baslik?: string;
  ozet?: string;
  aktif?: boolean;
  legacyId?: number;
  tarih?: string;
  created?: string;
};

type RewriteCandidate = {
  record: HaberRecord;
  impressions: number;
  clicks: number;
  ctr: number;
  position: number;
};

export type NewsGscRewriteSummary = {
  ok: boolean;
  scanned: number;
  candidates: number;
  rewritten: number;
  skipped: number;
  messages: string[];
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

function publishAgeWeeks(record: HaberRecord): number {
  const legacyMs = Number(record.legacyId);
  if (Number.isFinite(legacyMs) && legacyMs > 1_000_000_000_000) {
    return (Date.now() - legacyMs) / (7 * 24 * 60 * 60 * 1000);
  }
  return weeksSincePublish(record.tarih, record.created);
}

export async function runNewsGscRewriteJob(
  opts?: { dryRun?: boolean; maxRewrites?: number },
): Promise<NewsGscRewriteSummary> {
  if (!cfg.newsRewriteEnabled) {
    return {
      ok: true,
      scanned: 0,
      candidates: 0,
      rewritten: 0,
      skipped: 0,
      messages: ['SEO_NEWS_REWRITE_ENABLED=false — atlandi'],
    };
  }

  requirePocketBaseAdmin();
  requireOpenRouter();

  const rules = getPerfRuleConfig();
  const maxRewrites = Math.max(0, opts?.maxRewrites ?? cfg.newsRewriteMaxPerWeek);
  const messages: string[] = [];
  console.log('[news-gsc-rewrite]', formatPerfRuleSummary(rules));
  console.log(
    `[news-gsc-rewrite] haftalik limit: ${maxRewrites} | min yayin: ${cfg.newsRewriteMinPublishWeeks} hafta | min rewrite araligi: ${cfg.newsRewriteMinWeeks} hafta`,
  );

  const pb = await getAdminPb();
  const gscPages = await fetchGscPages(28);
  if (!gscPages.length) {
    const msg = 'GSC sayfa verisi yok veya erisim kapali';
    console.log('[news-gsc-rewrite]', msg);
    return { ok: true, scanned: 0, candidates: 0, rewritten: 0, skipped: 0, messages: [msg] };
  }

  const byPath = buildPageIndex(gscPages);
  const rows = await pb.collection('haberler').getFullList();
  const active = rows.filter((r) => Boolean((r as HaberRecord).aktif)) as HaberRecord[];

  const candidates: RewriteCandidate[] = [];

  for (const record of active) {
    const slug = String(record.slug ?? '').trim();
    if (!slug) continue;

    const path = newsPagePath(slug);
    const match = byPath.get(path);
    const impressions = match?.impressions ?? 0;
    const clicks = match?.clicks ?? 0;
    const ctr = match?.ctr ?? 0;
    const position = match?.position ?? 0;

    if (!shouldSuggestCtrImprovement(impressions, ctr, rules)) continue;
    if (publishAgeWeeks(record) < cfg.newsRewriteMinPublishWeeks) continue;
    if (weeksSinceCeRewrite(String(record.ozet ?? '')) < cfg.newsRewriteMinWeeks) continue;

    candidates.push({ record, impressions, clicks, ctr, position });
  }

  candidates.sort((a, b) => b.impressions - a.impressions);
  const picked = candidates.slice(0, maxRewrites);

  console.log(
    `[news-gsc-rewrite] ${active.length} yayin tarandi | ${candidates.length} aday | ${picked.length} secildi`,
  );

  if (opts?.dryRun) {
    for (const c of picked) {
      const line = `[dry-run] ${c.record.slug} — ${c.impressions} gosterim, CTR %${(c.ctr * 100).toFixed(2)}`;
      console.log(' ', line);
      messages.push(line);
    }
    return {
      ok: true,
      scanned: active.length,
      candidates: candidates.length,
      rewritten: 0,
      skipped: 0,
      messages,
    };
  }

  const recentBodies = await loadRecentPublishedBodies(pb, 20);
  let rewritten = 0;
  let skipped = 0;

  for (const { record, impressions, clicks, ctr, position } of picked) {
    const slug = String(record.slug ?? '');
    const rawOzet = String(record.ozet ?? '');
    const { konu, body } = stripCeKonuFromOzet(rawOzet);
    const baslik = String(record.baslik ?? '');
    const topic = konu || baslik;

    if (!body.trim()) {
      skipped += 1;
      messages.push(`${slug}: bos metin`);
      continue;
    }

    const selfPlain = stripAllInternalLinksFooters(body);
    const corpus = recentBodies.filter((item) => trigramSafeDiff(item, selfPlain));

    try {
      const realData = await buildNewsRealData(pb, topic);
      const result = await rewriteNewsFull({
        konu: topic,
        baslik,
        draftHtml: body,
        realData,
      });

      const parsed = result.meta;
      const repaired = repairNewsHtml(parsed?.ozetHtml ?? result.html);
      const bodyHtml = await injectNewsLinksWithPb(pb, repaired.html, topic, cfg.siteUrl, {
        excludeHaberSlug: slug,
      });
      const assessment = assessNewsDraft(bodyHtml, topic);
      if (!assessment.complete) {
        skipped += 1;
        messages.push(`${slug}: kalite (${assessment.issues.join(', ')})`);
        console.warn(`  [atla] ${slug} kalite:`, assessment.issues.join('; '));
        continue;
      }

      if (corpus.length) {
        const sim = maxSimilarity(stripAllInternalLinksFooters(bodyHtml), corpus);
        if (sim >= cfg.newsDedupMax) {
          skipped += 1;
          messages.push(`${slug}: benzerlik ${sim.toFixed(2)}`);
          console.warn(`  [atla] ${slug} benzerlik ${sim.toFixed(2)}`);
          continue;
        }
      }

      const newBaslik = parsed?.baslik?.trim() || baslik;
      const mergedBody = preserveOzetMetaPrefix(rawOzet, bodyHtml);
      const ozet = stampCeRewriteMeta(mergedBody);

      const patch: Record<string, unknown> = {
        baslik: newBaslik,
        seoTitle: parsed?.seoTitle?.trim() || newBaslik.slice(0, 60),
        seoDescription:
          parsed?.seoDescription?.trim() || stripHtml(bodyHtml).slice(0, 160),
        ozet,
        gsc_gosterim: impressions,
        gsc_tiklama: clicks,
        gsc_konum: position,
      };

      if (parsed?.kategori) patch.kategori = parsed.kategori;
      if (parsed?.kategoriRenk) patch.kategoriRenk = parsed.kategoriRenk;

      try {
        await pb.collection('haberler').update(record.id, patch);
      } catch (e) {
        delete patch.gsc_gosterim;
        delete patch.gsc_tiklama;
        delete patch.gsc_konum;
        await pb.collection('haberler').update(record.id, patch);
      }

      rewritten += 1;
      const line = `${slug} — ${impressions} gosterim, CTR %${(ctr * 100).toFixed(2)} → ${newBaslik.slice(0, 50)}`;
      messages.push(line);
      console.log(`  [rewrite] ${line} (${result.modelUsed})`);
    } catch (e) {
      skipped += 1;
      const msg = e instanceof Error ? e.message : String(e);
      messages.push(`${slug}: ${msg.slice(0, 80)}`);
      console.warn(`  [hata] ${slug}:`, msg);
    }
  }

  const summary = `rewrite: ${rewritten}/${picked.length} | aday: ${candidates.length}`;
  console.log(`\n[news-gsc-rewrite] ${summary}`);
  return {
    ok: true,
    scanned: active.length,
    candidates: candidates.length,
    rewritten,
    skipped,
    messages: [summary, ...messages],
  };
}

/** Ayni govdeyi korpustan cikar (benzerlik kendi kendine 1 olmasin) */
function trigramSafeDiff(corpusItem: string, selfPlain: string): boolean {
  if (!selfPlain.trim() || !corpusItem.trim()) return true;
  return maxSimilarity(corpusItem, [selfPlain]) < 0.95;
}

async function main() {
  const dryRun = process.argv.includes('--dry-run');
  const result = await runNewsGscRewriteJob({ dryRun });
  if (!result.ok) process.exit(1);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
