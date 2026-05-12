import type { APIRoute } from 'astro';
import { getAllCities, getAllBranches, searchClubs } from '../../lib/repositories/catalog';
import { BASE_URL, sitemapResponse, type SitemapEntry } from '../../lib/seo/sitemap';

export const GET: APIRoute = async () => {
  const entries: SitemapEntry[] = [];

  try {
    const [cities, branches, clubs] = await Promise.all([
      getAllCities(),
      getAllBranches(),
      searchClubs({}),
    ]);

    // Sehir bazli kombinasyon uretiminden once kac kulup oldugunu say
    // (bos sehir+brans kombinasyonlari sitemap'e girmesin)
    const clubsByCityBranch = new Map<string, number>();
    for (const club of clubs) {
      if (!club.ilSlug || !club.bransSlug) continue;
      const key = `${club.ilSlug}|${club.bransSlug}`;
      clubsByCityBranch.set(key, (clubsByCityBranch.get(key) ?? 0) + 1);
    }

    for (const city of cities) {
      for (const branch of branches) {
        const key = `${city.slug}|${branch.slug}`;
        const count = clubsByCityBranch.get(key) ?? 0;
        // En az 1 kulup olan kombinasyonlari yaz
        if (count === 0) continue;
        entries.push({
          loc: `${BASE_URL}/sehirler/${city.slug}/${branch.slug}`,
          changefreq: 'weekly',
          priority: count >= 5 ? 0.8 : 0.6,
        });
      }
    }
  } catch (error) {
    console.error('Sitemap cities.xml olusturulamadi:', error);
  }

  return sitemapResponse(entries);
};
