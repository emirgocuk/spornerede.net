import type { APIRoute } from 'astro';
import { getAllCities, getAllBranches } from '../../lib/repositories/catalog';

export const GET: APIRoute = async () => {
  const baseUrl = 'https://spornerede.net';
  const cities = await getAllCities();
  const branches = await getAllBranches();
  
  const urls = cities.flatMap((city) =>
    branches.map((branch) => `${baseUrl}/sehirler/${city.slug}/${branch.slug}`)
  );

  const body = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls.map((url) => `<url><loc>${url}</loc></url>`).join('\n')}
</urlset>`;

  return new Response(body, {
    headers: { 'Content-Type': 'application/xml; charset=utf-8' },
  });
};

