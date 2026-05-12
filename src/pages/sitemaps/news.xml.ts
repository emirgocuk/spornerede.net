import type { APIRoute } from 'astro';
import { getActiveNews } from '../../lib/repositories/news';
import { BASE_URL, sitemapResponse, type SitemapEntry } from '../../lib/seo/sitemap';

export const GET: APIRoute = async () => {
  const entries: SitemapEntry[] = [];

  try {
    const news = await getActiveNews();
    for (const item of news) {
      const slug = String(item.slug ?? '').trim();
      if (!slug) continue;
      entries.push({
        loc: `${BASE_URL}/haberler/${slug}`,
        lastmod: item.tarihIso || undefined,
        changefreq: 'monthly',
        priority: 0.5,
      });
    }
  } catch (error) {
    console.error('Sitemap news.xml olusturulamadi:', error);
  }

  return sitemapResponse(entries);
};
