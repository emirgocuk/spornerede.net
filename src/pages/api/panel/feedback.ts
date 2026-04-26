import type { APIRoute } from 'astro';
import { getCurrentSessionUser } from '../../../lib/auth/session';
import { createPanelFeedback } from '../../../lib/repositories/panelFeedbacks';

export const POST: APIRoute = async ({ request }) => {
  const session = await getCurrentSessionUser(request);
  if (!session) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401 });
  }

  const formData = await request.formData().catch(() => null);
  const mesaj = formData?.get('mesaj')?.toString().trim() ?? '';
  const adSoyad = formData?.get('adSoyad')?.toString().trim() ?? '';
  const sayfaUrl = formData?.get('sayfaUrl')?.toString().trim() ?? '';
  const tarayiciBilgisi = formData?.get('tarayiciBilgisi')?.toString().trim() ?? '';
  const gorsel = formData?.get('gorsel');

  if (!mesaj) {
    return new Response(JSON.stringify({ error: 'Mesaj boş olamaz' }), { status: 400 });
  }

  try {
    let gorselUrl = '';
    let gorselDeleteUrl = '';

    if (gorsel instanceof File && gorsel.size > 0) {
      if (!gorsel.type.startsWith('image/')) {
        return new Response(JSON.stringify({ error: 'Yalnızca görsel dosyası yüklenebilir.' }), { status: 400 });
      }
      if (gorsel.size > 5 * 1024 * 1024) {
        return new Response(JSON.stringify({ error: 'Görsel en fazla 5 MB olabilir.' }), { status: 400 });
      }

      const apiKey = import.meta.env.IMGBB_API_KEY?.toString().trim();
      if (!apiKey) {
        return new Response(JSON.stringify({ error: 'Görsel yükleme yapılandırması eksik.' }), { status: 500 });
      }

      const imageBase64 = Buffer.from(await gorsel.arrayBuffer()).toString('base64');
      const upstream = await fetch('https://api.imgbb.com/1/upload', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({ key: apiKey, image: imageBase64 }),
      });
      const payload = await upstream.json().catch(() => null);
      if (!upstream.ok || !payload?.success || !payload?.data?.url) {
        return new Response(JSON.stringify({ error: 'Görsel yüklenemedi.' }), { status: 502 });
      }
      gorselUrl = payload.data.url as string;
      gorselDeleteUrl = (payload.data.delete_url as string | undefined) ?? '';
    }

    const feedback = await createPanelFeedback({
      kullaniciLegacyId: session.userId,
      kullaniciEmail: session.email,
      adSoyad,
      mesaj,
      sayfaUrl,
      tarayiciBilgisi,
      gorselUrl,
      gorselDeleteUrl,
    });
    return new Response(JSON.stringify({ ok: true, data: feedback }), {
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Feedback create error:', error);
    return new Response(JSON.stringify({ error: 'Sunucu hatası' }), { status: 500 });
  }
};