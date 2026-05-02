import type { APIRoute } from 'astro';
import { getAllDistricts } from '../../lib/repositories/catalog';

export const prerender = false;

export const GET: APIRoute = async ({ url }) => {
  const ilRaw = url.searchParams.get('il');
  const il = ilRaw?.trim() ? ilRaw.trim() : undefined;
  const items = await getAllDistricts(il);

  return new Response(JSON.stringify({ items }), {
    status: 200,
    headers: {
      'Content-Type': 'application/json; charset=utf-8',
      'Cache-Control': 'public, max-age=60',
    },
  });
};

