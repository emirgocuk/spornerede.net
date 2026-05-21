import type { APIRoute } from 'astro';
import { getPublishedGuides } from '../../lib/repositories/seoArticles';
import { BASE_URL, sitemapResponse, type SitemapEntry } from '../../lib/seo/sitemap';

export const GET: APIRoute = async () => {
  const entries: SitemapEntry[] = [
    {
      loc: `${BASE_URL}/rehber`,
      changefreq: 'weekly',
      priority: 0.7,
    },
  ];

  try {
    const guides = await getPublishedGuides();
    for (const guide of guides) {
      if (!guide.slug) continue;
      entries.push({
        loc: `${BASE_URL}/rehber/${guide.slug}`,
        lastmod: guide.yayinlanmaTarihi || undefined,
        changefreq: 'monthly',
        priority: 0.6,
      });
    }
  } catch (error) {
    console.error('Sitemap guides.xml olusturulamadi:', error);
  }

  return sitemapResponse(entries);
};
