import { getDb, hasDatabaseUrl } from '../../db/client';
import { displayIlAd } from '../turkishIlDisplay';
import { parseProgramContent, serializeProgramContent } from './programContent';

function requireDatabase() {
  if (!hasDatabaseUrl()) {
    throw new Error('POCKETBASE_URL is not configured.');
  }
}

export async function listApprovedAdminClubs() {
  requireDatabase();
  const db = await getDb();
  const [rows, cities, districts] = await Promise.all([
    db.collection('kulupler').getList(1, 200, {
      filter: 'durum = "approved"',
      sort: '-legacyId',
    }),
    db.collection('iller').getFullList(),
    db.collection('ilceler').getFullList(),
  ]);

  const cityById = new Map(cities.map((row) => [Number(row.legacyId), row]));
  const districtMap = new Map(districts.map((row) => [Number(row.legacyId), row.ad as string]));

  return rows.items.map((row) => {
    const city = cityById.get(Number(row.ilLegacyId));
    return {
    id: Number(row.legacyId),
    ad: row.ad as string,
    il: city ? displayIlAd(String(city.slug), String(city.ad)) : '',
    ilce: districtMap.get(Number(row.ilceLegacyId)) ?? '',
    telefon: (row.telefon as string) ?? '',
    email: (row.email as string) ?? '',
    updatedAt: row.updated,
  };
  });
}

export async function getApprovedAdminClubById(clubId: number) {
  requireDatabase();
  const db = await getDb();

  const row = await db
    .collection('kulupler')
    .getFirstListItem(`legacyId = ${clubId} && durum = "approved"`)
    .catch(() => null);
  if (!row) return null;

  const [city, district, programs] = await Promise.all([
    db.collection('iller').getFirstListItem(`legacyId = ${Number(row.ilLegacyId)}`).catch(() => null),
    db.collection('ilceler').getFirstListItem(`legacyId = ${Number(row.ilceLegacyId)}`).catch(() => null),
    db.collection('kulup_programlari').getFullList({
      filter: `kulupLegacyId = ${clubId}`,
      sort: '-legacyId',
    }),
  ]);

  return {
    id: Number(row.legacyId),
    ad: row.ad as string,
    il: displayIlAd(city?.slug as string | undefined, city?.ad as string | undefined),
    ilce: (district?.ad as string | undefined) ?? '',
    telefon: (row.telefon as string) ?? '',
    email: (row.email as string) ?? '',
    adres: (row.adres as string) ?? '',
    aciklama: (row.aciklama as string) ?? '',
    yasAraligi: (row.yasAraligi as string) ?? '',
    fiyatBilgisi: (row.fiyatBilgisi as string) ?? '',
    updatedAt: row.updated,
    programs: programs.map((program) => {
      const parsed = parseProgramContent((program.aciklama as string) ?? '');
      return {
        id: Number(program.legacyId),
        ad: (program.ad as string) ?? '',
        aciklama: parsed.content.summary || parsed.legacyText || '',
        gunSaat: (program.gunSaat as string) ?? '',
        seviye: (program.seviye as string) ?? '',
        ucretBilgisi: (program.ucretBilgisi as string) ?? '',
        aktif: Boolean(program.aktif),
        eventDate: parsed.content.eventDate,
        locationText: parsed.content.locationText,
        gallery: parsed.content.gallery,
        bodyJson: parsed.content.bodyJson,
        updatedAt: program.updated,
      };
    }),
  };
}

export type UpdateApprovedClubInput = {
  ad: string;
  telefon: string;
  email: string;
  adres: string;
  aciklama: string;
  yasAraligi: string;
  fiyatBilgisi: string;
};

export async function updateApprovedAdminClub(clubId: number, input: UpdateApprovedClubInput) {
  requireDatabase();
  const db = await getDb();

  const row = await db
    .collection('kulupler')
    .getFirstListItem(`legacyId = ${clubId} && durum = "approved"`)
    .catch(() => null);
  if (!row) {
    return null;
  }

  const updated = await db.collection('kulupler').update(row.id, {
    ad: input.ad.trim(),
    telefon: input.telefon.trim(),
    email: input.email.trim(),
    adres: input.adres.trim(),
    aciklama: input.aciklama.trim(),
    yasAraligi: input.yasAraligi.trim(),
    fiyatBilgisi: input.fiyatBilgisi.trim(),
  });

  return {
    id: Number(updated.legacyId),
    ad: updated.ad as string,
    telefon: (updated.telefon as string) ?? '',
    email: (updated.email as string) ?? '',
    adres: (updated.adres as string) ?? '',
    aciklama: (updated.aciklama as string) ?? '',
    yasAraligi: (updated.yasAraligi as string) ?? '',
    fiyatBilgisi: (updated.fiyatBilgisi as string) ?? '',
    updatedAt: updated.updated,
  };
}

export type UpdateAdminClubProgramInput = {
  ad: string;
  aciklama: string;
  gunSaat: string;
  seviye: string;
  ucretBilgisi: string;
  aktif: boolean;
  eventDate?: string;
  locationText?: string;
  gallery?: string[];
  bodyJson?: unknown | null;
};

export async function updateAdminClubProgram(clubId: number, programId: number, input: UpdateAdminClubProgramInput) {
  requireDatabase();
  const db = await getDb();

  const program = await db
    .collection('kulup_programlari')
    .getFirstListItem(`legacyId = ${programId} && kulupLegacyId = ${clubId}`)
    .catch(() => null);
  if (!program) {
    return null;
  }

  const currentParsed = parseProgramContent((program.aciklama as string) ?? '');
  const updated = await db.collection('kulup_programlari').update(program.id, {
    ad: input.ad.trim(),
    aciklama: serializeProgramContent({
      summary: input.aciklama.trim(),
      eventDate: input.eventDate ?? currentParsed.content.eventDate,
      locationText: input.locationText ?? currentParsed.content.locationText,
      gallery: input.gallery ?? currentParsed.content.gallery,
      bodyJson: input.bodyJson ?? currentParsed.content.bodyJson,
    }),
    gunSaat: input.gunSaat.trim(),
    seviye: input.seviye.trim(),
    ucretBilgisi: input.ucretBilgisi.trim(),
    aktif: input.aktif,
  });
  const parsed = parseProgramContent((updated.aciklama as string) ?? '');

  return {
    id: Number(updated.legacyId),
    ad: (updated.ad as string) ?? '',
    aciklama: parsed.content.summary || parsed.legacyText || '',
    gunSaat: (updated.gunSaat as string) ?? '',
    seviye: (updated.seviye as string) ?? '',
    ucretBilgisi: (updated.ucretBilgisi as string) ?? '',
    aktif: Boolean(updated.aktif),
    eventDate: parsed.content.eventDate,
    locationText: parsed.content.locationText,
    gallery: parsed.content.gallery,
    bodyJson: parsed.content.bodyJson,
    updatedAt: updated.updated,
  };
}

/** Onaylı kulübü vitrinden kaldırır (durum: rejected, üyelik süresi sonlandırılır). */
export async function revokeApprovedAdminClub(clubId: number, adminNote?: string) {
  requireDatabase();
  const db = await getDb();

  const row = await db
    .collection('kulupler')
    .getFirstListItem(`legacyId = ${clubId} && durum = "approved"`)
    .catch(() => null);
  if (!row) return null;

  const note = adminNote?.trim() || 'Onaylı listeden kaldırıldı.';
  const updated = await db.collection('kulupler').update(row.id, {
    durum: 'rejected',
    adminNotu: note.slice(0, 5000),
  });

  const membership = await db
    .collection('kulup_uyelikleri')
    .getFirstListItem(`kulupLegacyId = ${clubId}`, { sort: '-legacyId' })
    .catch(() => null);
  if (membership && membership.odemeDurumu === 'paid') {
    await db.collection('kulup_uyelikleri').update(membership.id, { odemeDurumu: 'expired' }).catch(() => undefined);
  }

  await db.collection('admin_basvuru_loglari').create({
    legacyId: Date.now(),
    basvuruLegacyId: clubId,
    aksiyon: 'club_revoked',
    oncekiDurum: 'approved',
    yeniDurum: 'rejected',
    notMetni: note,
    atananAdminEmail: (row.sorumluAdminEmail as string) ?? '',
    islemYapanEmail: '',
  });

  return {
    id: Number(updated.legacyId),
    status: 'rejected' as const,
  };
}

export async function deleteAdminClubProgram(clubId: number, programId: number) {
  requireDatabase();
  const db = await getDb();

  const program = await db
    .collection('kulup_programlari')
    .getFirstListItem(`legacyId = ${programId} && kulupLegacyId = ${clubId}`)
    .catch(() => null);
  if (!program) {
    return false;
  }

  await db.collection('kulup_programlari').delete(program.id);
  return true;
}
