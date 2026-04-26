import type { APIRoute } from 'astro';
import { getActiveNews } from '../../lib/repositories/news';

export const GET: APIRoute = async () => {
  const baseUrl = 'https://spornerede.net';
  let urls: string[] = [];

  try {
    const news = await getActiveNews();
    urls = news
      .map((item) => String(item.slug ?? '').trim())
      .filter(Boolean)
      .map((slug) => `${baseUrl}/haberler/${slug}`);
  } catch (error) {
    console.error('Sitemap news.xml olusturulamadi:', error);
  }

  const body = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls.map((url) => `<url><loc>${url}</loc></url>`).join('\n')}
</urlset>`;

  return new Response(body, {
    headers: { 'Content-Type': 'application/xml; charset=utf-8' },
  });
};
