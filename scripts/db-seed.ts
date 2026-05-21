import { getDb, hasDatabaseUrl } from '../src/db/client';
import { enrichBranchFields } from '../src/lib/branches/branchEmoji';
import { BRANCHES, CITIES, CLUBS, DISTRICTS, MEMBERSHIP_PLANS, slugify } from '../src/data/mockData';

async function seed() {
  if (!hasDatabaseUrl()) {
    throw new Error('POCKETBASE_URL tanimli degil. Once .env dosyasinda ayarlayin.');
  }

  const db = await getDb();
  const cityIdsBySlug = new Map<string, number>();
  const branchIdsBySlug = new Map<string, number>();

  for (const ad of CITIES) {
    const slug = slugify(ad);
    const existing = await db.collection('iller').getFirstListItem(`slug = "${slug}"`).catch(() => null);
    if (!existing) {
      await db.collection('iller').create({ legacyId: Date.now() + Math.floor(Math.random() * 10000), ad, slug });
    }
  }
  const allCities = await db.collection('iller').getFullList();
  for (const city of allCities) {
    cityIdsBySlug.set(city.slug as string, Number(city.legacyId));
  }

  const ankaraId = cityIdsBySlug.get('ankara');
  if (ankaraId) {
    for (const ad of DISTRICTS) {
      const slug = slugify(ad);
      const existing = await db
        .collection('ilceler')
        .getFirstListItem(`ilLegacyId = ${ankaraId} && slug = "${slug}"`)
        .catch(() => null);
      if (!existing) {
        await db.collection('ilceler').create({
          legacyId: Date.now() + Math.floor(Math.random() * 10000),
          ad,
          slug,
          ilLegacyId: ankaraId,
        });
      }
    }
  }

  for (const b of BRANCHES) {
    const visual = enrichBranchFields({
      slug: b.slug,
      isim: b.isim,
      emoji: b.emoji,
      renk: b.renk,
      aciklama: b.aciklama,
    });
    const existing = await db.collection('branslar').getFirstListItem(`slug = "${b.slug}"`).catch(() => null);
    if (!existing) {
      await db.collection('branslar').create({
        legacyId: Date.now() + Math.floor(Math.random() * 10000),
        slug: b.slug,
        ad: b.isim,
        aciklama: b.aciklama,
        emoji: visual.emoji,
        renk: visual.renk,
      });
    } else if (existing.emoji !== visual.emoji || existing.renk !== visual.renk) {
      await db.collection('branslar').update(existing.id, {
        emoji: visual.emoji,
        renk: visual.renk,
      });
    }
  }
  const allBranches = await db.collection('branslar').getFullList();
  for (const branch of allBranches) {
    branchIdsBySlug.set(branch.slug as string, Number(branch.legacyId));
  }

  for (const plan of MEMBERSHIP_PLANS) {
    const existing = await db.collection('uyelik_paketleri').getFirstListItem(`kod = "${plan.kod}"`).catch(() => null);
    if (!existing) {
      await db.collection('uyelik_paketleri').create({
        legacyId: Date.now() + Math.floor(Math.random() * 10000),
        kod: plan.kod,
        ad: plan.ad,
        aciklama: plan.aciklama,
        ucret: plan.ucret,
        periyot: plan.periyot,
        aktif: true,
      });
    }
  }

  for (const kulup of CLUBS) {
    const cityId = cityIdsBySlug.get(kulup.ilSlug);
    if (!cityId) {
      continue;
    }

    const district = await db
      .collection('ilceler')
      .getFirstListItem(`ilLegacyId = ${cityId} && slug = "${slugify(kulup.ilce)}"`)
      .catch(() => null);
    const existingClub = await db
      .collection('kulupler')
      .getFirstListItem(`slug = "${slugify(kulup.ad)}"`)
      .catch(() => null);
    if (existingClub) {
      continue;
    }
    const insertedClub = await db.collection('kulupler').create({
      legacyId: Date.now() + Math.floor(Math.random() * 10000),
      ad: kulup.ad,
      slug: slugify(kulup.ad),
      ilLegacyId: cityId,
      ilceLegacyId: district ? Number(district.legacyId) : null,
      adres: kulup.adres,
      yasAraligi: kulup.yasAraligi,
      fiyatBilgisi: kulup.fiyat,
      telefon: kulup.telefon,
      email: '',
      aciklama: kulup.aciklama,
      oneCikan: kulup.oneCikan,
      puan: kulup.puan,
      yorumSayisi: kulup.yorumSayisi,
      durum: 'approved',
      adminNotu: '',
      sorumluAdminEmail: '',
    });

    const clubId = Number(insertedClub.legacyId);
    if (!clubId) {
      continue;
    }

    const branchId = branchIdsBySlug.get(kulup.bransSlug);
    if (!branchId) {
      continue;
    }

    const existingLink = await db
      .collection('kulup_branslar')
      .getFirstListItem(`kulupLegacyId = ${clubId} && bransLegacyId = ${branchId}`)
      .catch(() => null);
    if (!existingLink) {
      await db.collection('kulup_branslar').create({
        legacyId: Date.now() + Math.floor(Math.random() * 10000),
        kulupLegacyId: clubId,
        bransLegacyId: branchId,
      });
    }
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
