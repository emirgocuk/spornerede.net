import type { APIRoute } from 'astro';
import { searchClubs } from '../../lib/repositories/catalog';

export const GET: APIRoute = async () => {
  const baseUrl = 'https://spornerede.net';
  let urls: string[] = [];

  try {
    const clubs = await searchClubs({});
    urls = clubs.map((club) => `${baseUrl}/kulupler/${club.id}`);
  } catch (error) {
    console.error('Sitemap clubs.xml olusturulamadi:', error);
  }

  const body = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls.map((url) => `<url><loc>${url}</loc></url>`).join('\n')}
</urlset>`;

  return new Response(body, {
    headers: { 'Content-Type': 'application/xml; charset=utf-8' },
  });
};
