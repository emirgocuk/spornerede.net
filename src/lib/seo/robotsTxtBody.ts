/**
 * robots.txt govdesi — tek kaynak (public/ yerine route ile sunulur;
 * Content-Type ve cache tutarli kalir, GSC/Cloudflare belirsizligi azalir).
 */
export const ROBOTS_TXT_BODY = `User-agent: *
Allow: /
Disallow: /api/
Disallow: /admin
Disallow: /admin/
Disallow: /panel
Disallow: /panel/
Disallow: /basvuru
Disallow: /uploads/
Disallow: /*?utm_*
Disallow: /*?fbclid=
Disallow: /*?gclid=

# Parametreli arama sayfasinin crawl butcesini koru, ana arama indekslensin
Allow: /ara$
Disallow: /ara?*

# Yapay zeka tarayicilari icin (opsiyonel)
User-agent: GPTBot
Disallow: /

User-agent: anthropic-ai
Disallow: /

User-agent: CCBot
Disallow: /

User-agent: Google-Extended
Disallow: /

Sitemap: https://spornerede.net/sitemap-index.xml
Sitemap: https://spornerede.net/sitemaps/cities.xml
Sitemap: https://spornerede.net/sitemaps/districts.xml
Sitemap: https://spornerede.net/sitemaps/news.xml
Sitemap: https://spornerede.net/sitemaps/clubs.xml
Sitemap: https://spornerede.net/sitemaps/listings.xml
`;
