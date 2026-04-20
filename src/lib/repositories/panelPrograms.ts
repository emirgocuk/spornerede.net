import { and, desc, eq } from 'drizzle-orm';
import { getDb, hasDatabaseUrl } from '../../db/client';
import { kulupProgramlari } from '../../db/schema';
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
  const db = getDb();
  return db
    .select({
      id: kulupProgramlari.id,
      ad: kulupProgramlari.ad,
      aciklama: kulupProgramlari.aciklama,
      gunSaat: kulupProgramlari.gunSaat,
      seviye: kulupProgramlari.seviye,
      ucretBilgisi: kulupProgramlari.ucretBilgisi,
      aktif: kulupProgramlari.aktif,
      createdAt: kulupProgramlari.createdAt,
      updatedAt: kulupProgramlari.updatedAt,
    })
    .from(kulupProgramlari)
    .where(eq(kulupProgramlari.kulupId, clubId))
    .orderBy(desc(kulupProgramlari.createdAt));
}

export async function createPanelProgram(userId: number, payload: ProgramPayload) {
  if (!hasDatabaseUrl()) {
    throw new Error('DATABASE_URL is not configured.');
  }
  const clubId = await resolveClubId(userId);
  const db = getDb();
  const [row] = await db
    .insert(kulupProgramlari)
    .values({
      kulupId: clubId,
      ad: payload.ad.trim(),
      aciklama: payload.aciklama?.trim() ?? '',
      gunSaat: payload.gunSaat?.trim() ?? '',
      seviye: payload.seviye?.trim() ?? '',
      ucretBilgisi: payload.ucretBilgisi?.trim() ?? '',
      aktif: payload.aktif ?? true,
    })
    .returning({
      id: kulupProgramlari.id,
      ad: kulupProgramlari.ad,
      aciklama: kulupProgramlari.aciklama,
      gunSaat: kulupProgramlari.gunSaat,
      seviye: kulupProgramlari.seviye,
      ucretBilgisi: kulupProgramlari.ucretBilgisi,
      aktif: kulupProgramlari.aktif,
    });
  return row;
}

export async function updatePanelProgram(userId: number, programId: number, payload: ProgramPayload) {
  if (!hasDatabaseUrl()) {
    throw new Error('DATABASE_URL is not configured.');
  }
  const clubId = await resolveClubId(userId);
  const db = getDb();
  const [row] = await db
    .update(kulupProgramlari)
    .set({
      ad: payload.ad.trim(),
      aciklama: payload.aciklama?.trim() ?? '',
      gunSaat: payload.gunSaat?.trim() ?? '',
      seviye: payload.seviye?.trim() ?? '',
      ucretBilgisi: payload.ucretBilgisi?.trim() ?? '',
      aktif: payload.aktif ?? true,
      updatedAt: new Date(),
    })
    .where(and(eq(kulupProgramlari.id, programId), eq(kulupProgramlari.kulupId, clubId)))
    .returning({
      id: kulupProgramlari.id,
      ad: kulupProgramlari.ad,
      aciklama: kulupProgramlari.aciklama,
      gunSaat: kulupProgramlari.gunSaat,
      seviye: kulupProgramlari.seviye,
      ucretBilgisi: kulupProgramlari.ucretBilgisi,
      aktif: kulupProgramlari.aktif,
    });
  return row ?? null;
}

export async function deletePanelProgram(userId: number, programId: number) {
  if (!hasDatabaseUrl()) {
    throw new Error('DATABASE_URL is not configured.');
  }
  const clubId = await resolveClubId(userId);
  const db = getDb();
  const deleted = await db
    .delete(kulupProgramlari)
    .where(and(eq(kulupProgramlari.id, programId), eq(kulupProgramlari.kulupId, clubId)))
    .returning({ id: kulupProgramlari.id });
  return deleted.length > 0;
}
