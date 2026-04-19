import { and, eq } from 'drizzle-orm';
import { getDb, hasDatabaseUrl } from '../src/db/client';
import {
  branslar,
  ilceler,
  iller,
  kulupBranslar,
  kulupDurumuEnum,
  kulupler,
  uyelikPaketleri,
} from '../src/db/schema';
import { BRANCHES, CITIES, CLUBS, DISTRICTS, MEMBERSHIP_PLANS, slugify } from '../src/data/mockData';

type KulupDurumu = (typeof kulupDurumuEnum.enumValues)[number];

async function seed() {
  if (!hasDatabaseUrl()) {
    throw new Error('DATABASE_URL tanimli degil. Once .env dosyasinda ayarlayin.');
  }

  const db = getDb();
  const cityIdsBySlug = new Map<string, number>();
  const branchIdsBySlug = new Map<string, number>();

  await db
    .insert(iller)
    .values(CITIES.map((ad) => ({ ad, slug: slugify(ad) })))
    .onConflictDoNothing();

  const allCities = await db.select({ id: iller.id, slug: iller.slug }).from(iller);
  for (const city of allCities) {
    cityIdsBySlug.set(city.slug, city.id);
  }

  const ankaraId = cityIdsBySlug.get('ankara');
  if (ankaraId) {
    await db
      .insert(ilceler)
      .values(DISTRICTS.map((ad) => ({ ad, slug: slugify(ad), ilId: ankaraId })))
      .onConflictDoNothing();
  }

  await db
    .insert(branslar)
    .values(
      BRANCHES.map((b) => ({
        slug: b.slug,
        ad: b.isim,
        aciklama: b.aciklama,
        emoji: b.emoji,
        renk: b.renk,
      }))
    )
    .onConflictDoNothing();

  const allBranches = await db.select({ id: branslar.id, slug: branslar.slug }).from(branslar);
  for (const branch of allBranches) {
    branchIdsBySlug.set(branch.slug, branch.id);
  }

  await db
    .insert(uyelikPaketleri)
    .values(
      MEMBERSHIP_PLANS.map((plan) => ({
        kod: plan.kod,
        ad: plan.ad,
        aciklama: plan.aciklama,
        ucret: String(plan.ucret),
        periyot: plan.periyot,
        aktif: true,
      }))
    )
    .onConflictDoNothing();

  for (const kulup of CLUBS) {
    const cityId = cityIdsBySlug.get(kulup.ilSlug);
    if (!cityId) {
      continue;
    }

    const [district] = await db
      .select({ id: ilceler.id })
      .from(ilceler)
      .where(and(eq(ilceler.ilId, cityId), eq(ilceler.slug, slugify(kulup.ilce))))
      .limit(1);

    const [insertedClub] = await db
      .insert(kulupler)
      .values({
        ad: kulup.ad,
        slug: slugify(kulup.ad),
        ilId: cityId,
        ilceId: district?.id,
        adres: kulup.adres,
        yasAraligi: kulup.yasAraligi,
        fiyatBilgisi: kulup.fiyat,
        telefon: kulup.telefon,
        email: '',
        aciklama: kulup.aciklama,
        oneCikan: kulup.oneCikan,
        puan: String(kulup.puan),
        yorumSayisi: kulup.yorumSayisi,
        durum: 'approved' as KulupDurumu,
      })
      .onConflictDoNothing()
      .returning({ id: kulupler.id });

    const clubId = insertedClub?.id;
    if (!clubId) {
      continue;
    }

    const branchId = branchIdsBySlug.get(kulup.bransSlug);
    if (!branchId) {
      continue;
    }

    await db
      .insert(kulupBranslar)
      .values({ kulupId: clubId, bransId: branchId })
      .onConflictDoNothing();
  }
}

seed()
  .then(() => {
    console.log('Seed tamamlandi.');
    process.exit(0);
  })
  .catch((error) => {
    console.error('Seed hatasi:', error);
    process.exit(1);
  });
