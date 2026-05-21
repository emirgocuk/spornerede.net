import { cfg } from '../config.js';

export type PerfRuleConfig = {
  lowPerfWeeks: number;
  lowPerfMaxImpressions: number;
  lowCtrMinImpressions: number;
  lowCtrMax: number;
};

export function getPerfRuleConfig(): PerfRuleConfig {
  return {
    lowPerfWeeks: Math.max(1, Number(process.env.SEO_GSC_LOW_PERF_WEEKS) || 4),
    lowPerfMaxImpressions: Math.max(
      0,
      Number(process.env.SEO_GSC_LOW_PERF_MAX_IMPRESSIONS) || 10,
    ),
    lowCtrMinImpressions: Math.max(
      1,
      Number(process.env.SEO_GSC_LOW_CTR_MIN_IMPRESSIONS) || 50,
    ),
    lowCtrMax: Number(process.env.SEO_GSC_LOW_CTR_MAX) || 0.03,
  };
}

export function normalizePagePath(pageUrl: string): string {
  const raw = pageUrl.trim();
  try {
    const u = raw.startsWith('http')
      ? new URL(raw)
      : new URL(raw.startsWith('/') ? `https://local${raw}` : `https://local/${raw}`);
    return u.pathname.replace(/\/$/, '').toLowerCase() || '/';
  } catch {
    return raw.replace(/\/$/, '').toLowerCase();
  }
}

export function guidePagePath(slug: string): string {
  return `/rehber/${String(slug).trim().replace(/^\/+/, '')}`.toLowerCase();
}

export function weeksSincePublish(
  yayinlanmaTarihi?: string,
  created?: string,
): number {
  const iso = yayinlanmaTarihi?.trim() || created?.trim();
  if (!iso) return 0;
  const t = new Date(iso).getTime();
  if (Number.isNaN(t)) return 0;
  return (Date.now() - t) / (7 * 24 * 60 * 60 * 1000);
}

/** 4+ hafta yayinda, GSC gosterim < esik → dusuk_performans */
export function shouldMarkLowPerformance(
  weeksPublished: number,
  impressions: number,
  rules: PerfRuleConfig = getPerfRuleConfig(),
): boolean {
  return (
    weeksPublished >= rules.lowPerfWeeks &&
    impressions < rules.lowPerfMaxImpressions
  );
}

/** Yuksek gosterim + dusuk CTR → baslik/meta iyilestir (dusuk_performans degil) */
export function shouldSuggestCtrImprovement(
  impressions: number,
  ctr: number,
  rules: PerfRuleConfig = getPerfRuleConfig(),
): boolean {
  return impressions >= rules.lowCtrMinImpressions && ctr < rules.lowCtrMax;
}

export function formatPerfRuleSummary(rules: PerfRuleConfig = getPerfRuleConfig()): string {
  return [
    `dusuk_performans: >=${rules.lowPerfWeeks} hafta ve <${rules.lowPerfMaxImpressions} gosterim`,
    `ctr_iyilestir: >=${rules.lowCtrMinImpressions} gosterim ve CTR <${(rules.lowCtrMax * 100).toFixed(1)}%`,
    `site: ${cfg.siteUrl}`,
  ].join(' | ');
}
