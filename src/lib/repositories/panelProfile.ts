import { getDb, hasDatabaseUrl } from '../../db/client';
import { getUserPrimaryClub } from './auth';

export async function getPanelProfile(userId: number) {
  if (!hasDatabaseUrl()) {
    return null;
  }
  const membership = await getUserPrimaryClub(userId);
  if (!membership || membership.clubStatus !== 'approved') {
    return null;
  }

  const db = await getDb();
  const club = await db.collection('kulupler').getFirstListItem(`legacyId = ${membership.clubId}`).catch(() => null);

  if (!club) {
    return null;
  }

  return {
    ...club,
    id: Number(club.legacyId),
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
    throw new Error('POCKETBASE_URL is not configured.');
  }
  const membership = await getUserPrimaryClub(userId);
  if (!membership) {
    throw new Error('Kulup uyeligi bulunamadi.');
  }
  if (membership.clubStatus !== 'approved') {
    throw new Error('Kulup onayli degil.');
  }

  const db = await getDb();
  const club = await db.collection('kulupler').getFirstListItem(`legacyId = ${membership.clubId}`).catch(() => null);
  if (!club) return null;
  const row = await db.collection('kulupler').update(club.id, {
    telefon: input.telefon.trim(),
    email: input.email.trim(),
    adres: input.adres.trim(),
    aciklama: input.aciklama.trim(),
    fiyatBilgisi: input.fiyatBilgisi.trim(),
    yasAraligi: input.yasAraligi.trim(),
  });

  return {
    id: Number(row.legacyId),
    ad: row.ad as string,
    telefon: row.telefon as string,
    email: row.email as string,
    adres: row.adres as string,
    aciklama: row.aciklama as string,
    fiyatBilgisi: row.fiyatBilgisi as string,
    yasAraligi: row.yasAraligi as string,
    durum: row.durum as 'pending' | 'approved' | 'rejected',
  };
}
