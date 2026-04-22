import { getDb, hasDatabaseUrl } from '../../db/client';
import { MEMBERSHIP_PLANS, slugify } from '../../data/mockData';

export type ClubApplicationInput = {
  kulupad: string;
  il: string;
  ilce: string;
  brans: string;
  adres?: string;
  yasaraligi?: string;
  fiyat?: string;
  aciklama?: string;
  yetkili: string;
  telefon: string;
  email: string;
  paket: string;
};

function requireDatabase() {
  if (!hasDatabaseUrl()) {
    throw new Error('POCKETBASE_URL is not configured.');
  }
}

export async function createClubApplication(input: ClubApplicationInput) {
  requireDatabase();

  const db = await getDb();

  const city = await db.collection('iller').getFirstListItem(`slug = "${slugify(input.il)}"`).catch(() => null);
  if (!city) {
    throw new Error('Secilen il sistemde bulunamadi.');
  }

  const district = await db
    .collection('ilceler')
    .getFirstListItem(`ilLegacyId = ${Number(city.legacyId)} && slug = "${slugify(input.ilce)}"`)
    .catch(() => null);

  const club = await db.collection('kulupler').create({
    legacyId: Date.now(),
    ad: input.kulupad,
    slug: slugify(input.kulupad),
    ilLegacyId: Number(city.legacyId),
    ilceLegacyId: district ? Number(district.legacyId) : null,
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
  });

  const branch = await db.collection('branslar').getFirstListItem(`slug = "${slugify(input.brans)}"`).catch(() => null);
  if (branch) {
    await db.collection('kulup_branslar').create({
      legacyId: Date.now() + 1,
      kulupLegacyId: Number(club.legacyId),
      bransLegacyId: Number(branch.legacyId),
    });
  }

  const plan = await db.collection('uyelik_paketleri').getFirstListItem(`kod = "${input.paket}"`).catch(() => null);
  if (plan) {
    await db.collection('kulup_uyelikleri').create({
      legacyId: Date.now() + 2,
      kulupLegacyId: Number(club.legacyId),
      paketLegacyId: Number(plan.legacyId),
      odemeDurumu: 'pending',
    });
  }

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
    db.collection('kulupler').getList(1, 100, { sort: '-legacyId' }),
    db.collection('iller').getFullList(),
    db.collection('ilceler').getFullList(),
  ]);
  const cityMap = new Map(cities.map((row) => [Number(row.legacyId), row.ad as string]));
  const districtMap = new Map(districts.map((row) => [Number(row.legacyId), row.ad as string]));
  return rows.items.map((row) => ({
    id: Number(row.legacyId),
    ad: row.ad as string,
    il: cityMap.get(Number(row.ilLegacyId)) ?? '',
    ilce: districtMap.get(Number(row.ilceLegacyId)) ?? '',
    durum: row.durum as 'pending' | 'approved' | 'rejected',
    createdAt: row.created,
    telefon: row.telefon as string,
    sorumluAdminEmail: (row.sorumluAdminEmail as string) ?? '',
  }));
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

  return {
    id: Number(row.legacyId),
    ad: row.ad as string,
    il: (city?.ad as string | undefined) ?? '',
    ilce: (district?.ad as string | undefined) ?? '',
    durum: row.durum as 'pending' | 'approved' | 'rejected',
    createdAt: row.created,
    updatedAt: row.updated,
    telefon: row.telefon as string,
    email: row.email as string,
    adres: row.adres as string,
    aciklama: row.aciklama as string,
    adminNotu: (row.adminNotu as string) ?? '',
    sorumluAdminEmail: (row.sorumluAdminEmail as string) ?? '',
  };
}

export async function updateApplicationStatus(
  id: number,
  status: 'pending' | 'approved' | 'rejected',
  options?: {
    adminNote?: string;
    assignedAdminEmail?: string;
    actorEmail?: string;
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

export async function listAdminApplicationLogs(applicationId: number) {
  requireDatabase();
  const db = await getDb();
  const rows = await db.collection('admin_basvuru_loglari').getList(1, 200, {
    filter: `basvuruLegacyId = ${applicationId}`,
    sort: '-legacyId',
  });
  return rows.items.map((row) => ({
    id: Number(row.legacyId),
    applicationId: Number(row.basvuruLegacyId),
    action: row.aksiyon as string,
    previousStatus: row.oncekiDurum as 'pending' | 'approved' | 'rejected' | null,
    nextStatus: row.yeniDurum as 'pending' | 'approved' | 'rejected' | null,
    note: (row.notMetni as string) ?? '',
    assignedAdminEmail: (row.atananAdminEmail as string) ?? '',
    actorEmail: (row.islemYapanEmail as string) ?? '',
    createdAt: row.created,
  }));
}

export function getMembershipPlans() {
  return MEMBERSHIP_PLANS;
}

