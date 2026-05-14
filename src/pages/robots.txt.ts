import type { APIRoute } from 'astro';
import { ROBOTS_TXT_BODY } from '../lib/seo/robotsTxtBody';

export const GET: APIRoute = () => {
  return new Response(ROBOTS_TXT_BODY, {
    status: 200,
    headers: {
      'Content-Type': 'text/plain; charset=utf-8',
      'Cache-Control': 'public, max-age=600, s-maxage=86400, stale-while-revalidate=86400',
    },
  });
};
