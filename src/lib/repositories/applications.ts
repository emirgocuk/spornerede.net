import fs from 'node:fs/promises';
import path from 'node:path';
import { getDb, hasDatabaseUrl } from '../../db/client';
import { plateCodeFromIlSlug } from '../trIlPlateBySlug';
import { displayIlAd } from '../turkishIlDisplay';
import { listApplicationDocuments } from './applicationDocuments';
import {
  activateClubMembership,
  formatMembershipPackageLabel,
  membershipPeriodFromPackageCode,
  normalizeMembershipPeriod,
  syncClubMembershipPeriod,
  type MembershipPeriod,
} from './memberships';
import {
  createProgramsFromApplication,
  listApplicationPrograms,
  setClubProgramsPublication,
  updateApplicationProgram,
  type BasvuruIlanInput,
} from './applicationPrograms';

export type { BasvuruIlanInput };

export type ClubApplicationInput = {
  kulupad: string;
  il: string;
  ilce: string;
  adres?: string;
  yasaraligi?: string;
  fiyat?: string;
  aciklama?: string;
  yetkili: string;
  telefon: string;
  email: string;
  paket?: string;
  bransSayisi?: number;
  ilanlar: BasvuruIlanInput[];
};

export type AdminApplicationUpdateInput = {
  ad: string;
  ilSlug: string;
  ilceSlug: string;
  adres?: string;
  telefon?: string;
  email?: string;
  aciklama?: string;
  ilanlar: { id: number; brans: string; yasAraligi?: string; aidatBilgisi?: string }[];
};

function requireDatabase() {
  if (!hasDatabaseUrl()) {
    throw new Error('POCKETBASE_URL is not configured.');
  }
}

function slugify(input: string) {
  return String(input ?? '')
    .trim()
    .toLocaleLowerCase('tr-TR')
    .replace(/ğ/g, 'g')
    .replace(/ü/g, 'u')
    .replace(/ş/g, 's')
    .replace(/ı/g, 'i')
    .replace(/ö/g, 'o')
    .replace(/ç/g, 'c')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

function escapePbFilter(value: string) {
  return String(value ?? '').replace(/\\/g, '\\\\').replace(/"/g, '\\"');
}

async function findCityByInput(db: Awaited<ReturnType<typeof getDb>>, input: string) {
  const normalized = slugify(input);
  const candidates = [...new Set([String(input ?? '').trim(), normalized].filter(Boolean))];
  for (const candidate of candidates) {
    const city = await db.collection('iller').getFirstListItem(`slug = "${escapePbFilter(candidate)}"`).catch(() => null);
    if (city) return city;
  }

  const allCities = await db.collection('iller').getFullList({ sort: 'ad' });
  return (
    allCities.find((row) => slugify(String(row.slug ?? '')) === normalized) ??
    allCities.find((row) => slugify(String(row.ad ?? '')) === normalized) ??
    allCities.find((row) => slugify(displayIlAd(row.slug as string | undefined, row.ad as string | undefined)) === normalized) ??
    null
  );
}

async function findDistrictByInput(
  db: Awaited<ReturnType<typeof getDb>>,
  city: Record<string, unknown>,
  districtInput: string,
) {
  const normalized = slugify(districtInput);
  const cityLegacyId = Number(city.legacyId);
  const plate = plateCodeFromIlSlug(slugify(String(city.slug ?? '')));

  const candidateCityIds = [...new Set([cityLegacyId, plate].filter((value): value is number => Number.isFinite(value)))];
  for (const ilLegacyId of candidateCityIds) {
    const district = await db
      .collection('ilceler')
      .getFirstListItem(`ilLegacyId = ${ilLegacyId} && slug = "${escapePbFilter(normalized)}"`)
      .catch(() => null);
    if (district) return district;
  }

  const allDistricts = await db.collection('ilceler').getFullList({ sort: 'ad' });
  return (
    allDistricts.find(
      (row) =>
        candidateCityIds.includes(Number(row.ilLegacyId)) &&
        (slugify(String(row.slug ?? '')) === normalized || slugify(String(row.ad ?? '')) === normalized),
    ) ?? null
  );
}

/** kulupler.slug unique — reddedilmiş veya bekleyen kayıt varken aynı ada tekrar başvuruda çakışmayı önler. */
async function resolveUniqueClubSlug(
  db: Awaited<ReturnType<typeof getDb>>,
  clubName: string,
  legacyId: number,
  options?: { excludeLegacyId?: number },
) {
  const base = slugify(clubName) || `kulup-${legacyId}`;
  const candidates = [base, `${base}-${legacyId}`];
  for (let n = 2; n < 50; n++) {
    candidates.push(`${base}-${n}`);
  }
  for (const candidate of candidates) {
    const existing = await db.collection('kulupler').getFirstListItem(`slug = "${candidate}"`).catch(() => null);
    if (!existing) return candidate;
    if (options?.excludeLegacyId != null && Number(existing.legacyId) === options.excludeLegacyId) {
      return candidate;
    }
  }
  return `${base}-${legacyId}`;
}

const DEFAULT_MEMBERSHIP_PLANS = [
  {
    kod: 'aylik',
    ad: 'Aylık',
    ucret: 1500,
    periyot: 'monthly' as const,
    aciklama: 'Aylık paket: 1500 TL.',
  },
  {
    kod: 'alti-aylik',
    ad: '6 Aylık',
    ucret: 3000,
    periyot: 'one_time' as const,
    aciklama: '6 aylık paket: 3000 TL.',
  },
  {
    kod: 'on-iki-aylik',
    ad: 'Yıllık',
    ucret: 5000,
    periyot: 'yearly' as const,
    aciklama: 'Yıllık paket: 5000 TL.',
  },
];

export async function createClubApplication(input: ClubApplicationInput) {
  requireDatabase();

  const db = await getDb();

  const city = await findCityByInput(db, input.il);
  if (!city) {
    throw new Error('Secilen il sistemde bulunamadi.');
  }

  const district = await findDistrictByInput(db, city, input.ilce);
  if (!district) {
    throw new Error('Secilen ilce sistemde bulunamadi.');
  }

  const bransSayisi = Number.isFinite(input.bransSayisi)
    ? Math.max(1, Math.floor(Number(input.bransSayisi)))
    : 1;

  const legacyId = Date.now();
  const slug = await resolveUniqueClubSlug(db, input.kulupad, legacyId);

  const clubPayload: Record<string, unknown> = {
    legacyId,
    ad: input.kulupad,
    slug,
    ilLegacyId: Number(city.legacyId),
    ilceLegacyId: Number(district.legacyId),
    adres: input.adres ?? '',
    yasAraligi: input.yasaraligi ?? '',
    fiyatBilgisi: input.fiyat ?? '',
    telefon: input.telefon,
    email: input.email,
    aciklama: input.aciklama ?? '',
    durum: 'pending',
    sorumluAdminEmail: '',
    adminNotu: '',
    oneCikan: false,
    puan: 0,
    yorumSayisi: 0,
    bransSayisi,
  };

  let club;
  try {
    club = await db.collection('kulupler').create(clubPayload);
  } catch {
    delete clubPayload.bransSayisi;
    club = await db.collection('kulupler').create(clubPayload);
  }

  const ilanlar = Array.isArray(input.ilanlar) ? input.ilanlar.filter((i) => i.brans?.trim()) : [];
  if (!ilanlar.length) {
    throw new Error('En az bir branş ilanı zorunlu.');
  }

  await createProgramsFromApplication(Number(club.legacyId), ilanlar);
  await syncClubMembershipPeriod(Number(club.legacyId), normalizeMembershipPeriod(input.paket)).catch(() => undefined);

  await db.collection('admin_basvuru_loglari').create({
    legacyId: Date.now() + 3,
    basvuruLegacyId: Number(club.legacyId),
    aksiyon: 'application_created',
    yeniDurum: 'pending',
    islemYapanEmail: input.email,
    notMetni: 'Kulup basvurusu olusturuldu.',
    atananAdminEmail: '',
    oncekiDurum: null,
  });

  return { id: Number(club.legacyId), mode: 'db' as const };
}

export async function listAdminApplications() {
  requireDatabase();
  const db = await getDb();
  const [rows, cities, districts] = await Promise.all([
    db.collection('kulupler').getList(1, 100, {
      filter: 'durum != "approved"',
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
    durum: row.durum as 'pending' | 'approved' | 'rejected',
    createdAt: row.created,
    telefon: row.telefon as string,
    sorumluAdminEmail: (row.sorumluAdminEmail as string) ?? '',
  };
  });
}

export async function getAdminApplicationById(id: number) {
  requireDatabase();

  const db = await getDb();
  const row = await db.collection('kulupler').getFirstListItem(`legacyId = ${id}`).catch(() => null);
  if (!row) return null;
  const [city, district] = await Promise.all([
    db.collection('iller').getFirstListItem(`legacyId = ${Number(row.ilLegacyId)}`).catch(() => null),
    db.collection('ilceler').getFirstListItem(`legacyId = ${Number(row.ilceLegacyId)}`).catch(() => null),
  ]);

  const approvalLog = await db
    .collection('admin_basvuru_loglari')
    .getFirstListItem(`basvuruLegacyId = ${id} && yeniDurum = "approved"`, { sort: '-legacyId' })
    .catch(() => null);

  const bransSayisiRaw = row.bransSayisi as number | undefined;
  const bransSayisi = Number.isFinite(bransSayisiRaw) && bransSayisiRaw > 0 ? Math.floor(bransSayisiRaw) : 1;

  return {
    id: Number(row.legacyId),
    ad: row.ad as string,
    il: displayIlAd(city?.slug as string | undefined, city?.ad as string | undefined),
    ilce: (district?.ad as string | undefined) ?? '',
    durum: row.durum as 'pending' | 'approved' | 'rejected',
    createdAt: row.created,
    updatedAt: row.updated,
    approvedAt: (approvalLog?.created as string) || (row.durum === 'approved' ? (row.updated as string) : null),
    telefon: row.telefon as string,
    email: row.email as string,
    adres: row.adres as string,
    aciklama: row.aciklama as string,
    adminNotu: (row.adminNotu as string) ?? '',
    sorumluAdminEmail: (row.sorumluAdminEmail as string) ?? '',
    paketKod: 'free',
    paketAd: 'Ücretsiz Sınırsız Üyelik',
    paketLabel: 'Ücretsiz Sınırsız Üyelik',
    bransSayisi,
    ilSlug: (city?.slug as string) ?? '',
    ilceSlug: (district?.slug as string) ?? '',
    ilanlar: await listApplicationPrograms(id),
  };
}

function buildClubYasAraligiFromIlanlar(ilanlar: BasvuruIlanInput[]) {
  const unique = [...new Set(ilanlar.map((item) => item.yasAraligi?.trim()).filter(Boolean))] as string[];
  return unique.join(' · ').slice(0, 50);
}

export async function updateAdminApplicationFields(id: number, input: AdminApplicationUpdateInput) {
  requireDatabase();
  const db = await getDb();
  const before = await db.collection('kulupler').getFirstListItem(`legacyId = ${id}`).catch(() => null);
  if (!before || before.durum === 'approved') {
    return null;
  }

  const city = await findCityByInput(db, input.ilSlug);
  if (!city) {
    throw new Error('Secilen il sistemde bulunamadi.');
  }

  const district = await findDistrictByInput(db, city, input.ilceSlug);
  if (!district) {
    throw new Error('Secilen ilce sistemde bulunamadi.');
  }

  const ilanlar: BasvuruIlanInput[] = (input.ilanlar || [])
    .filter((item) => item.brans?.trim())
    .map((item) => ({
      brans: item.brans.trim(),
      ...(item.yasAraligi?.trim() ? { yasAraligi: item.yasAraligi.trim() } : {}),
      ...(item.aidatBilgisi?.trim() ? { aidatBilgisi: item.aidatBilgisi.trim() } : {}),
    }));

  const slug = await resolveUniqueClubSlug(db, input.ad, id, { excludeLegacyId: id });

  await db.collection('kulupler').update(before.id, {
    ad: input.ad.trim().slice(0, 180),
    slug,
    ilLegacyId: Number(city.legacyId),
    ilceLegacyId: Number(district.legacyId),
    adres: input.adres?.trim() ?? '',
    telefon: input.telefon?.trim() ?? '',
    email: input.email?.trim() ?? '',
    aciklama: input.aciklama?.trim() ?? '',
    yasAraligi: buildClubYasAraligiFromIlanlar(ilanlar),
    bransSayisi: Math.max(1, ilanlar.length),
  });

  for (const ilan of input.ilanlar || []) {
    if (!ilan.id || !ilan.brans?.trim()) continue;
    await updateApplicationProgram(id, ilan.id, {
      brans: ilan.brans,
      yasAraligi: ilan.yasAraligi,
      aidatBilgisi: ilan.aidatBilgisi,
    });
  }

  return getAdminApplicationById(id);
}

export async function updateApplicationStatus(
  id: number,
  status: 'pending' | 'approved' | 'rejected',
  options?: {
    adminNote?: string;
    assignedAdminEmail?: string;
    actorEmail?: string;
    membershipPeriod?: MembershipPeriod;
  }
) {
  requireDatabase();
  const db = await getDb();

  const before = await db.collection('kulupler').getFirstListItem(`legacyId = ${id}`).catch(() => null);
  if (!before) {
    return null;
  }

  const nextAdminNote = options?.adminNote ?? '';
  const nextAssigned = options?.assignedAdminEmail?.trim() ?? (before.sorumluAdminEmail as string) ?? '';

  const row = await db.collection('kulupler').update(before.id, {
    durum: status,
    adminNotu: nextAdminNote,
    sorumluAdminEmail: nextAssigned,
  });

  if (status === 'approved') {
    await setClubProgramsPublication(id, true);
    if (options?.membershipPeriod) {
      await activateClubMembership(id, options.membershipPeriod);
    }
  }

  if (status === 'rejected' || status === 'pending') {
    await setClubProgramsPublication(id, false);
    if (options?.membershipPeriod) {
      await syncClubMembershipPeriod(id, options.membershipPeriod);
    }
  }

  await db.collection('admin_basvuru_loglari').create({
    legacyId: Date.now(),
    basvuruLegacyId: id,
    aksiyon: 'status_update',
    oncekiDurum: before.durum,
    yeniDurum: status,
    notMetni: nextAdminNote,
    atananAdminEmail: nextAssigned,
    islemYapanEmail: options?.actorEmail ?? '',
  });

  return {
    id: Number(row.legacyId),
    status: row.durum as 'pending' | 'approved' | 'rejected',
    adminNote: (row.adminNotu as string) ?? '',
    assignedAdminEmail: (row.sorumluAdminEmail as string) ?? '',
  };
}

async function deleteCollectionRowsByFilter(
  db: Awaited<ReturnType<typeof getDb>>,
  collection: string,
  filter: string,
) {
  const rows = await db.collection(collection).getFullList({ filter }).catch(() => []);
  await Promise.all(rows.map((row) => db.collection(collection).delete(row.id).catch(() => undefined)));
}

/** Onaylanmamış başvuruyu ve ilişkili kayıtları kalıcı siler (reddedilen slug çakışmasını temizler). */
export async function deleteAdminApplication(id: number) {
  requireDatabase();
  const db = await getDb();
  const club = await db.collection('kulupler').getFirstListItem(`legacyId = ${id}`).catch(() => null);
  if (!club) return null;

  const status = String(club.durum ?? '');
  if (status === 'approved') {
    throw new Error('Onaylanmis basvurular buradan silinemez. Onayli Kulüpler sekmesini kullanin.');
  }

  const docs = await listApplicationDocuments(id);
  for (const doc of docs) {
    const row = await db.collection('basvuru_belgeleri').getFirstListItem(`legacyId = ${doc.id}`).catch(() => null);
    if (row) await db.collection('basvuru_belgeleri').delete(row.id).catch(() => undefined);
    if (doc.storageKey) {
      const diskPath = path.resolve(process.cwd(), 'uploads', doc.storageKey);
      await fs.unlink(diskPath).catch(() => undefined);
    }
  }
  await fs.rm(path.resolve(process.cwd(), 'uploads', 'applications', String(id)), {
    recursive: true,
    force: true,
  }).catch(() => undefined);

  await deleteCollectionRowsByFilter(db, 'admin_basvuru_loglari', `basvuruLegacyId = ${id}`);
  await deleteCollectionRowsByFilter(db, 'kulup_programlari', `kulupLegacyId = ${id}`);
  await deleteCollectionRowsByFilter(db, 'kulup_branslar', `kulupLegacyId = ${id}`);
  await deleteCollectionRowsByFilter(db, 'kulup_uyelik_kullanicilari', `kulupLegacyId = ${id}`);
  await deleteCollectionRowsByFilter(db, 'kulup_uyelikleri', `kulupLegacyId = ${id}`);
  await db.collection('kulupler').delete(club.id);

  return { id, deleted: true as const };
}

function recordTimestamp(value: unknown): string | null {
  if (value == null || value === '') return null;
  const date = value instanceof Date ? value : new Date(value as string | number);
  if (Number.isNaN(date.getTime())) return null;
  return date.toISOString();
}

export async function listAdminApplicationLogs(applicationId: number) {
  requireDatabase();
  const db = await getDb();
  const rows = await db.collection('admin_basvuru_loglari').getList(1, 200, {
    filter: `basvuruLegacyId = ${applicationId}`,
    sort: '-legacyId',
  });
  return rows.items.map((row) => ({
    id: Number(row.legacyId),
    legacyId: Number(row.legacyId),
    applicationId: Number(row.basvuruLegacyId),
    action: row.aksiyon as string,
    previousStatus: row.oncekiDurum as 'pending' | 'approved' | 'rejected' | null,
    nextStatus: row.yeniDurum as 'pending' | 'approved' | 'rejected' | null,
    note: (row.notMetni as string) ?? '',
    assignedAdminEmail: (row.atananAdminEmail as string) ?? '',
    actorEmail: (row.islemYapanEmail as string) ?? '',
    createdAt: recordTimestamp(row.created) ?? recordTimestamp(row.updated) ?? recordTimestamp(Number(row.legacyId)),
  }));
}

export async function getMembershipPlans(options?: { basvuruOnly?: boolean }) {
  requireDatabase();
  const db = await getDb();
  for (const plan of DEFAULT_MEMBERSHIP_PLANS.filter((p) => p.kod === 'alti-aylik' || p.kod === 'on-iki-aylik')) {
    const existing = await db.collection('uyelik_paketleri').getFirstListItem(`kod = "${plan.kod}"`).catch(() => null);
    if (existing) {
      await db.collection('uyelik_paketleri').update(existing.id, {
        ad: plan.ad,
        ucret: plan.ucret,
        aciklama: plan.aciklama,
        periyot: plan.periyot,
        aktif: true,
      });
    }
  }
  let rows = await db.collection('uyelik_paketleri').getFullList({ filter: 'aktif = true', sort: 'ucret' });
  if (!rows.length) {
    for (const plan of DEFAULT_MEMBERSHIP_PLANS) {
      const existing = await db.collection('uyelik_paketleri').getFirstListItem(`kod = "${plan.kod}"`).catch(() => null);
      if (existing) {
        await db.collection('uyelik_paketleri').update(existing.id, { ...plan, aktif: true });
      } else {
        await db.collection('uyelik_paketleri').create({
          legacyId: Date.now() + Math.floor(Math.random() * 10000),
          ...plan,
          aktif: true,
        });
      }
    }
    rows = await db.collection('uyelik_paketleri').getFullList({ filter: 'aktif = true', sort: 'ucret' });
  }
  const mapped = rows.map((row) => ({
    legacyId: Number(row.legacyId),
    kod: row.kod as string,
    ad: row.ad as string,
    ucret: Number(row.ucret),
    periyot: row.periyot as 'monthly' | 'yearly' | 'one_time',
    aciklama: row.aciklama as string,
    aktif: Boolean(row.aktif ?? true),
  }));
  if (options?.basvuruOnly) {
    return mapped.filter((plan) => plan.kod === 'alti-aylik' || plan.kod === 'on-iki-aylik');
  }
  return mapped;
}

export async function updateMembershipPlan(
  legacyId: number,
  input: { ad?: string; ucret?: number; aciklama?: string; aktif?: boolean },
) {
  requireDatabase();
  const db = await getDb();
  const row = await db.collection('uyelik_paketleri').getFirstListItem(`legacyId = ${legacyId}`).catch(() => null);
  if (!row) return null;
  const updated = await db.collection('uyelik_paketleri').update(row.id, {
    ...(input.ad !== undefined ? { ad: input.ad.trim().slice(0, 120) } : {}),
    ...(input.ucret !== undefined ? { ucret: Math.max(0, Math.floor(input.ucret)) } : {}),
    ...(input.aciklama !== undefined ? { aciklama: input.aciklama.trim().slice(0, 500) } : {}),
    ...(input.aktif !== undefined ? { aktif: input.aktif } : {}),
  });
  return {
    legacyId: Number(updated.legacyId),
    kod: updated.kod as string,
    ad: updated.ad as string,
    ucret: Number(updated.ucret),
    aciklama: (updated.aciklama as string) ?? '',
    aktif: Boolean(updated.aktif),
  };
}

