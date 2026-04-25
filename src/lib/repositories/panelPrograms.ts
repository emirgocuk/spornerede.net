import { getDb, hasDatabaseUrl } from '../../db/client';
import { getUserPrimaryClub } from './auth';
import { parseProgramContent, serializeProgramContent } from './programContent';

export type ProgramPayload = {
  ad: string;
  aciklama?: string;
  gunSaat?: string;
  seviye?: string;
  ucretBilgisi?: string;
  aktif?: boolean;
  eventDate?: string;
  locationText?: string;
  gallery?: string[];
  bodyJson?: unknown | null;
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
  return rows.map((row) => {
    const parsed = parseProgramContent((row.aciklama as string) ?? '');
    return {
      id: Number(row.legacyId),
      ad: row.ad as string,
      aciklama: parsed.content.summary || parsed.legacyText || '',
      gunSaat: (row.gunSaat as string) ?? '',
      seviye: (row.seviye as string) ?? '',
      ucretBilgisi: (row.ucretBilgisi as string) ?? '',
      aktif: Boolean(row.aktif),
      eventDate: parsed.content.eventDate,
      locationText: parsed.content.locationText,
      gallery: parsed.content.gallery,
      bodyJson: parsed.content.bodyJson,
      createdAt: row.created,
      updatedAt: row.updated,
    };
  });
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
    aciklama: serializeProgramContent({
      summary: payload.aciklama?.trim() ?? '',
      eventDate: payload.eventDate ?? '',
      locationText: payload.locationText ?? '',
      gallery: payload.gallery ?? [],
      bodyJson: payload.bodyJson ?? null,
    }),
    gunSaat: payload.gunSaat?.trim() ?? '',
    seviye: payload.seviye?.trim() ?? '',
    ucretBilgisi: payload.ucretBilgisi?.trim() ?? '',
    aktif: payload.aktif ?? true,
  });
  return {
    id: Number(row.legacyId),
    ad: row.ad as string,
    aciklama: payload.aciklama?.trim() ?? '',
    gunSaat: (row.gunSaat as string) ?? '',
    seviye: (row.seviye as string) ?? '',
    ucretBilgisi: (row.ucretBilgisi as string) ?? '',
    aktif: Boolean(row.aktif),
    eventDate: payload.eventDate?.trim() ?? '',
    locationText: payload.locationText?.trim() ?? '',
    gallery: payload.gallery ?? [],
    bodyJson: payload.bodyJson ?? null,
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
    aciklama: serializeProgramContent({
      summary: payload.aciklama?.trim() ?? '',
      eventDate: payload.eventDate ?? '',
      locationText: payload.locationText ?? '',
      gallery: payload.gallery ?? [],
      bodyJson: payload.bodyJson ?? null,
    }),
    gunSaat: payload.gunSaat?.trim() ?? '',
    seviye: payload.seviye?.trim() ?? '',
    ucretBilgisi: payload.ucretBilgisi?.trim() ?? '',
    aktif: payload.aktif ?? true,
  });
  return {
    id: Number(row.legacyId),
    ad: row.ad as string,
    aciklama: payload.aciklama?.trim() ?? '',
    gunSaat: (row.gunSaat as string) ?? '',
    seviye: (row.seviye as string) ?? '',
    ucretBilgisi: (row.ucretBilgisi as string) ?? '',
    aktif: Boolean(row.aktif),
    eventDate: payload.eventDate?.trim() ?? '',
    locationText: payload.locationText?.trim() ?? '',
    gallery: payload.gallery ?? [],
    bodyJson: payload.bodyJson ?? null,
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
