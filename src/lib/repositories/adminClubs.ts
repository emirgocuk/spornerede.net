import { getDb, hasDatabaseUrl } from '../../db/client';
import { displayIlAd } from '../turkishIlDisplay';
import { linkClubBranch } from './applicationPrograms';
import {
  formatMembershipPackageLabel,
  membershipPeriodFromPackageCode,
  syncClubMembershipPeriod,
  type MembershipPeriod,
} from './memberships';
import type { ProgramPayload } from './panelPrograms';
import { parseProgramContent, serializeProgramContent } from './programContent';

function slugify(input: string) {
  return input
    .toLowerCase()
    .replaceAll(' ', '-')
    .replaceAll('.', '')
    .replaceAll(',', '')
    .replaceAll("'", '')
    .replaceAll('ı', 'i')
    .replaceAll('ğ', 'g')
    .replaceAll('ü', 'u')
    .replaceAll('ş', 's')
    .replaceAll('ö', 'o')
    .replaceAll('ç', 'c');
}

function serializeProgramPayload(payload: ProgramPayload) {
  return serializeProgramContent({
    summary: '',
    eventDate: '',
    endDate: '',
    isOngoing: false,
    days: [],
    startTime: '',
    endTime: '',
    locationText: '',
    mapsUrl: '',
    yasAraligi: payload.yasAraligi?.trim() ?? '',
    gallery: [],
    bodyJson: null,
  });
}

function mapProgramRow(row: { legacyId: unknown; ad: unknown; aciklama: unknown; gunSaat: unknown; seviye: unknown; ucretBilgisi: unknown; aktif: unknown; updated: string }) {
  const parsed = parseProgramContent((row.aciklama as string) ?? '');
  return {
    id: Number(row.legacyId),
    ad: (row.ad as string) ?? '',
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
    yasAraligi: parsed.content.yasAraligi,
    aidatBilgisi: (row.ucretBilgisi as string) ?? '',
    gallery: parsed.content.gallery,
    bodyJson: parsed.content.bodyJson,
    updatedAt: row.updated,
  };
}

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

  const [city, district, programs, membership, clubUserLinks] = await Promise.all([
    db.collection('iller').getFirstListItem(`legacyId = ${Number(row.ilLegacyId)}`).catch(() => null),
    db.collection('ilceler').getFirstListItem(`legacyId = ${Number(row.ilceLegacyId)}`).catch(() => null),
    db.collection('kulup_programlari').getFullList({
      filter: `kulupLegacyId = ${clubId}`,
      sort: '-legacyId',
    }),
    db
      .collection('kulup_uyelikleri')
      .getFirstListItem(`kulupLegacyId = ${clubId}`, { sort: '-legacyId' })
      .catch(() => null),
    db.collection('kulup_uyelik_kullanicilari').getFullList({ filter: `kulupLegacyId = ${clubId}` }).catch(() => []),
  ]);

  let paketKod = '';
  let paketAd = '';
  if (membership?.paketLegacyId) {
    const plan = await db
      .collection('uyelik_paketleri')
      .getFirstListItem(`legacyId = ${Number(membership.paketLegacyId)}`)
      .catch(() => null);
    paketKod = (plan?.kod as string) ?? '';
    paketAd = (plan?.ad as string) ?? '';
  }

  const linkedUsers = [];
  for (const link of clubUserLinks) {
    const user = await db
      .collection('kullanicilar')
      .getFirstListItem(`legacyId = ${Number(link.kullaniciLegacyId)}`)
      .catch(() => null);
    if (!user) continue;
    linkedUsers.push({
      email: (user.email as string) ?? '',
      rol: (link.rol as string) ?? 'staff',
      aktif: Boolean(user.aktif),
    });
  }

  const bransSayisiRaw = row.bransSayisi as number | undefined;
  const bransSayisi = Number.isFinite(bransSayisiRaw) && bransSayisiRaw > 0 ? Math.floor(bransSayisiRaw) : 1;

  return {
    id: Number(row.legacyId),
    ad: row.ad as string,
    il: displayIlAd(city?.slug as string | undefined, city?.ad as string | undefined),
    ilSlug: (city?.slug as string) ?? '',
    ilce: (district?.ad as string | undefined) ?? '',
    ilceSlug: (district?.slug as string) ?? '',
    telefon: (row.telefon as string) ?? '',
    email: (row.email as string) ?? '',
    adres: (row.adres as string) ?? '',
    aciklama: (row.aciklama as string) ?? '',
    yasAraligi: (row.yasAraligi as string) ?? '',
    fiyatBilgisi: (row.fiyatBilgisi as string) ?? '',
    adminNotu: (row.adminNotu as string) ?? '',
    sorumluAdminEmail: (row.sorumluAdminEmail as string) ?? '',
    paketKod,
    paketAd,
    paketLabel: formatMembershipPackageLabel(paketKod, paketAd),
    bransSayisi,
    membershipPeriod: membershipPeriodFromPackageCode(paketKod) ?? 'six_month',
    linkedUsers,
    updatedAt: row.updated,
    programs: programs.map((program) => mapProgramRow(program)),
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
  adminNotu?: string;
  sorumluAdminEmail?: string;
  il?: string;
  ilce?: string;
  membershipPeriod?: MembershipPeriod;
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

  const patch: Record<string, unknown> = {
    ad: input.ad.trim(),
    telefon: input.telefon.trim(),
    email: input.email.trim(),
    adres: input.adres.trim(),
    aciklama: input.aciklama.trim(),
    yasAraligi: input.yasAraligi.trim(),
    fiyatBilgisi: input.fiyatBilgisi.trim(),
    ...(input.adminNotu !== undefined ? { adminNotu: input.adminNotu.trim().slice(0, 5000) } : {}),
    ...(input.sorumluAdminEmail !== undefined
      ? { sorumluAdminEmail: input.sorumluAdminEmail.trim().slice(0, 180) }
      : {}),
  };

  if (input.il?.trim()) {
    const city = await db.collection('iller').getFirstListItem(`slug = "${slugify(input.il)}"`).catch(() => null);
    if (city) {
      patch.ilLegacyId = Number(city.legacyId);
      if (input.ilce?.trim()) {
        const district = await db
          .collection('ilceler')
          .getFirstListItem(`ilLegacyId = ${Number(city.legacyId)} && slug = "${slugify(input.ilce)}"`)
          .catch(() => null);
        if (district) {
          patch.ilceLegacyId = Number(district.legacyId);
        }
      }
    }
  }

  const updated = await db.collection('kulupler').update(row.id, patch);

  if (input.membershipPeriod) {
    await syncClubMembershipPeriod(clubId, input.membershipPeriod);
  }

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

export async function createAdminClubProgram(clubId: number, payload: ProgramPayload) {
  requireDatabase();
  const db = await getDb();

  const club = await db
    .collection('kulupler')
    .getFirstListItem(`legacyId = ${clubId} && durum = "approved"`)
    .catch(() => null);
  if (!club) return null;

  const ad = payload.ad.trim() || 'İlan';

  const row = await db.collection('kulup_programlari').create({
    legacyId: Date.now(),
    kulupLegacyId: clubId,
    ad,
    aciklama: serializeProgramPayload(payload),
    gunSaat: payload.gunSaat?.trim() ?? '',
    seviye: payload.seviye?.trim() ?? '',
    ucretBilgisi: payload.ucretBilgisi?.trim() ?? '',
    aktif: payload.aktif ?? true,
  });
  await linkClubBranch(db, clubId, ad).catch(() => undefined);
  return mapProgramRow(row);
}

export async function updateAdminClubProgram(clubId: number, programId: number, payload: ProgramPayload) {
  requireDatabase();
  const db = await getDb();

  const program = await db
    .collection('kulup_programlari')
    .getFirstListItem(`legacyId = ${programId} && kulupLegacyId = ${clubId}`)
    .catch(() => null);
  if (!program) {
    return null;
  }

  const ad = payload.ad.trim() || 'İlan';
  const updated = await db.collection('kulup_programlari').update(program.id, {
    ad,
    aciklama: serializeProgramPayload(payload),
    gunSaat: payload.gunSaat?.trim() ?? '',
    seviye: payload.seviye?.trim() ?? '',
    ucretBilgisi: payload.ucretBilgisi?.trim() ?? '',
    aktif: payload.aktif ?? true,
  });
  await linkClubBranch(db, clubId, ad).catch(() => undefined);
  return mapProgramRow(updated);
}

/** Onayı geri çeker; kulüp başvurular listesine (pending) döner. */
export async function withdrawClubApproval(clubId: number, adminNote?: string) {
  requireDatabase();
  const db = await getDb();

  const row = await db
    .collection('kulupler')
    .getFirstListItem(`legacyId = ${clubId} && durum = "approved"`)
    .catch(() => null);
  if (!row) return null;

  const note = adminNote?.trim() || 'Onay geri çekildi; başvuru yeniden incelenecek.';
  const updated = await db.collection('kulupler').update(row.id, {
    durum: 'pending',
    adminNotu: note.slice(0, 5000),
  });

  await db.collection('admin_basvuru_loglari').create({
    legacyId: Date.now(),
    basvuruLegacyId: clubId,
    aksiyon: 'club_approval_withdrawn',
    oncekiDurum: 'approved',
    yeniDurum: 'pending',
    notMetni: note,
    atananAdminEmail: (row.sorumluAdminEmail as string) ?? '',
    islemYapanEmail: '',
  });

  return {
    id: Number(updated.legacyId),
    status: 'pending' as const,
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
