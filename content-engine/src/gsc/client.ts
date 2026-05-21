import { cfg } from '../config.js';
import { getGscAuthClient, gscAuthConfigured } from './auth.js';

export type GscQueryRow = {
  query: string;
  clicks: number;
  impressions: number;
  ctr: number;
  position: number;
};

export type GscSiteEntry = { siteUrl: string; permissionLevel?: string };

async function getSearchConsole() {
  if (!gscAuthConfigured()) return null;
  const auth = await getGscAuthClient();
  if (!auth) return null;
  const { google } = await import('googleapis');
  return google.searchconsole({ version: 'v1', auth });
}

export async function listGscSiteEntries(): Promise<GscSiteEntry[]> {
  const sc = await getSearchConsole();
  if (!sc) return [];
  const res = await sc.sites.list();
  const entries = (res.data as { siteEntry?: GscSiteEntry[] }).siteEntry ?? [];
  return entries.filter((e) => Boolean(e.siteUrl));
}

/** .env siteUrl yoksa veya eslesmiyorsa listeden spornerede ile esleseni secer */
export async function resolveGscSiteUrl(): Promise<string> {
  const configured = cfg.gscSiteUrl.trim();
  const sites = await listGscSiteEntries();
  if (!sites.length) return configured;

  const norm = (u: string) => u.replace(/\/$/, '').toLowerCase();
  if (configured) {
    const exact = sites.find((s) => s.siteUrl === configured);
    if (exact) return exact.siteUrl;
    const loose = sites.find((s) => norm(s.siteUrl) === norm(configured));
    if (loose) return loose.siteUrl;
  }

  const domain = sites.find((s) => s.siteUrl.startsWith('sc-domain:spornerede'));
  if (domain) return domain.siteUrl;

  const https = sites.find((s) => s.siteUrl.includes('spornerede.net'));
  if (https) return https.siteUrl;

  return sites[0]?.siteUrl ?? configured;
}

export async function fetchGscQueries(days = 28): Promise<GscQueryRow[]> {
  const sc = await getSearchConsole();
  if (!sc) {
    console.log('[gsc] GSC kimlik bilgisi yok (service account veya oauth) — atlaniyor.');
    return [];
  }

  const siteUrl = await resolveGscSiteUrl();
  if (!siteUrl) {
    console.log('[gsc] SEO_GSC_SITE_URL tanimli degil — atlaniyor.');
    return [];
  }
  const end = new Date();
  const start = new Date();
  start.setDate(end.getDate() - days);

  console.log('[gsc] siteUrl:', siteUrl);

  const res = await sc.searchanalytics.query({
    siteUrl,
    requestBody: {
      startDate: start.toISOString().slice(0, 10),
      endDate: end.toISOString().slice(0, 10),
      dimensions: ['query'],
      rowLimit: 250,
    },
  });

  const rows = (res.data as { rows?: Array<{ keys?: string[]; clicks?: number; impressions?: number; ctr?: number; position?: number }> })
    .rows ?? [];

  return rows.map((row) => ({
    query: String(row.keys?.[0] ?? '').toLowerCase().trim(),
    clicks: Number(row.clicks ?? 0),
    impressions: Number(row.impressions ?? 0),
    ctr: Number(row.ctr ?? 0),
    position: Number(row.position ?? 0),
  }));
}
