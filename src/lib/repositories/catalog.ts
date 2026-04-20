import { and, asc, desc, eq, inArray, sql } from 'drizzle-orm';
import { getDb, hasDatabaseUrl } from '../../db/client';
import { branslar, ilceler, iller, kulupBranslar, kulupProgramlari, kulupler } from '../../db/schema';

export type SearchFilters = {
  il?: string;
  ilce?: string;
  brans?: string;
};

export type ClubProgramSummary = {
  id: number;
  ad: string;
  aciklama: string;
  gunSaat: string;
  seviye: string;
  ucretBilgisi: string;
  aktif: boolean;
};

function requireDatabase() {
  if (!hasDatabaseUrl()) {
    throw new Error('DATABASE_URL is not configured.');
  }
}

export async function getAllCities() {
  requireDatabase();
  const db = getDb();
  return db.select({ ad: iller.ad, slug: iller.slug }).from(iller).orderBy(asc(iller.ad));
}

export async function getAllDistricts(ilSlug?: string) {
  requireDatabase();
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
  requireDatabase();
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
  requireDatabase();

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

  const clubIds = rows.map((row) => row.id);
  const programRows = clubIds.length
    ? await db
        .select({
          kulupId: kulupProgramlari.kulupId,
          ad: kulupProgramlari.ad,
          gunSaat: kulupProgramlari.gunSaat,
          aktif: kulupProgramlari.aktif,
        })
        .from(kulupProgramlari)
        .where(and(eq(kulupProgramlari.aktif, true), inArray(kulupProgramlari.kulupId, clubIds)))
        .orderBy(asc(kulupProgramlari.kulupId), asc(kulupProgramlari.ad))
    : [];

  const programsByClub = new Map<number, Array<{ ad: string; gunSaat: string; aktif: boolean }>>();
  for (const row of programRows) {
    const current = programsByClub.get(row.kulupId) ?? [];
    current.push({ ad: row.ad, gunSaat: row.gunSaat, aktif: row.aktif });
    programsByClub.set(row.kulupId, current);
  }

  return rows.map((row) => {
    const programs = programsByClub.get(row.id) ?? [];
    const firstProgram = programs[0];
    const programOzet = firstProgram
      ? `${programs.length} program • ${firstProgram.ad}${firstProgram.gunSaat ? ` (${firstProgram.gunSaat})` : ''}`
      : '';

    return {
    ...row,
    puan: Number(row.puan ?? 0),
      programSayisi: programs.length,
      programOzet,
    };
  });
}

export async function getBranchBySlug(slug: string) {
  const branches = await getAllBranches();
  return branches.find((item) => item.slug === slug) ?? null;
}

export async function getClubById(id: number) {
  const clubs = await searchClubs({});
  return clubs.find((item) => item.id === id) ?? null;
}

export async function getClubProgramsByClubId(clubId: number) {
  requireDatabase();
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
    })
    .from(kulupProgramlari)
    .where(and(eq(kulupProgramlari.kulupId, clubId), eq(kulupProgramlari.aktif, true)))
    .orderBy(asc(kulupProgramlari.ad));
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
  requireDatabase();
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

