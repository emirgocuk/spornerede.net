import { getDb, hasDatabaseUrl } from '../../db/client';
import { expireDueMemberships } from './memberships';
import { parseProgramContent } from './programContent';

export type SearchFilters = {
  il?: string;
  ilce?: string;
  brans?: string;
  userLat?: number;
  userLng?: number;
};

export type ClubProgramSummary = {
  id: number;
  ad: string;
  aciklama: string;
  gunSaat: string;
  seviye: string;
  ucretBilgisi: string;
  aktif: boolean;
  eventDate: string;
  locationText: string;
  gallery: string[];
  bodyJson: unknown | null;
};

function requireDatabase() {
  if (!hasDatabaseUrl()) {
    throw new Error('POCKETBASE_URL is not configured.');
  }
}

export async function getAllCities() {
  requireDatabase();
  const db = await getDb();
  const rows = await db.collection('iller').getFullList({ sort: 'ad' });
  return rows.map((row) => ({ ad: row.ad as string, slug: row.slug as string }));
}

export async function getAllDistricts(ilSlug?: string) {
  requireDatabase();
  const db = await getDb();
  if (!ilSlug) {
    const rows = await db.collection('ilceler').getList(1, 500, { sort: 'ad' });
    return rows.items.map((row) => ({ ad: row.ad as string, slug: row.slug as string }));
  }
  const city = await db.collection('iller').getFirstListItem(`slug = "${ilSlug}"`).catch(() => null);
  if (!city) return [];
  const rows = await db.collection('ilceler').getFullList({
    filter: `ilLegacyId = ${Number(city.legacyId)}`,
    sort: 'ad',
  });
  return rows.map((row) => ({ ad: row.ad as string, slug: row.slug as string }));
}

export async function getAllBranches() {
  requireDatabase();
  const db = await getDb();
  const rows = await db.collection('branslar').getFullList({ sort: 'ad' });
  return rows.map((row) => ({
    slug: row.slug as string,
    isim: row.ad as string,
    emoji: row.emoji as string,
    renk: row.renk as string,
    aciklama: row.aciklama as string,
  }));
}

export async function searchClubs(filters: SearchFilters) {
  requireDatabase();

  await expireDueMemberships();
  const db = await getDb();
  const [cities, districts, clubs, clubBranches, branches, programs, memberships] = await Promise.all([
    db.collection('iller').getFullList(),
    db.collection('ilceler').getFullList(),
    db.collection('kulupler').getFullList({ filter: 'durum = "approved"' }),
    db.collection('kulup_branslar').getFullList(),
    db.collection('branslar').getFullList(),
    db.collection('kulup_programlari').getFullList({ filter: 'aktif = true' }),
    db.collection('kulup_uyelikleri').getFullList({ filter: 'odemeDurumu = "paid"' }),
  ]);

  const cityById = new Map(cities.map((row) => [Number(row.legacyId), row]));
  const districtById = new Map(districts.map((row) => [Number(row.legacyId), row]));
  const branchById = new Map(branches.map((row) => [Number(row.legacyId), row]));
  const branchLinkByClub = new Map<number, number>();
  for (const link of clubBranches) {
    if (!branchLinkByClub.has(Number(link.kulupLegacyId))) {
      branchLinkByClub.set(Number(link.kulupLegacyId), Number(link.bransLegacyId));
    }
  }

  const hasUserLocation = Number.isFinite(filters.userLat) && Number.isFinite(filters.userLng);
  const nowMs = Date.now();
  const activeMembershipClubIds = new Set<number>();
  for (const row of memberships) {
    const clubId = Number(row.kulupLegacyId);
    const endAt = (row.bitisTarihi as string | undefined) ?? '';
    if (!endAt || new Date(endAt).getTime() > nowMs) {
      activeMembershipClubIds.add(clubId);
    }
  }

  const rows = clubs
    .map((club) => {
      const city = cityById.get(Number(club.ilLegacyId));
      const district = districtById.get(Number(club.ilceLegacyId));
      const linkedBranch = branchById.get(branchLinkByClub.get(Number(club.legacyId)) ?? -1);
      return {
        id: Number(club.legacyId),
        ad: club.ad as string,
        il: (city?.ad as string | undefined) ?? '',
        ilSlug: (city?.slug as string | undefined) ?? '',
        brans: (linkedBranch?.ad as string | undefined) ?? '',
        bransSlug: (linkedBranch?.slug as string | undefined) ?? '',
        ilce: (district?.ad as string | undefined) ?? '',
        adres: (club.adres as string) ?? '',
        yasAraligi: (club.yasAraligi as string) ?? '',
        fiyat: (club.fiyatBilgisi as string) ?? '',
        telefon: (club.telefon as string) ?? '',
        aciklama: (club.aciklama as string) ?? '',
        oneCikan: Boolean(club.oneCikan),
        puan: Number(club.puan ?? 0),
        yorumSayisi: Number(club.yorumSayisi ?? 0),
        emoji: (linkedBranch?.emoji as string | undefined) ?? '',
        renk: (linkedBranch?.renk as string | undefined) ?? '',
        enlem: Number(club.enlem ?? 0),
        boylam: Number(club.boylam ?? 0),
      };
    })
    .filter((club) => activeMembershipClubIds.has(club.id))
    .filter((club) => (!filters.il ? true : club.ilSlug === filters.il))
    .filter((club) => (!filters.ilce ? true : slugify(club.ilce) === filters.ilce))
    .filter((club) => (!filters.brans ? true : club.bransSlug === filters.brans))
    .sort((a, b) => {
      if (hasUserLocation) {
        const aHasDistance = Number.isFinite(a.enlem) && Number.isFinite(a.boylam);
        const bHasDistance = Number.isFinite(b.enlem) && Number.isFinite(b.boylam);
        if (aHasDistance && bHasDistance) {
          const aDistance = haversineKm(filters.userLat!, filters.userLng!, a.enlem, a.boylam);
          const bDistance = haversineKm(filters.userLat!, filters.userLng!, b.enlem, b.boylam);
          if (aDistance !== bDistance) return aDistance - bDistance;
        } else if (aHasDistance !== bHasDistance) {
          return aHasDistance ? -1 : 1;
        }
      }
      if (a.oneCikan !== b.oneCikan) return a.oneCikan ? -1 : 1;
      if (a.puan !== b.puan) return b.puan - a.puan;
      return a.ad.localeCompare(b.ad, 'tr');
    });

  const programsByClub = new Map<
    number,
    Array<{
      id: number;
      ad: string;
      gunSaat: string;
      seviye: string;
      ucretBilgisi: string;
      aktif: boolean;
      eventDate: string;
      locationText: string;
      aciklama: string;
    }>
  >();
  for (const row of programs) {
    const clubId = Number(row.kulupLegacyId);
    const parsed = parseProgramContent((row.aciklama as string) ?? '');
    const current = programsByClub.get(clubId) ?? [];
    current.push({
      id: Number(row.legacyId),
      ad: (row.ad as string) ?? '',
      gunSaat: (row.gunSaat as string) ?? '',
      seviye: (row.seviye as string) ?? '',
      ucretBilgisi: (row.ucretBilgisi as string) ?? '',
      aktif: Boolean(row.aktif),
      eventDate: parsed.content.eventDate,
      locationText: parsed.content.locationText,
      aciklama: parsed.content.summary || parsed.legacyText || '',
    });
    programsByClub.set(clubId, current);
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
      distanceKm:
        hasUserLocation && row.enlem && row.boylam
          ? haversineKm(filters.userLat, filters.userLng, row.enlem, row.boylam)
          : null,
      programSayisi: programs.length,
      programOzet,
      ilkProgramId: firstProgram?.id ?? null,
      programlar: programs,
    };
  });
}

function slugify(value: string) {
  return value
    .toLocaleLowerCase('tr-TR')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

function haversineKm(lat1: number, lon1: number, lat2: number, lon2: number) {
  const toRad = (value: number) => (value * Math.PI) / 180;
  const earthRadiusKm = 6371;
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return Math.round(earthRadiusKm * c * 10) / 10;
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
  const db = await getDb();
  const rows = await db.collection('kulup_programlari').getFullList({
    filter: `kulupLegacyId = ${clubId} && aktif = true`,
    sort: 'ad',
  });
  return rows.map((row) => {
    const parsed = parseProgramContent((row.aciklama as string) ?? '');
    return {
      id: Number(row.legacyId),
      ad: row.ad as string,
      aciklama: parsed.content.summary || parsed.legacyText || '',
      gunSaat: row.gunSaat as string,
      seviye: row.seviye as string,
      ucretBilgisi: row.ucretBilgisi as string,
      aktif: Boolean(row.aktif),
      eventDate: parsed.content.eventDate,
      locationText: parsed.content.locationText,
      gallery: parsed.content.gallery,
      bodyJson: parsed.content.bodyJson,
    };
  });
}

export async function getProgramListingById(programId: number) {
  requireDatabase();
  await expireDueMemberships();
  const db = await getDb();

  const [program, clubs, cities, districts, clubBranches, branches, memberships] = await Promise.all([
    db.collection('kulup_programlari').getFirstListItem(`legacyId = ${programId} && aktif = true`).catch(() => null),
    db.collection('kulupler').getFullList({ filter: 'durum = "approved"' }),
    db.collection('iller').getFullList(),
    db.collection('ilceler').getFullList(),
    db.collection('kulup_branslar').getFullList(),
    db.collection('branslar').getFullList(),
    db.collection('kulup_uyelikleri').getFullList({ filter: 'odemeDurumu = "paid"' }),
  ]);

  if (!program) return null;
  const clubLegacyId = Number(program.kulupLegacyId);
  const nowMs = Date.now();
  const hasValidMembership = memberships.some((row) => {
    const matchesClub = Number(row.kulupLegacyId) === clubLegacyId;
    if (!matchesClub) return false;
    const endAt = (row.bitisTarihi as string | undefined) ?? '';
    return !endAt || new Date(endAt).getTime() > nowMs;
  });
  if (!hasValidMembership) return null;

  const club = clubs.find((item) => Number(item.legacyId) === clubLegacyId);
  if (!club) return null;
  const city = cities.find((item) => Number(item.legacyId) === Number(club.ilLegacyId));
  const district = districts.find((item) => Number(item.legacyId) === Number(club.ilceLegacyId));
  const branchLink = clubBranches.find((item) => Number(item.kulupLegacyId) === clubLegacyId);
  const branch = branches.find((item) => Number(item.legacyId) === Number(branchLink?.bransLegacyId));
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
    locationText: parsed.content.locationText || ((district?.ad as string | undefined) ?? (city?.ad as string | undefined) ?? ''),
    gallery: parsed.content.gallery,
    bodyJson: parsed.content.bodyJson,
    club: {
      id: Number(club.legacyId),
      ad: (club.ad as string) ?? '',
      il: (city?.ad as string | undefined) ?? '',
      ilce: (district?.ad as string | undefined) ?? '',
      yasAraligi: (club.yasAraligi as string) ?? '',
      puan: Number(club.puan ?? 0),
      yorumSayisi: Number(club.yorumSayisi ?? 0),
      enlem: Number(club.enlem ?? 0),
      boylam: Number(club.boylam ?? 0),
      emoji: (branch?.emoji as string | undefined) ?? '',
      renk: (branch?.renk as string | undefined) ?? '',
      brans: (branch?.ad as string | undefined) ?? '',
      bransSlug: (branch?.slug as string | undefined) ?? '',
    },
  };
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
  const db = await getDb();
  const clubs = await db.collection('kulupler').getFullList();
  const all = clubs.length;
  const pending = clubs.filter((item) => item.durum === 'pending').length;
  const approved = clubs.filter((item) => item.durum === 'approved').length;
  const rejected = clubs.filter((item) => item.durum === 'rejected').length;
  return {
    total: all,
    pending,
    approved,
    rejected,
  };
}

