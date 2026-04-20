import { eq } from 'drizzle-orm';
import { getDb, hasDatabaseUrl } from '../../db/client';
import { kulupler } from '../../db/schema';
import { getUserPrimaryClub } from './auth';

export async function getPanelProfile(userId: number) {
  if (!hasDatabaseUrl()) {
    return null;
  }
  const membership = await getUserPrimaryClub(userId);
  if (!membership || membership.clubStatus !== 'approved') {
    return null;
  }

  const db = getDb();
  const [club] = await db
    .select({
      id: kulupler.id,
      ad: kulupler.ad,
      telefon: kulupler.telefon,
      email: kulupler.email,
      adres: kulupler.adres,
      aciklama: kulupler.aciklama,
      fiyatBilgisi: kulupler.fiyatBilgisi,
      yasAraligi: kulupler.yasAraligi,
      durum: kulupler.durum,
    })
    .from(kulupler)
    .where(eq(kulupler.id, membership.clubId))
    .limit(1);

  if (!club) {
    return null;
  }

  return {
    ...club,
    membershipRole: membership.membershipRole,
  };
}

export type UpdatePanelProfileInput = {
  telefon: string;
  email: string;
  adres: string;
  aciklama: string;
  fiyatBilgisi: string;
  yasAraligi: string;
};

export async function updatePanelProfile(userId: number, input: UpdatePanelProfileInput) {
  if (!hasDatabaseUrl()) {
    throw new Error('DATABASE_URL is not configured.');
  }
  const membership = await getUserPrimaryClub(userId);
  if (!membership) {
    throw new Error('Kulup uyeligi bulunamadi.');
  }
  if (membership.clubStatus !== 'approved') {
    throw new Error('Kulup onayli degil.');
  }

  const db = getDb();
  const [row] = await db
    .update(kulupler)
    .set({
      telefon: input.telefon.trim(),
      email: input.email.trim(),
      adres: input.adres.trim(),
      aciklama: input.aciklama.trim(),
      fiyatBilgisi: input.fiyatBilgisi.trim(),
      yasAraligi: input.yasAraligi.trim(),
      updatedAt: new Date(),
    })
    .where(eq(kulupler.id, membership.clubId))
    .returning({
      id: kulupler.id,
      ad: kulupler.ad,
      telefon: kulupler.telefon,
      email: kulupler.email,
      adres: kulupler.adres,
      aciklama: kulupler.aciklama,
      fiyatBilgisi: kulupler.fiyatBilgisi,
      yasAraligi: kulupler.yasAraligi,
      durum: kulupler.durum,
    });

  return row;
}
