import type { APIRoute } from 'astro';
import { searchClubs } from '../../lib/repositories/catalog';
import { BASE_URL, sitemapResponse, type SitemapEntry } from '../../lib/seo/sitemap';
import { clubSlug } from '../../lib/seo/slug';

export const GET: APIRoute = async () => {
  const entries: SitemapEntry[] = [];

  try {
    const clubs = await searchClubs({});
    for (const club of clubs) {
      entries.push({
        loc: `${BASE_URL}/kulupler/${clubSlug({ id: club.id, ad: club.ad })}`,
        changefreq: 'weekly',
        priority: 0.7,
      });
    }
  } catch (error) {
    console.error('Sitemap clubs.xml olusturulamadi:', error);
  }

  return sitemapResponse(entries);
};
