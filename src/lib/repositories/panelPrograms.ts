import { getDb, hasDatabaseUrl } from '../../db/client';
import { getUserPrimaryClub } from './auth';

export type ProgramPayload = {
  ad: string;
  aciklama?: string;
  gunSaat?: string;
  seviye?: string;
  ucretBilgisi?: string;
  aktif?: boolean;
};

async function resolveClubId(userId: number) {
  const membership = await getUserPrimaryClub(userId);
  if (!membership) {
    throw new Error('Kulup uyeligi bulunamadi.');
  }
  if (membership.clubStatus !== 'approved') {
    throw new Error('Kulup onayli degil.');
  }
  return membership.clubId;
}

export async function listPanelPrograms(userId: number) {
  if (!hasDatabaseUrl()) {
    return [];
  }
  const clubId = await resolveClubId(userId);
  const db = await getDb();
  const rows = await db.collection('kulup_programlari').getFullList({
    filter: `kulupLegacyId = ${clubId}`,
    sort: '-legacyId',
  });
  return rows.map((row) => ({
    id: Number(row.legacyId),
    ad: row.ad as string,
    aciklama: (row.aciklama as string) ?? '',
    gunSaat: (row.gunSaat as string) ?? '',
    seviye: (row.seviye as string) ?? '',
    ucretBilgisi: (row.ucretBilgisi as string) ?? '',
    aktif: Boolean(row.aktif),
    createdAt: row.created,
    updatedAt: row.updated,
  }));
}

export async function createPanelProgram(userId: number, payload: ProgramPayload) {
  if (!hasDatabaseUrl()) {
    throw new Error('POCKETBASE_URL is not configured.');
  }
  const clubId = await resolveClubId(userId);
  const db = await getDb();
  const row = await db.collection('kulup_programlari').create({
    legacyId: Date.now(),
    kulupLegacyId: clubId,
    ad: payload.ad.trim(),
    aciklama: payload.aciklama?.trim() ?? '',
    gunSaat: payload.gunSaat?.trim() ?? '',
    seviye: payload.seviye?.trim() ?? '',
    ucretBilgisi: payload.ucretBilgisi?.trim() ?? '',
    aktif: payload.aktif ?? true,
  });
  return {
    id: Number(row.legacyId),
    ad: row.ad as string,
    aciklama: (row.aciklama as string) ?? '',
    gunSaat: (row.gunSaat as string) ?? '',
    seviye: (row.seviye as string) ?? '',
    ucretBilgisi: (row.ucretBilgisi as string) ?? '',
    aktif: Boolean(row.aktif),
  };
}

export async function updatePanelProgram(userId: number, programId: number, payload: ProgramPayload) {
  if (!hasDatabaseUrl()) {
    throw new Error('POCKETBASE_URL is not configured.');
  }
  const clubId = await resolveClubId(userId);
  const db = await getDb();
  const existing = await db
    .collection('kulup_programlari')
    .getFirstListItem(`legacyId = ${programId} && kulupLegacyId = ${clubId}`)
    .catch(() => null);
  if (!existing) return null;
  const row = await db.collection('kulup_programlari').update(existing.id, {
    ad: payload.ad.trim(),
    aciklama: payload.aciklama?.trim() ?? '',
    gunSaat: payload.gunSaat?.trim() ?? '',
    seviye: payload.seviye?.trim() ?? '',
    ucretBilgisi: payload.ucretBilgisi?.trim() ?? '',
    aktif: payload.aktif ?? true,
  });
  return {
    id: Number(row.legacyId),
    ad: row.ad as string,
    aciklama: (row.aciklama as string) ?? '',
    gunSaat: (row.gunSaat as string) ?? '',
    seviye: (row.seviye as string) ?? '',
    ucretBilgisi: (row.ucretBilgisi as string) ?? '',
    aktif: Boolean(row.aktif),
  };
}

export async function deletePanelProgram(userId: number, programId: number) {
  if (!hasDatabaseUrl()) {
    throw new Error('POCKETBASE_URL is not configured.');
  }
  const clubId = await resolveClubId(userId);
  const db = await getDb();
  const existing = await db
    .collection('kulup_programlari')
    .getFirstListItem(`legacyId = ${programId} && kulupLegacyId = ${clubId}`)
    .catch(() => null);
  if (!existing) return false;
  await db.collection('kulup_programlari').delete(existing.id);
  return true;
}
