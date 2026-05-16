import { getDb, hasDatabaseUrl } from '../../db/client';

/** Admin onayında seçilen üyelik süresi (başvuru formu: 6 aylık / yıllık). */
export type MembershipPeriod = 'six_month' | 'yearly';

function requireDatabase() {
  if (!hasDatabaseUrl()) {
    throw new Error('POCKETBASE_URL is not configured.');
  }
}

const DEFAULT_PLANS = [
  {
    kod: 'alti-aylik',
    ad: '6 Aylık',
    ucret: 7500,
    periyot: 'one_time' as const,
    aciklama: '6 aylık paket: 7500 TL.',
  },
  {
    kod: 'on-iki-aylik',
    ad: 'Yıllık',
    ucret: 12000,
    periyot: 'yearly' as const,
    aciklama: 'Yıllık paket: 12000 TL.',
  },
];

export function normalizeMembershipPeriod(value: unknown): MembershipPeriod {
  if (value === 'yearly' || value === 'on-iki-aylik' || value === 'yillik') return 'yearly';
  return 'six_month';
}

export function membershipPeriodFromPackageCode(kod: string | undefined): MembershipPeriod | null {
  if (!kod) return null;
  if (kod === 'on-iki-aylik' || kod === 'yillik') return 'yearly';
  if (kod === 'alti-aylik' || kod === 'aylik') return 'six_month';
  return null;
}

function addPeriod(startAt: Date, period: MembershipPeriod) {
  const next = new Date(startAt);
  if (period === 'yearly') {
    next.setFullYear(next.getFullYear() + 1);
    return next;
  }
  next.setMonth(next.getMonth() + 6);
  return next;
}

export function packageCodeForPeriod(period: MembershipPeriod) {
  return period === 'yearly' ? 'on-iki-aylik' : 'alti-aylik';
}

/** Ekranda gösterim — `aylik` paketi artık 6 aylık sayılır (eski veri). */
export function formatMembershipPackageLabel(kod?: string, ad?: string) {
  if (kod === 'alti-aylik' || kod === 'aylik') return '6 Aylık';
  if (kod === 'on-iki-aylik' || kod === 'yillik') return 'Yıllık';
  if (ad && /12\s*aylık|yıllık/i.test(ad)) return 'Yıllık';
  if (ad && /6\s*aylık|aylık/i.test(ad) && !/12/i.test(ad)) return '6 Aylık';
  return ad || kod || '—';
}

async function ensureMembershipPlan(period: MembershipPeriod) {
  const db = await getDb();
  const preferredCode = packageCodeForPeriod(period);
  const existing = await db
    .collection('uyelik_paketleri')
    .getFirstListItem(`kod = "${preferredCode}"`)
    .catch(() => null);
  if (existing) {
    return Number(existing.legacyId);
  }

  const mockPlan = DEFAULT_PLANS.find((plan) => plan.kod === preferredCode) ?? DEFAULT_PLANS[0];
  const created = await db.collection('uyelik_paketleri').create({
    legacyId: Date.now(),
    kod: mockPlan.kod,
    ad: mockPlan.ad,
    aciklama: mockPlan.aciklama,
    ucret: mockPlan.ucret,
    periyot: mockPlan.periyot,
    aktif: true,
  });
  return Number(created.legacyId);
}

async function getClubMembershipRow(clubId: number) {
  const db = await getDb();
  return db
    .collection('kulup_uyelikleri')
    .getFirstListItem(`kulupLegacyId = ${clubId}`, { sort: '-legacyId' })
    .catch(() => null);
}

async function ensureClubMembershipRow(clubId: number, period: MembershipPeriod) {
  const db = await getDb();
  const existing = await getClubMembershipRow(clubId);
  const planId = await ensureMembershipPlan(period);
  if (existing) {
    if (Number(existing.paketLegacyId) !== planId) {
      await db.collection('kulup_uyelikleri').update(existing.id, { paketLegacyId: planId });
    }
    return existing;
  }

  return db.collection('kulup_uyelikleri').create({
    legacyId: Date.now() + 1,
    kulupLegacyId: clubId,
    paketLegacyId: planId,
    odemeDurumu: 'pending',
  });
}

/** Onaylı kulüpte paket/periyot senkronu (6 aylık seçildiğinde aylık pakete düşmesin). */
export async function syncClubMembershipPeriod(clubId: number, period: MembershipPeriod) {
  requireDatabase();
  await ensureClubMembershipRow(clubId, period);
  const sub = await getClubMembershipRow(clubId);
  if (sub?.odemeDurumu === 'paid') {
    return activateClubMembership(clubId, period);
  }
  return { ok: true as const };
}

export async function activateClubMembership(clubId: number, period: MembershipPeriod) {
  requireDatabase();
  const db = await getDb();
  const existing = await ensureClubMembershipRow(clubId, period);

  const startAt = new Date();
  const endAt = addPeriod(startAt, period);

  const withDates = {
    odemeDurumu: 'paid',
    baslangicTarihi: startAt.toISOString(),
    bitisTarihi: endAt.toISOString(),
  };

  let row;
  try {
    row = await db.collection('kulup_uyelikleri').update(existing.id, withDates);
  } catch {
    row = await db.collection('kulup_uyelikleri').update(existing.id, { odemeDurumu: 'paid' });
  }

  return {
    id: Number(row.legacyId),
    clubId: Number(row.kulupLegacyId),
    paymentStatus: row.odemeDurumu as 'pending' | 'paid' | 'expired',
    startAt: (row.baslangicTarihi as string | undefined) ?? '',
    endAt: (row.bitisTarihi as string | undefined) ?? '',
  };
}

export async function expireDueMemberships() {
  requireDatabase();
  try {
    const db = await getDb();
    const nowMs = Date.now();
    const paidRows = await db.collection('kulup_uyelikleri').getFullList({ filter: 'odemeDurumu = "paid"' }).catch(() => []);
    let expired = 0;
    for (const row of paidRows) {
      const endRaw = row.bitisTarihi as string | undefined;
      if (!endRaw || String(endRaw).trim() === '') continue;
      const endMs = new Date(endRaw).getTime();
      if (Number.isNaN(endMs) || endMs > nowMs) continue;
      await db.collection('kulup_uyelikleri').update(row.id, { odemeDurumu: 'expired' }).catch(() => undefined);
      expired += 1;
    }
    return expired;
  } catch {
    return 0;
  }
}

export async function hasActiveMembership(clubId: number) {
  requireDatabase();
  await expireDueMemberships();
  const db = await getDb();
  const row = await getClubMembershipRow(clubId);
  if (!row) return false;
  if (row.odemeDurumu !== 'paid') return false;
  const endRaw = (row.bitisTarihi as string | undefined) ?? '';
  if (!String(endRaw).trim()) return true;
  const endMs = new Date(endRaw).getTime();
  if (Number.isNaN(endMs)) return true;
  return endMs > Date.now();
}

/**
 * Onaylı kulüpte üyelik satırı hâlâ `pending` ise (onay API'si kaçırdıysa veya eski veri) `paid` yapar.
 * Süresi dolmuş üyeliği bilinçli olarak yenilemez; yalnızca bekleyen ödeme satırını kapatır.
 */
export async function ensureApprovedClubMembershipPaidForUser(
  userId: number,
  period: MembershipPeriod = 'six_month',
) {
  requireDatabase();
  const db = await getDb();
  const link = await db
    .collection('kulup_uyelik_kullanicilari')
    .getFirstListItem(`kullaniciLegacyId = ${userId}`)
    .catch(() => null);
  if (!link) return { ok: false as const, reason: 'no_club_link' };
  const clubId = Number(link.kulupLegacyId);
  const club = await db.collection('kulupler').getFirstListItem(`legacyId = ${clubId}`).catch(() => null);
  if (!club || club.durum !== 'approved') {
    return { ok: false as const, reason: 'club_not_approved' };
  }

  const sub = await getClubMembershipRow(clubId);
  if (!sub) return { ok: false as const, reason: 'no_membership_row' };

  let effectivePeriod = period;
  if (sub.paketLegacyId) {
    const plan = await db
      .collection('uyelik_paketleri')
      .getFirstListItem(`legacyId = ${Number(sub.paketLegacyId)}`)
      .catch(() => null);
    const fromPackage = membershipPeriodFromPackageCode(plan?.kod as string | undefined);
    if (fromPackage) effectivePeriod = fromPackage;
  }

  if (sub.odemeDurumu === 'pending') {
    try {
      await activateClubMembership(clubId, effectivePeriod);
    } catch {
      return { ok: false as const, reason: 'activate_failed' };
    }
  }

  if (await hasActiveMembership(clubId)) {
    return { ok: true as const, reason: 'active' };
  }
  return { ok: false as const, reason: 'membership_not_active' };
}
