import type { APIRoute } from 'astro';
import { getAllCities, getAllDistricts, getAllBranches } from '../../lib/repositories/catalog';

export const GET: APIRoute = async () => {
  const baseUrl = 'https://spornerede.net';
  const cities = await getAllCities();
  const branches = await getAllBranches();
  
  let urls: string[] = [];
  
  for (const city of cities) {
    const districts = await getAllDistricts(city.slug);
    const cityUrls = districts.flatMap((district) =>
      branches.map((branch) => `${baseUrl}/sehirler/${city.slug}/${district.slug}/${branch.slug}`)
    );
    urls.push(...cityUrls);
  }

  const body = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls.map((url) => `<url><loc>${url}</loc></url>`).join('\n')}
</urlset>`;

  return new Response(body, {
    headers: { 'Content-Type': 'application/xml; charset=utf-8' },
  });
};

