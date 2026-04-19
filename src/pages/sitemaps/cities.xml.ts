import type { APIRoute } from 'astro';
import { CITIES, BRANCHES, slugify } from '../../data/mockData';

export const GET: APIRoute = async () => {
  const baseUrl = 'https://spornerede.net';
  const urls = CITIES.flatMap((city) =>
    BRANCHES.map((branch) => `${baseUrl}/sehirler/${slugify(city)}/${branch.slug}`)
  );

  const body = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls.map((url) => `<url><loc>${url}</loc></url>`).join('\n')}
</urlset>`;

  return new Response(body, {
    headers: { 'Content-Type': 'application/xml; charset=utf-8' },
  });
};

