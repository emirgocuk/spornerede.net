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
  endDate?: string;
  isOngoing?: boolean;
  days?: string[];
  startTime?: string;
  endTime?: string;
  locationText?: string;
  mapsUrl?: string;
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
      endDate: parsed.content.endDate,
      isOngoing: parsed.content.isOngoing,
      days: parsed.content.days,
      startTime: parsed.content.startTime,
      endTime: parsed.content.endTime,
      locationText: parsed.content.locationText,
      mapsUrl: parsed.content.mapsUrl,
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
      endDate: payload.endDate ?? '',
      isOngoing: payload.isOngoing ?? false,
      days: payload.days ?? [],
      startTime: payload.startTime ?? '',
      endTime: payload.endTime ?? '',
      locationText: payload.locationText ?? '',
      mapsUrl: payload.mapsUrl ?? '',
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
    endDate: payload.endDate?.trim() ?? '',
    isOngoing: payload.isOngoing ?? false,
    days: payload.days ?? [],
    startTime: payload.startTime?.trim() ?? '',
    endTime: payload.endTime?.trim() ?? '',
    locationText: payload.locationText?.trim() ?? '',
    mapsUrl: payload.mapsUrl?.trim() ?? '',
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
      endDate: payload.endDate ?? '',
      isOngoing: payload.isOngoing ?? false,
      days: payload.days ?? [],
      startTime: payload.startTime ?? '',
      endTime: payload.endTime ?? '',
      locationText: payload.locationText ?? '',
      mapsUrl: payload.mapsUrl ?? '',
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
    endDate: payload.endDate?.trim() ?? '',
    isOngoing: payload.isOngoing ?? false,
    days: payload.days ?? [],
    startTime: payload.startTime?.trim() ?? '',
    endTime: payload.endTime?.trim() ?? '',
    locationText: payload.locationText?.trim() ?? '',
    mapsUrl: payload.mapsUrl?.trim() ?? '',
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
