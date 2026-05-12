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

    // (ilSlug|ilceSlug|bransSlug) -> count
    const counts = new Map<string, number>();
    for (const club of clubs) {
      if (!club.ilSlug || !club.ilceSlug || !club.bransSlug) continue;
      const key = `${club.ilSlug}|${club.ilceSlug}|${club.bransSlug}`;
      counts.set(key, (counts.get(key) ?? 0) + 1);
    }

    // Sehir+ilce+brans kombinasyonlarini yalniz coklu kulup varsa yaz
    const uniqueCityDistrict = new Set<string>();
    for (const club of clubs) {
      if (club.ilSlug && club.ilceSlug) {
        uniqueCityDistrict.add(`${club.ilSlug}|${club.ilceSlug}`);
      }
    }

    for (const key of uniqueCityDistrict) {
      const [citySlug, districtSlug] = key.split('|');
      const city = cities.find((c) => c.slug === citySlug);
      if (!city) continue;
      for (const branch of branches) {
        const count = counts.get(`${citySlug}|${districtSlug}|${branch.slug}`) ?? 0;
        if (count === 0) continue;
        entries.push({
          loc: `${BASE_URL}/sehirler/${citySlug}/${districtSlug}/${branch.slug}`,
          changefreq: 'weekly',
          priority: 0.6,
        });
      }
    }
  } catch (error) {
    console.error('Sitemap districts.xml olusturulamadi:', error);
  }

  return sitemapResponse(entries);
};
