import { and, desc, eq } from 'drizzle-orm';
import { getDb, hasDatabaseUrl } from '../../db/client';
import {
  adminBasvuruLoglari,
  branslar,
  ilceler,
  iller,
  kulupBranslar,
  kulupUyelikleri,
  kulupler,
  uyelikPaketleri,
} from '../../db/schema';
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
    throw new Error('DATABASE_URL is not configured.');
  }
}

export async function createClubApplication(input: ClubApplicationInput) {
  requireDatabase();

  const db = getDb();

  const [city] = await db.select().from(iller).where(eq(iller.slug, slugify(input.il))).limit(1);
  if (!city) {
    throw new Error('Secilen il sistemde bulunamadi.');
  }

  const [district] = await db
    .select()
    .from(ilceler)
    .where(and(eq(ilceler.ilId, city.id), eq(ilceler.slug, slugify(input.ilce))))
    .limit(1);

  const [club] = await db
    .insert(kulupler)
    .values({
      ad: input.kulupad,
      slug: slugify(input.kulupad),
      ilId: city.id,
      ilceId: district?.id,
      adres: input.adres ?? '',
      yasAraligi: input.yasaraligi ?? '',
      fiyatBilgisi: input.fiyat ?? '',
      telefon: input.telefon,
      email: input.email,
      aciklama: input.aciklama ?? '',
      durum: 'pending',
    })
    .returning({ id: kulupler.id });

  const [branch] = await db.select().from(branslar).where(eq(branslar.slug, slugify(input.brans))).limit(1);
  if (branch) {
    await db.insert(kulupBranslar).values({ kulupId: club.id, bransId: branch.id });
  }

  const [plan] = await db.select().from(uyelikPaketleri).where(eq(uyelikPaketleri.kod, input.paket)).limit(1);
  if (plan) {
    await db.insert(kulupUyelikleri).values({
      kulupId: club.id,
      paketId: plan.id,
      odemeDurumu: 'pending',
    });
  }

  await db.insert(adminBasvuruLoglari).values({
    basvuruId: club.id,
    aksiyon: 'application_created',
    yeniDurum: 'pending',
    islemYapanEmail: input.email,
    notMetni: 'Kulup basvurusu olusturuldu.',
  });

  return { id: club.id, mode: 'db' as const };
}

export async function listAdminApplications() {
  requireDatabase();
  const db = getDb();
  return db
    .select({
      id: kulupler.id,
      ad: kulupler.ad,
      il: iller.ad,
      ilce: ilceler.ad,
      durum: kulupler.durum,
      createdAt: kulupler.createdAt,
      telefon: kulupler.telefon,
      sorumluAdminEmail: kulupler.sorumluAdminEmail,
    })
    .from(kulupler)
    .innerJoin(iller, eq(kulupler.ilId, iller.id))
    .leftJoin(ilceler, eq(kulupler.ilceId, ilceler.id))
    .orderBy(desc(kulupler.createdAt))
    .limit(100);
}

export async function getAdminApplicationById(id: number) {
  requireDatabase();

  const db = getDb();
  const [row] = await db
    .select({
      id: kulupler.id,
      ad: kulupler.ad,
      il: iller.ad,
      ilce: ilceler.ad,
      durum: kulupler.durum,
      createdAt: kulupler.createdAt,
      updatedAt: kulupler.updatedAt,
      telefon: kulupler.telefon,
      email: kulupler.email,
      adres: kulupler.adres,
      aciklama: kulupler.aciklama,
      adminNotu: kulupler.adminNotu,
      sorumluAdminEmail: kulupler.sorumluAdminEmail,
    })
    .from(kulupler)
    .innerJoin(iller, eq(kulupler.ilId, iller.id))
    .leftJoin(ilceler, eq(kulupler.ilceId, ilceler.id))
    .where(eq(kulupler.id, id))
    .limit(1);

  return row ?? null;
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
  const db = getDb();

  const [before] = await db
    .select({ durum: kulupler.durum, adminNotu: kulupler.adminNotu, assigned: kulupler.sorumluAdminEmail })
    .from(kulupler)
    .where(eq(kulupler.id, id))
    .limit(1);
  if (!before) {
    return null;
  }

  const nextAdminNote = options?.adminNote ?? '';
  const nextAssigned = options?.assignedAdminEmail?.trim() ?? before.assigned ?? '';

  const [row] = await db
    .update(kulupler)
    .set({
      durum: status,
      adminNotu: nextAdminNote,
      sorumluAdminEmail: nextAssigned,
      updatedAt: new Date(),
    })
    .where(eq(kulupler.id, id))
    .returning({
      id: kulupler.id,
      status: kulupler.durum,
      adminNote: kulupler.adminNotu,
      assignedAdminEmail: kulupler.sorumluAdminEmail,
    });

  await db.insert(adminBasvuruLoglari).values({
    basvuruId: id,
    aksiyon: 'status_update',
    oncekiDurum: before.durum,
    yeniDurum: status,
    notMetni: nextAdminNote,
    atananAdminEmail: nextAssigned,
    islemYapanEmail: options?.actorEmail ?? '',
  });

  return row;
}

export async function listAdminApplicationLogs(applicationId: number) {
  requireDatabase();
  const db = getDb();
  return db
    .select({
      id: adminBasvuruLoglari.id,
      applicationId: adminBasvuruLoglari.basvuruId,
      action: adminBasvuruLoglari.aksiyon,
      previousStatus: adminBasvuruLoglari.oncekiDurum,
      nextStatus: adminBasvuruLoglari.yeniDurum,
      note: adminBasvuruLoglari.notMetni,
      assignedAdminEmail: adminBasvuruLoglari.atananAdminEmail,
      actorEmail: adminBasvuruLoglari.islemYapanEmail,
      createdAt: adminBasvuruLoglari.createdAt,
    })
    .from(adminBasvuruLoglari)
    .where(eq(adminBasvuruLoglari.basvuruId, applicationId))
    .orderBy(desc(adminBasvuruLoglari.createdAt))
    .limit(200);
}

export function getMembershipPlans() {
  return MEMBERSHIP_PLANS;
}

