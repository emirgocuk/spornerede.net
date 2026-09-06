import type { APIRoute } from 'astro';
import { isAdminAuthorized } from '../../../lib/adminAuth';

export const prerender = false;

export const POST: APIRoute = async ({ request }) => {
  if (!(await isAdminAuthorized(request))) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), {
      status: 401,
      headers: { 'Content-Type': 'application/json' },
    });
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

  const MAX_IMAGE_SIZE = 5 * 1024 * 1024;
  if (image.size > MAX_IMAGE_SIZE) {
    return new Response(JSON.stringify({ error: 'Görsel boyutu en fazla 5 MB olabilir.' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  const bytes = new Uint8Array(await image.arrayBuffer());
  const { isValidImageSignature } = await import('../../../lib/security/fileValidation');
  if (!isValidImageSignature(bytes)) {
    return new Response(JSON.stringify({ error: 'Geçersiz görsel formatı. Sadece JPG, PNG veya WEBP yükleyebilirsiniz.' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  const imageBase64 = Buffer.from(bytes).toString('base64');
  const upstreamBody = new URLSearchParams({ key: apiKey, image: imageBase64 });

  const upstream = await fetch('https://api.imgbb.com/1/upload', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: upstreamBody,
  });
  const payload = await upstream.json().catch(() => null);

  if (!upstream.ok || !payload?.success || !payload?.data?.url) {
    return new Response(JSON.stringify({ error: 'ImageBB yukleme basarisiz.' }), {
      status: 502,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  return new Response(
    JSON.stringify({
      success: true,
      data: {
        url: payload.data.url as string,
        deleteUrl: payload.data.delete_url as string | undefined,
      },
    }),
    { headers: { 'Content-Type': 'application/json' } }
  );
};
