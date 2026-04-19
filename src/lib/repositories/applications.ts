import { and, desc, eq } from 'drizzle-orm';
import { getDb, hasDatabaseUrl } from '../../db/client';
import { branslar, ilceler, iller, kulupBranslar, kulupUyelikleri, kulupler, uyelikPaketleri } from '../../db/schema';
import { CLUBS, MEMBERSHIP_PLANS, slugify } from '../../data/mockData';

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

export async function createClubApplication(input: ClubApplicationInput) {
  if (!hasDatabaseUrl()) {
    return { id: Date.now(), mode: 'mock' as const };
  }

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

  return { id: club.id, mode: 'db' as const };
}

export async function listAdminApplications() {
  if (!hasDatabaseUrl()) {
    return CLUBS.map((club) => ({
      id: club.id,
      ad: club.ad,
      il: club.il,
      ilce: club.ilce,
      durum: 'approved',
      createdAt: new Date().toISOString(),
      telefon: club.telefon,
    }));
  }
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
    })
    .from(kulupler)
    .innerJoin(iller, eq(kulupler.ilId, iller.id))
    .leftJoin(ilceler, eq(kulupler.ilceId, ilceler.id))
    .orderBy(desc(kulupler.createdAt))
    .limit(100);
}

export async function updateApplicationStatus(id: number, status: 'pending' | 'approved' | 'rejected') {
  if (!hasDatabaseUrl()) {
    return { id, status, mode: 'mock' as const };
  }
  const db = getDb();
  const [row] = await db
    .update(kulupler)
    .set({ durum: status, updatedAt: new Date() })
    .where(eq(kulupler.id, id))
    .returning({ id: kulupler.id, status: kulupler.durum });
  return row;
}

export function getMembershipPlans() {
  return MEMBERSHIP_PLANS;
}

