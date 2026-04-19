import type { APIRoute } from 'astro';
import { BRANCHES, DISTRICTS } from '../../data/mockData';

export const GET: APIRoute = async () => {
  const baseUrl = 'https://spornerede.net';
  const citySlug = 'ankara';
  const urls = DISTRICTS.flatMap((district) =>
    BRANCHES.map((branch) => `${baseUrl}/sehirler/${citySlug}/${district.toLowerCase()}/${branch.slug}`)
  );

  const body = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls.map((url) => `<url><loc>${url}</loc></url>`).join('\n')}
</urlset>`;

  return new Response(body, {
    headers: { 'Content-Type': 'application/xml; charset=utf-8' },
  });
};

