import { and, asc, desc, eq, sql } from 'drizzle-orm';
import { getDb, hasDatabaseUrl } from '../../db/client';
import { branslar, ilceler, iller, kulupBranslar, kulupler } from '../../db/schema';
import { BRANCHES, CITIES, CLUBS, DISTRICTS, slugify, sortFeaturedFirst } from '../../data/mockData';

export type SearchFilters = {
  il?: string;
  ilce?: string;
  brans?: string;
};

export async function getAllCities() {
  if (!hasDatabaseUrl()) {
    return CITIES.map((city) => ({ ad: city, slug: slugify(city) }));
  }
  const db = getDb();
  return db.select({ ad: iller.ad, slug: iller.slug }).from(iller).orderBy(asc(iller.ad));
}

export async function getAllDistricts(ilSlug?: string) {
  if (!hasDatabaseUrl()) {
    return DISTRICTS.map((d) => ({ ad: d, slug: slugify(d) }));
  }
  const db = getDb();
  if (!ilSlug) {
    return db
      .select({ ad: ilceler.ad, slug: ilceler.slug })
      .from(ilceler)
      .orderBy(asc(ilceler.ad))
      .limit(500);
  }
  return db
    .select({ ad: ilceler.ad, slug: ilceler.slug })
    .from(ilceler)
    .innerJoin(iller, eq(ilceler.ilId, iller.id))
    .where(eq(iller.slug, ilSlug))
    .orderBy(asc(ilceler.ad));
}

export async function getAllBranches() {
  if (!hasDatabaseUrl()) {
    return BRANCHES;
  }
  const db = getDb();
  return db
    .select({
      slug: branslar.slug,
      isim: branslar.ad,
      emoji: branslar.emoji,
      renk: branslar.renk,
      aciklama: branslar.aciklama,
    })
    .from(branslar)
    .orderBy(asc(branslar.ad));
}

export async function searchClubs(filters: SearchFilters) {
  if (!hasDatabaseUrl()) {
    let items = CLUBS;
    if (filters.il) {
      items = items.filter((club) => club.ilSlug === filters.il || slugify(club.il) === filters.il);
    }
    if (filters.ilce) {
      items = items.filter((club) => slugify(club.ilce) === filters.ilce);
    }
    if (filters.brans) {
      items = items.filter((club) => club.bransSlug === filters.brans);
    }
    return sortFeaturedFirst(items);
  }

  const db = getDb();
  const clauses = [];

  if (filters.il) {
    clauses.push(eq(iller.slug, filters.il));
  }
  if (filters.ilce) {
    clauses.push(eq(ilceler.slug, filters.ilce));
  }
  if (filters.brans) {
    clauses.push(eq(branslar.slug, filters.brans));
  }

  const rows = await db
    .select({
      id: kulupler.id,
      ad: kulupler.ad,
      il: iller.ad,
      ilSlug: iller.slug,
      brans: branslar.ad,
      bransSlug: branslar.slug,
      ilce: ilceler.ad,
      adres: kulupler.adres,
      yasAraligi: kulupler.yasAraligi,
      fiyat: kulupler.fiyatBilgisi,
      telefon: kulupler.telefon,
      aciklama: kulupler.aciklama,
      oneCikan: kulupler.oneCikan,
      puan: kulupler.puan,
      yorumSayisi: kulupler.yorumSayisi,
      emoji: branslar.emoji,
      renk: branslar.renk,
    })
    .from(kulupler)
    .innerJoin(iller, eq(kulupler.ilId, iller.id))
    .leftJoin(ilceler, eq(kulupler.ilceId, ilceler.id))
    .leftJoin(kulupBranslar, eq(kulupBranslar.kulupId, kulupler.id))
    .leftJoin(branslar, eq(kulupBranslar.bransId, branslar.id))
    .where(and(eq(kulupler.durum, 'approved'), ...(clauses.length ? clauses : [])))
    .orderBy(desc(kulupler.oneCikan), desc(kulupler.puan), asc(kulupler.ad));

  return rows.map((row) => ({
    ...row,
    puan: Number(row.puan ?? 0),
  }));
}

export async function getBranchBySlug(slug: string) {
  const branches = await getAllBranches();
  return branches.find((item) => item.slug === slug) ?? null;
}

export async function getClubById(id: number) {
  const clubs = await searchClubs({});
  return clubs.find((item) => item.id === id) ?? null;
}

export async function getCityBranchLanding(citySlug: string, branchSlug: string) {
  const clubs = await searchClubs({ il: citySlug, brans: branchSlug });
  const branch = await getBranchBySlug(branchSlug);
  const cities = await getAllCities();
  const city = cities.find((item) => item.slug === citySlug) ?? null;
  return { clubs, branch, city };
}

export async function getDistrictBranchLanding(citySlug: string, districtSlug: string, branchSlug: string) {
  const clubs = await searchClubs({ il: citySlug, ilce: districtSlug, brans: branchSlug });
  const branch = await getBranchBySlug(branchSlug);
  const cities = await getAllCities();
  const city = cities.find((item) => item.slug === citySlug) ?? null;
  const districts = await getAllDistricts(citySlug);
  const district = districts.find((item) => item.slug === districtSlug) ?? null;
  return { clubs, branch, city, district };
}

export async function getAdminClubSummary() {
  if (!hasDatabaseUrl()) {
    return {
      total: CLUBS.length,
      pending: 0,
      approved: CLUBS.length,
      rejected: 0,
    };
  }
  const db = getDb();
  const all = await db.select({ value: sql<number>`count(*)` }).from(kulupler);
  const pending = await db.select({ value: sql<number>`count(*)` }).from(kulupler).where(eq(kulupler.durum, 'pending'));
  const approved = await db.select({ value: sql<number>`count(*)` }).from(kulupler).where(eq(kulupler.durum, 'approved'));
  const rejected = await db.select({ value: sql<number>`count(*)` }).from(kulupler).where(eq(kulupler.durum, 'rejected'));
  return {
    total: Number(all[0]?.value ?? 0),
    pending: Number(pending[0]?.value ?? 0),
    approved: Number(approved[0]?.value ?? 0),
    rejected: Number(rejected[0]?.value ?? 0),
  };
}

