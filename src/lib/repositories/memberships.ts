import { getDb, hasDatabaseUrl } from '../../db/client';
import { MEMBERSHIP_PLANS } from '../../data/mockData';

export type MembershipPeriod = 'monthly' | 'yearly';

function requireDatabase() {
  if (!hasDatabaseUrl()) {
    throw new Error('POCKETBASE_URL is not configured.');
  }
}

function addPeriod(startAt: Date, period: MembershipPeriod) {
  const next = new Date(startAt);
  if (period === 'yearly') {
    next.setFullYear(next.getFullYear() + 1);
    return next;
  }
  next.setMonth(next.getMonth() + 1);
  return next;
}

async function ensureMembershipPlan(period: MembershipPeriod) {
  const db = await getDb();
  const preferredCode = period === 'yearly' ? 'on-iki-aylik' : 'aylik';
  const fallbackCode = period === 'yearly' ? 'yillik' : 'aylik';
  const existing = await db
    .collection('uyelik_paketleri')
    .getFirstListItem(`kod = "${preferredCode}" || kod = "${fallbackCode}"`)
    .catch(() => null);
  if (existing) {
    return Number(existing.legacyId);
  }

  const mockPlan = MEMBERSHIP_PLANS.find((plan) => plan.kod === preferredCode) ?? MEMBERSHIP_PLANS[0];
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

async function ensureClubMembershipRow(clubId: number, period: MembershipPeriod) {
  const db = await getDb();
  const existing = await db
    .collection('kulup_uyelikleri')
    .getFirstListItem(`kulupLegacyId = ${clubId}`, { sort: '-legacyId' })
    .catch(() => null);
  if (existing) return existing;

  const planId = await ensureMembershipPlan(period);
  return db.collection('kulup_uyelikleri').create({
    legacyId: Date.now() + 1,
    kulupLegacyId: clubId,
    paketLegacyId: planId,
    odemeDurumu: 'pending',
  });
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
  const row = await db
    .collection('kulup_uyelikleri')
    .getFirstListItem(`kulupLegacyId = ${clubId}`, { sort: '-legacyId' })
    .catch(() => null);
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
export async function ensureApprovedClubMembershipPaidForUser(userId: number, period: MembershipPeriod = 'monthly') {
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

  const sub = await db
    .collection('kulup_uyelikleri')
    .getFirstListItem(`kulupLegacyId = ${clubId}`, { sort: '-legacyId' })
    .catch(() => null);
  if (!sub) return { ok: false as const, reason: 'no_membership_row' };

  if (sub.odemeDurumu === 'pending') {
    try {
      await activateClubMembership(clubId, period);
    } catch {
      return { ok: false as const, reason: 'activate_failed' };
    }
  }

  if (await hasActiveMembership(clubId)) {
    return { ok: true as const, reason: 'active' };
  }
  return { ok: false as const, reason: 'membership_not_active' };
}

