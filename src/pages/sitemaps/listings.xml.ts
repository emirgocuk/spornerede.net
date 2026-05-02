import type { APIRoute } from 'astro';
import { searchClubs } from '../../lib/repositories/catalog';

export const GET: APIRoute = async () => {
  const baseUrl = 'https://spornerede.net';
  let urls: string[] = [];

  try {
    const clubs = await searchClubs({});
    urls = clubs.flatMap((club) =>
      (Array.isArray(club.programlar) ? club.programlar : [])
        .map((program) => Number(program.id))
        .filter((id) => Number.isFinite(id))
        .map((id) => `${baseUrl}/ilanlar/${id}`)
    );
  } catch (error) {
    console.error('Sitemap listings.xml olusturulamadi:', error);
  }

  const safeUrls = urls.length > 0 ? urls : [`${baseUrl}/`];
  const body = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${safeUrls.map((url) => `<url><loc>${url}</loc></url>`).join('\n')}
</urlset>`;

  return new Response(body, {
    headers: { 'Content-Type': 'application/xml; charset=utf-8' },
  });
};
