import { getDb, hasDatabaseUrl } from '../../db/client';
import { plateCodeFromIlSlug } from '../trIlPlateBySlug';
import { enrichBranchFields } from '../branches/branchEmoji';
import { displayIlAd } from '../turkishIlDisplay';
import { expireDueMemberships } from './memberships';
import { parseProgramContent } from './programContent';
import { listingSlug } from '../seo/slug';

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

function branchVisualFromRow(row: Record<string, unknown> | undefined) {
  if (!row) return { emoji: '', renk: '' };
  const enriched = enrichBranchFields({
    slug: String(row.slug ?? ''),
    isim: String(row.ad ?? ''),
    emoji: String(row.emoji ?? ''),
    renk: String(row.renk ?? ''),
  });
  return { emoji: enriched.emoji, renk: enriched.renk };
}

/** PocketBase filter string içinde güvenli tırnak kaçışı */
function escapePbFilter(value: string) {
  return String(value ?? '').replace(/\\/g, '\\\\').replace(/"/g, '\\"');
}

/** Türkçe alfabe sırası (ı, ğ, ü, ş, ö, ç vb.) */
function sortByTurkishAd<T extends { ad: string }>(items: T[]): T[] {
  return [...items].sort((a, b) => a.ad.localeCompare(b.ad, 'tr'));
}

export async function getAllCities() {
  requireDatabase();
  const db = await getDb();
  const rows = await db.collection('iller').getFullList();
  return sortByTurkishAd(
    rows.map((row) => ({
      ad: displayIlAd(row.slug as string, row.ad as string),
      slug: row.slug as string,
    })),
  );
}

export async function getAllDistricts(ilSlug?: string) {
  requireDatabase();
  const db = await getDb();
  if (!ilSlug) {
    const rows = await db.collection('ilceler').getFullList({ sort: 'ad' });
    return rows.map((row) => ({ ad: row.ad as string, slug: row.slug as string }));
  }

  const raw = ilSlug.trim();
  if (!raw) {
    const rows = await db.collection('ilceler').getFullList({ sort: 'ad' });
    return rows.map((row) => ({ ad: row.ad as string, slug: row.slug as string }));
  }

  const slugNorm = raw.toLocaleLowerCase('tr-TR');
  let city =
    (await db
      .collection('iller')
      .getFirstListItem(`slug = "${escapePbFilter(raw)}"`)
      .catch(() => null)) ??
    (await db
      .collection('iller')
      .getFirstListItem(`slug = "${escapePbFilter(slugNorm)}"`)
      .catch(() => null));

  if (!city) {
    const all = await db.collection('iller').getFullList({ sort: 'ad' });
    city =
      all.find((row) => String(row.slug ?? '').toLocaleLowerCase('tr-TR') === slugNorm) ??
      all.find((row) => String(row.ad ?? '').toLocaleLowerCase('tr-TR') === slugNorm) ??
      null;
  }

  const plateGuess =
    plateCodeFromIlSlug(slugNorm) ??
    plateCodeFromIlSlug(raw.toLowerCase()) ??
    (city ? plateCodeFromIlSlug(String(city.slug ?? '').toLowerCase()) : null);

  const mapRows = (rows: { ad?: unknown; slug?: unknown }[]) =>
    sortByTurkishAd(rows.map((row) => ({ ad: row.ad as string, slug: row.slug as string })));

  /** İl satırı yok veya legacyId bozuksa bile slug→plaka ile ilçe bul */
  const districtsByPlate = async (plate: number) => {
    const allDistricts = await db.collection('ilceler').getFullList({ sort: 'ad' });
    return allDistricts.filter((row) => Number(row.ilLegacyId) === plate);
  };

  if (!city) {
    if (plateGuess != null) {
      const rows = await districtsByPlate(plateGuess);
      return mapRows(rows);
    }
    return [];
  }

  const ilLegacy = Number(city.legacyId);

  if (!Number.isFinite(ilLegacy)) {
    if (plateGuess != null) {
      const rows = await districtsByPlate(plateGuess);
      return mapRows(rows);
    }
    return [];
  }

  let rows = await db.collection('ilceler').getFullList({
    filter: `ilLegacyId = ${ilLegacy}`,
    sort: 'ad',
  });

  if (rows.length === 0) {
    const allDistricts = await db.collection('ilceler').getFullList({ sort: 'ad' });
    rows = allDistricts.filter((row) => Number(row.ilLegacyId) === ilLegacy);
    if (rows.length === 0 && plateGuess != null) {
      const byPlate = allDistricts.filter((row) => Number(row.ilLegacyId) === plateGuess);
      if (byPlate.length > 0) {
        rows = byPlate;
      }
    }
  }

  return mapRows(rows);
}

export async function getAllDistrictsWithCities() {
  requireDatabase();
  const db = await getDb();
  const [cities, districts] = await Promise.all([
    db.collection('iller').getFullList({ sort: 'ad' }),
    db.collection('ilceler').getFullList({ sort: 'ad' }),
  ]);
  const cityById = new Map(cities.map((row) => [Number(row.legacyId), row]));
  return sortByTurkishAd(
    districts.map((row) => {
      const city = cityById.get(Number(row.ilLegacyId));
      return {
        ad: row.ad as string,
        slug: row.slug as string,
        il: displayIlAd(city?.slug as string | undefined, city?.ad as string | undefined),
        ilSlug: (city?.slug as string | undefined) ?? '',
      };
    }),
  );
}

export async function getAllBranches() {
  requireDatabase();
  const db = await getDb();
  const rows = await db.collection('branslar').getFullList({ sort: 'ad' });
  const list = rows.map((row) =>
    enrichBranchFields({
      slug: row.slug as string,
      isim: row.ad as string,
      emoji: row.emoji as string,
      renk: row.renk as string,
      aciklama: row.aciklama as string,
    }),
  );
  return list.sort((a, b) => a.isim.localeCompare(b.isim, 'tr'));
}

export async function searchClubs(filters: SearchFilters) {
  requireDatabase();

  await expireDueMemberships();
  const db = await getDb();
  const [cities, districts, clubs, clubBranches, branches, programs] = await Promise.all([
    db.collection('iller').getFullList(),
    db.collection('ilceler').getFullList(),
    db.collection('kulupler').getFullList({ filter: 'durum = "approved"' }),
    db.collection('kulup_branslar').getFullList(),
    db.collection('branslar').getFullList(),
    db.collection('kulup_programlari').getFullList({ filter: 'aktif = true' }),
  ]);

  const cityById = new Map(cities.map((row) => [Number(row.legacyId), row]));
  const districtById = new Map(districts.map((row) => [Number(row.legacyId), row]));
  const branchById = new Map(branches.map((row) => [Number(row.legacyId), row]));
  const branchBySlug = new Map(branches.map((row) => [row.slug as string, row]));

  // Club ID -> Map of branchSlug to branch row (aggregates kulup_branslar and active kulup_programlari)
  const clubBranchMap = new Map<number, Map<string, Record<string, unknown>>>();

  for (const link of clubBranches) {
    const clubId = Number(link.kulupLegacyId);
    const branch = branchById.get(Number(link.bransLegacyId));
    if (branch) {
      if (!clubBranchMap.has(clubId)) clubBranchMap.set(clubId, new Map());
      clubBranchMap.get(clubId)!.set(branch.slug as string, branch as Record<string, unknown>);
    }
  }

  for (const p of programs) {
    const clubId = Number(p.kulupLegacyId);
    const pSlug = slugify(String(p.ad ?? ''));
    const targetSlug = pSlug === 'jimnastik' ? 'cimnastik' : pSlug;
    const branch = branchBySlug.get(targetSlug) ?? branchBySlug.get(pSlug);
    if (branch) {
      if (!clubBranchMap.has(clubId)) clubBranchMap.set(clubId, new Map());
      if (!clubBranchMap.get(clubId)!.has(branch.slug as string)) {
        clubBranchMap.get(clubId)!.set(branch.slug as string, branch as Record<string, unknown>);
      }
    }
  }

  const hasUserLocation = Number.isFinite(filters.userLat) && Number.isFinite(filters.userLng);

  const rows = clubs
    .map((club) => {
      const city = cityById.get(Number(club.ilLegacyId));
      const district = districtById.get(Number(club.ilceLegacyId));
      const cBranchesMap = clubBranchMap.get(Number(club.legacyId)) ?? new Map();
      const cBranchList = Array.from(cBranchesMap.values());

      let activeBranch = cBranchList[0];
      if (filters.brans && cBranchesMap.has(filters.brans)) {
        activeBranch = cBranchesMap.get(filters.brans);
      }

      const branchVisual = branchVisualFromRow(activeBranch);
      return {
        id: Number(club.legacyId),
        ad: club.ad as string,
        il: displayIlAd(city?.slug as string | undefined, city?.ad as string | undefined),
        ilSlug: (city?.slug as string | undefined) ?? '',
        brans: (activeBranch?.ad as string | undefined) ?? '',
        bransSlug: (activeBranch?.slug as string | undefined) ?? '',
        allBranchSlugs: Array.from(cBranchesMap.keys()),
        ilce: (district?.ad as string | undefined) ?? '',
        ilceSlug: (district?.slug as string | undefined) ?? '',
        adres: (club.adres as string) ?? '',
        yasAraligi: (club.yasAraligi as string) ?? '',
        fiyat: (club.fiyatBilgisi as string) ?? '',
        telefon: (club.telefon as string) ?? '',
        aciklama: (club.aciklama as string) ?? '',
        oneCikan: Boolean(club.oneCikan),
        puan: Number(club.puan ?? 0),
        yorumSayisi: Number(club.yorumSayisi ?? 0),
        emoji: branchVisual.emoji,
        renk: branchVisual.renk,
        enlem: Number(club.enlem ?? 0),
        boylam: Number(club.boylam ?? 0),
      };
    })
    .filter((club) => (!filters.il ? true : club.ilSlug === filters.il))
    .filter((club) => (!filters.ilce ? true : slugify(club.ilce) === filters.ilce))
    .filter((club) => (!filters.brans ? true : club.allBranchSlugs.includes(filters.brans)))
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
      endDate: string;
      isOngoing: boolean;
      days: string[];
      startTime: string;
      endTime: string;
      locationText: string;
      mapsUrl: string;
      aciklama: string;
      yasAraligi: string;
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
      endDate: parsed.content.endDate,
      isOngoing: parsed.content.isOngoing,
      days: parsed.content.days,
      startTime: parsed.content.startTime,
      endTime: parsed.content.endTime,
      locationText: parsed.content.locationText,
      mapsUrl: parsed.content.mapsUrl,
      aciklama: parsed.content.summary || parsed.legacyText || '',
      yasAraligi: parsed.content.yasAraligi,
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
      endDate: parsed.content.endDate,
      isOngoing: parsed.content.isOngoing,
      days: parsed.content.days,
      startTime: parsed.content.startTime,
      endTime: parsed.content.endTime,
      locationText: parsed.content.locationText,
      mapsUrl: parsed.content.mapsUrl,
      gallery: parsed.content.gallery,
      bodyJson: parsed.content.bodyJson,
      yasAraligi: parsed.content.yasAraligi,
    };
  });
}

export async function getProgramListingById(programId: number) {
  requireDatabase();
  await expireDueMemberships();
  const db = await getDb();

  const [program, clubs, cities, districts, clubBranches, branches] = await Promise.all([
    db.collection('kulup_programlari').getFirstListItem(`legacyId = ${programId} && aktif = true`).catch(() => null),
    db.collection('kulupler').getFullList({ filter: 'durum = "approved"' }),
    db.collection('iller').getFullList(),
    db.collection('ilceler').getFullList(),
    db.collection('kulup_branslar').getFullList(),
    db.collection('branslar').getFullList(),
  ]);

  if (!program) return null;
  const clubLegacyId = Number(program.kulupLegacyId);

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
    yasAraligi: parsed.content.yasAraligi,
    aciklama: parsed.content.summary || parsed.legacyText || '',
    gunSaat: (program.gunSaat as string) ?? '',
    seviye: (program.seviye as string) ?? '',
    ucretBilgisi: (program.ucretBilgisi as string) ?? '',
    aktif: Boolean(program.aktif),
    eventDate: parsed.content.eventDate,
    endDate: parsed.content.endDate,
    isOngoing: parsed.content.isOngoing,
    days: parsed.content.days,
    startTime: parsed.content.startTime,
    endTime: parsed.content.endTime,
    locationText:
      parsed.content.locationText ||
      ((district?.ad as string | undefined) ?? displayIlAd(city?.slug as string | undefined, city?.ad as string | undefined) ?? ''),
    mapsUrl: parsed.content.mapsUrl,
    gallery: parsed.content.gallery,
    bodyJson: parsed.content.bodyJson,
    club: (() => {
      const branchVisual = branchVisualFromRow(branch as Record<string, unknown> | undefined);
      return {
        id: Number(club.legacyId),
        ad: (club.ad as string) ?? '',
        il: displayIlAd(city?.slug as string | undefined, city?.ad as string | undefined),
        ilce: (district?.ad as string | undefined) ?? '',
        adres: (club.adres as string) ?? '',
        aciklama: (club.aciklama as string) ?? '',
        telefon: (club.telefon as string) ?? '',
        email: (club.email as string) ?? '',
        yasAraligi: (club.yasAraligi as string) ?? '',
        puan: Number(club.puan ?? 0),
        yorumSayisi: Number(club.yorumSayisi ?? 0),
        enlem: Number(club.enlem ?? 0),
        boylam: Number(club.boylam ?? 0),
        emoji: branchVisual.emoji,
        renk: branchVisual.renk,
        brans: (branch?.ad as string | undefined) ?? '',
        bransSlug: (branch?.slug as string | undefined) ?? '',
      };
    })(),
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
  const [clubs, clubBranches, programs, branches] = await Promise.all([
    db.collection('kulupler').getFullList(),
    db.collection('kulup_branslar').getFullList().catch(() => []),
    db.collection('kulup_programlari').getFullList().catch(() => []),
    db.collection('branslar').getFullList().catch(() => []),
  ]);
  const all = clubs.length;
  const pending = clubs.filter((item) => item.durum === 'pending').length;
  const approved = clubs.filter((item) => item.durum === 'approved').length;
  const rejected = clubs.filter((item) => item.durum === 'rejected').length;

  const branchById = new Map(branches.map((b) => [Number(b.legacyId), b]));
  const branchBySlug = new Map(branches.map((b) => [String(b.slug ?? ''), b]));

  const distinctBranchSlugs = new Set<string>();

  for (const link of clubBranches) {
    const branch = branchById.get(Number(link.bransLegacyId));
    if (branch?.slug) distinctBranchSlugs.add(String(branch.slug));
  }

  for (const p of programs) {
    const pSlug = slugify(String(p.ad ?? ''));
    const targetSlug = pSlug === 'jimnastik' ? 'cimnastik' : pSlug;
    const branch = branchBySlug.get(targetSlug) ?? branchBySlug.get(pSlug);
    if (branch?.slug) distinctBranchSlugs.add(String(branch.slug));
  }

  return {
    total: all,
    pending,
    approved,
    rejected,
    branchCount: distinctBranchSlugs.size,
    totalBranches: branches.length,
  };
}

export type TopNewsItem = {
  id: string;
  baslik: string;
  slug: string;
  clicks: number;
  impressions: number;
  kategori: string;
  tarih: string;
};

export type TopListingItem = {
  id: string;
  ad: string;
  kulupAd: string;
  il: string;
  ilce: string;
  url: string;
  ucret: string;
  gunSaat: string;
  clicks: number;
  impressions: number;
};

export async function getDashboardAnalytics(): Promise<{
  topNews: TopNewsItem[];
  topListings: TopListingItem[];
}> {
  requireDatabase();
  const db = await getDb();

  let topNews: TopNewsItem[] = [];
  try {
    const newsRows = await db.collection('haberler').getFullList({
      filter: 'aktif = true',
      sort: '-gsc_tiklama,-gsc_gosterim',
    });
    topNews = newsRows.slice(0, 5).map((row) => ({
      id: String(row.id),
      baslik: String(row.baslik ?? ''),
      slug: String(row.slug ?? ''),
      clicks: Number(row.gsc_tiklama ?? 0),
      impressions: Number(row.gsc_gosterim ?? 0),
      kategori: String(row.kategori ?? 'Haber'),
      tarih: String(row.tarih ?? ''),
    }));
  } catch (err) {
    console.error('Dashboard top news alinamadi:', err);
  }

  let topListings: TopListingItem[] = [];
  try {
    const [programs, clubs, cities, districts] = await Promise.all([
      db.collection('kulup_programlari').getFullList({ filter: 'aktif = true' }),
      db.collection('kulupler').getFullList({ filter: 'durum = "approved"' }),
      db.collection('iller').getFullList(),
      db.collection('ilceler').getFullList(),
    ]);

    const cityById = new Map(cities.map((c) => [Number(c.legacyId), c]));
    const districtById = new Map(districts.map((d) => [Number(d.legacyId), d]));
    const clubById = new Map(clubs.map((c) => [Number(c.legacyId), c]));

    topListings = programs.slice(0, 5).map((p) => {
      const club = clubById.get(Number(p.kulupLegacyId));
      const city = club ? cityById.get(Number(club.ilLegacyId)) : null;
      const district = club ? districtById.get(Number(club.ilceLegacyId)) : null;
      const clubAd = String(club?.ad ?? 'Spor Kulübü');
      const progAd = String(p.ad ?? 'Kurs Programı');
      const progId = p.legacyId || p.id;
      const slug = listingSlug({ id: progId, ad: progAd, clubAd });

      return {
        id: String(p.id),
        ad: progAd,
        kulupAd: clubAd,
        il: String(city?.ad ?? club?.il ?? '-'),
        ilce: String(district?.ad ?? club?.ilce ?? '-'),
        url: `/ilanlar/${slug}`,
        ucret: String(p.ucretBilgisi ?? ''),
        gunSaat: String(p.gunSaat ?? ''),
        clicks: Number(p.gsc_tiklama ?? 0),
        impressions: Number(p.gsc_gosterim ?? 0),
      };
    });
  } catch (err) {
    console.error('Dashboard top listings alinamadi:', err);
  }

  return { topNews, topListings };
}

