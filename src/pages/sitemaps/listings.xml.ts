import type { APIRoute } from 'astro';
import { searchClubs } from '../../lib/repositories/catalog';
import { BASE_URL, sitemapResponse, type SitemapEntry } from '../../lib/seo/sitemap';
import { listingSlug } from '../../lib/seo/slug';

export const GET: APIRoute = async () => {
  const entries: SitemapEntry[] = [];

  try {
    const clubs = await searchClubs({});
    for (const club of clubs) {
      const programs = Array.isArray(club.programlar) ? club.programlar : [];
      for (const program of programs) {
        const id = Number(program.id);
        if (!Number.isFinite(id)) continue;
        entries.push({
          loc: `${BASE_URL}/ilanlar/${listingSlug({ id, ad: program.ad, clubAd: club.ad })}`,
          changefreq: 'weekly',
          priority: 0.7,
        });
      }
    }
  } catch (error) {
    console.error('Sitemap listings.xml olusturulamadi:', error);
  }

  return sitemapResponse(entries);
};
