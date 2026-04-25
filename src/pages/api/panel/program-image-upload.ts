import type { APIRoute } from 'astro';
import { requirePanelClubAccess } from '../../../lib/auth/guards';

export const prerender = false;

export const POST: APIRoute = async ({ request }) => {
  const guard = await requirePanelClubAccess(request);
  if (!guard.ok) {
    return guard.response;
  }

  const apiKey = import.meta.env.IMGBB_API_KEY?.toString().trim();
  if (!apiKey) {
    return new Response(JSON.stringify({ error: 'IMGBB_API_KEY tanimli degil.' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  const formData = await request.formData().catch(() => null);
  const image = formData?.get('image');
  if (!(image instanceof File)) {
    return new Response(JSON.stringify({ error: 'image dosyasi zorunlu.' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  const imageBase64 = Buffer.from(await image.arrayBuffer()).toString('base64');
  const upstreamBody = new URLSearchParams({ key: apiKey, image: imageBase64 });

  const upstream = await fetch('https://api.imgbb.com/1/upload', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: upstreamBody,
  });
  const payload = await upstream.json().catch(() => null);
  if (!upstream.ok || !payload?.success) {
    return new Response(JSON.stringify({ error: 'ImageBB yukleme basarisiz.' }), {
      status: 502,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  return new Response(
    JSON.stringify({
      url: payload?.data?.url as string,
      deleteUrl: payload?.data?.delete_url as string,
    }),
    { headers: { 'Content-Type': 'application/json' } }
  );
};
