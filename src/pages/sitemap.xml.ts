import type { APIRoute } from 'astro';

/** Google / eski araclar cogu zaman `sitemap.xml` arar; 404 HTML "desteklenmeyen dosya biçimi" hatasina yol acar. */
export const GET: APIRoute = ({ site }) => {
  const base = site ?? new URL('https://spornerede.net/');
  const loc = new URL('/sitemap-index.xml', base).href;
  return new Response(null, {
    status: 301,
    headers: {
      Location: loc,
      'Cache-Control': 'public, max-age=86400',
    },
  });
};
