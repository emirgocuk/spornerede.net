import crypto from 'node:crypto';
import { getDb, hasDatabaseUrl } from '../../db/client';

export type UserRole = 'admin' | 'club';
export type ClubMembershipRole = 'owner' | 'staff';

export type CreateUserInput = {
  email: string;
  passwordHash: string;
  role?: UserRole;
  forcePasswordChange?: boolean;
};

export async function createUser(input: CreateUserInput) {
  if (!hasDatabaseUrl()) {
    throw new Error('POCKETBASE_URL is not configured.');
  }
  const db = await getDb();
  const row = await db.collection('kullanicilar').create({
    legacyId: Date.now(),
    email: input.email.toLowerCase().trim(),
    passwordHash: input.passwordHash,
    rol: input.role ?? 'club',
    aktif: true,
    sifreDegistirmeZorunlu: input.forcePasswordChange ?? false,
  });
  return { id: Number(row.legacyId), email: row.email as string, rol: row.rol as UserRole };
}

export async function updateUserPassword(
  userId: number,
  passwordHash: string,
  options?: { forcePasswordChange?: boolean }
) {
  if (!hasDatabaseUrl()) {
    throw new Error('POCKETBASE_URL is not configured.');
  }
  const db = await getDb();
  const user = await db.collection('kullanicilar').getFirstListItem(`legacyId = ${userId}`).catch(() => null);
  if (!user) return null;
  const row = await db.collection('kullanicilar').update(user.id, {
    passwordHash,
    sifreDegistirmeZorunlu: options?.forcePasswordChange ?? false,
  });
  return { id: Number(row.legacyId), email: row.email as string };
}

export async function findUserByEmail(email: string) {
  if (!hasDatabaseUrl()) {
    return null;
  }
  const db = await getDb();
  const row = await db
    .collection('kullanicilar')
    .getFirstListItem(`email = "${email.toLowerCase().trim().replace(/"/g, '\\"')}"`)
    .catch(() => null);
  if (!row) return null;
  return {
    id: Number(row.legacyId),
    email: row.email as string,
    passwordHash: row.passwordHash as string,
    rol: row.rol as UserRole,
    aktif: Boolean(row.aktif),
    mustChangePassword: Boolean(row.sifreDegistirmeZorunlu),
  };
}

function hashToken(token: string) {
  return crypto.createHash('sha256').update(token).digest('hex');
}

export async function createSession(userId: number, ttlDays = 14) {
  if (!hasDatabaseUrl()) {
    throw new Error('POCKETBASE_URL is not configured.');
  }
  const db = await getDb();
  const token = crypto.randomBytes(32).toString('hex');
  const tokenHash = hashToken(token);
  const expiresAt = new Date(Date.now() + ttlDays * 24 * 60 * 60 * 1000);

  await db.collection('oturumlar').create({
    legacyId: Date.now(),
    kullaniciLegacyId: userId,
    tokenHash,
    expiresAt: expiresAt.toISOString(),
  });

  return { token, expiresAt };
}

export async function getSessionWithUser(token: string) {
  if (!hasDatabaseUrl()) {
    return null;
  }
  const db = await getDb();
  const tokenHash = hashToken(token);
  const session = await db
    .collection('oturumlar')
    .getFirstListItem(`tokenHash = "${tokenHash}" && expiresAt > "${new Date().toISOString()}"`)
    .catch(() => null);
  if (!session) return null;
  const user = await db
    .collection('kullanicilar')
    .getFirstListItem(`legacyId = ${Number(session.kullaniciLegacyId)}`)
    .catch(() => null);
  if (!user) return null;
  return {
    sessionId: Number(session.legacyId),
    expiresAt: session.expiresAt as string,
    userId: Number(user.legacyId),
    email: user.email as string,
    role: user.rol as UserRole,
    isActive: Boolean(user.aktif),
    mustChangePassword: Boolean(user.sifreDegistirmeZorunlu),
  };
}

export async function deleteSession(token: string) {
  if (!hasDatabaseUrl()) {
    return;
  }
  const db = await getDb();
  const tokenHash = hashToken(token);
  const matches = await db.collection('oturumlar').getFullList({ filter: `tokenHash = "${tokenHash}"` });
  await Promise.all(matches.map((item) => db.collection('oturumlar').delete(item.id)));
}

export async function assignUserToClub(userId: number, clubId: number, role: ClubMembershipRole = 'staff') {
  if (!hasDatabaseUrl()) {
    throw new Error('POCKETBASE_URL is not configured.');
  }
  const db = await getDb();
  const existing = await db
    .collection('kulup_uyelik_kullanicilari')
    .getFirstListItem(`kullaniciLegacyId = ${userId} && kulupLegacyId = ${clubId}`)
    .catch(() => null);
  if (existing) {
    return null;
  }
  const row = await db.collection('kulup_uyelik_kullanicilari').create({
    legacyId: Date.now(),
    kullaniciLegacyId: userId,
    kulupLegacyId: clubId,
    rol: role,
  });
  return {
    id: Number(row.legacyId),
    kullaniciId: Number(row.kullaniciLegacyId),
    kulupId: Number(row.kulupLegacyId),
    rol: row.rol as ClubMembershipRole,
  };
}

export async function ensureClubUserForClub(input: {
  email: string;
  passwordHash: string;
  clubId: number;
  membershipRole?: ClubMembershipRole;
}) {
  if (!hasDatabaseUrl()) {
    throw new Error('POCKETBASE_URL is not configured.');
  }
  const db = await getDb();
  const normalizedEmail = input.email.toLowerCase().trim();
  let user = await findUserByEmail(normalizedEmail);

  if (!user) {
    const created = await db.collection('kullanicilar').create({
      legacyId: Date.now(),
      email: normalizedEmail,
      passwordHash: input.passwordHash,
      rol: 'club',
      aktif: true,
      sifreDegistirmeZorunlu: true,
    });
    user = {
      id: Number(created.legacyId),
      email: created.email as string,
      passwordHash: created.passwordHash as string,
      rol: created.rol as UserRole,
      aktif: Boolean(created.aktif),
      mustChangePassword: Boolean(created.sifreDegistirmeZorunlu),
    };
  } else {
    await updateUserPassword(user.id, input.passwordHash, { forcePasswordChange: true });
  }

  await assignUserToClub(user.id, input.clubId, input.membershipRole ?? 'owner');

  const club = await db
    .collection('kulupler')
    .getFirstListItem(`legacyId = ${input.clubId}`)
    .catch(() => null);

  return {
    userId: user.id,
    email: user.email,
    clubId: input.clubId,
    clubName: (club?.ad as string | undefined) ?? '',
  };
}

export async function getUserPrimaryClub(userId: number) {
  if (!hasDatabaseUrl()) {
    return null;
  }
  const db = await getDb();
  const membership = await db
    .collection('kulup_uyelik_kullanicilari')
    .getFirstListItem(`kullaniciLegacyId = ${userId}`)
    .catch(() => null);
  if (!membership) return null;
  const club = await db
    .collection('kulupler')
    .getFirstListItem(`legacyId = ${Number(membership.kulupLegacyId)}`)
    .catch(() => null);
  if (!club) return null;
  return {
    clubId: Number(membership.kulupLegacyId),
    membershipRole: membership.rol as ClubMembershipRole,
    clubName: club.ad as string,
    clubStatus: club.durum as 'pending' | 'approved' | 'rejected',
  };
}
