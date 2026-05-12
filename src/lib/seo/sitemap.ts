/**
 * Sitemap XML uretici yardimcilari.
 * - <lastmod>, <changefreq>, <priority> destegi
 * - URL XML escape
 * - Bos URL listelerine guvenli fallback
 */

export type SitemapEntry = {
  loc: string;
  lastmod?: string | Date;
  changefreq?: 'always' | 'hourly' | 'daily' | 'weekly' | 'monthly' | 'yearly' | 'never';
  priority?: number;
};

const BASE_URL = 'https://spornerede.net';

function escapeXml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

function toIsoDate(value: string | Date | undefined): string | null {
  if (!value) return null;
  try {
    const date = value instanceof Date ? value : new Date(value);
    if (Number.isNaN(date.getTime())) return null;
    return date.toISOString();
  } catch {
    return null;
  }
}

function renderEntry(entry: SitemapEntry): string {
  const parts: string[] = [`<loc>${escapeXml(entry.loc)}</loc>`];
  const lastmod = toIsoDate(entry.lastmod);
  if (lastmod) parts.push(`<lastmod>${lastmod}</lastmod>`);
  if (entry.changefreq) parts.push(`<changefreq>${entry.changefreq}</changefreq>`);
  if (typeof entry.priority === 'number') {
    const clamped = Math.max(0, Math.min(1, entry.priority));
    parts.push(`<priority>${clamped.toFixed(1)}</priority>`);
  }
  return `<url>${parts.join('')}</url>`;
}

export function renderSitemap(entries: SitemapEntry[]): string {
  const safeEntries: SitemapEntry[] =
    entries.length > 0
      ? entries
      : [{ loc: `${BASE_URL}/`, changefreq: 'daily', priority: 1.0 }];

  const body = safeEntries.map(renderEntry).join('\n');
  return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${body}
</urlset>`;
}

export function sitemapResponse(entries: SitemapEntry[]): Response {
  return new Response(renderSitemap(entries), {
    headers: {
      'Content-Type': 'application/xml; charset=utf-8',
      // 1 saat CDN cache, taze gerekirse SWR
      'Cache-Control': 'public, max-age=300, s-maxage=3600, stale-while-revalidate=86400',
    },
  });
}

export { BASE_URL };
