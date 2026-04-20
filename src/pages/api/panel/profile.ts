import type { APIRoute } from 'astro';
import { requirePanelClubAccess } from '../../../lib/auth/guards';
import { getPanelProfile, updatePanelProfile } from '../../../lib/repositories/panelProfile';

export const prerender = false;

export const GET: APIRoute = async ({ request }) => {
  const guard = await requirePanelClubAccess(request);
  if (!guard.ok) {
    return guard.response;
  }

  const profile = await getPanelProfile(guard.session.userId);
  if (!profile) {
    return new Response(JSON.stringify({ error: 'Club membership not found' }), { status: 404 });
  }

  return new Response(JSON.stringify({ data: profile }), {
    headers: { 'Content-Type': 'application/json' },
  });
};

export const POST: APIRoute = async ({ request }) => {
  const guard = await requirePanelClubAccess(request);
  if (!guard.ok) {
    return guard.response;
  }

  const formData = await request.formData().catch(() => null);
  const telefon = formData?.get('telefon')?.toString() ?? '';
  const email = formData?.get('email')?.toString() ?? '';
  const adres = formData?.get('adres')?.toString() ?? '';
  const aciklama = formData?.get('aciklama')?.toString() ?? '';
  const fiyatBilgisi = formData?.get('fiyatBilgisi')?.toString() ?? '';
  const yasAraligi = formData?.get('yasAraligi')?.toString() ?? '';

  if (!telefon || !email) {
    return Response.redirect(new URL('/panel/profil?saved=0', request.url), 303);
  }

  try {
    await updatePanelProfile(guard.session.userId, {
      telefon,
      email,
      adres,
      aciklama,
      fiyatBilgisi,
      yasAraligi,
    });
    return Response.redirect(new URL('/panel/profil?saved=1', request.url), 303);
  } catch {
    return Response.redirect(new URL('/panel/profil?saved=0', request.url), 303);
  }
};
