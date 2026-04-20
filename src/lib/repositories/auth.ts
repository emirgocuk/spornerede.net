import crypto from 'node:crypto';
import { and, eq, gt } from 'drizzle-orm';
import { getDb, hasDatabaseUrl } from '../../db/client';
import { kullanicilar, kulupUyelikKullanicilari, kulupler, oturumlar } from '../../db/schema';

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
    throw new Error('DATABASE_URL is not configured.');
  }
  const db = getDb();
  const [row] = await db
    .insert(kullanicilar)
    .values({
      email: input.email.toLowerCase().trim(),
      passwordHash: input.passwordHash,
      rol: input.role ?? 'club',
      sifreDegistirmeZorunlu: input.forcePasswordChange ?? false,
    })
    .returning({ id: kullanicilar.id, email: kullanicilar.email, rol: kullanicilar.rol });
  return row;
}

export async function updateUserPassword(
  userId: number,
  passwordHash: string,
  options?: { forcePasswordChange?: boolean }
) {
  if (!hasDatabaseUrl()) {
    throw new Error('DATABASE_URL is not configured.');
  }
  const db = getDb();
  const [row] = await db
    .update(kullanicilar)
    .set({
      passwordHash,
      sifreDegistirmeZorunlu: options?.forcePasswordChange ?? false,
      updatedAt: new Date(),
    })
    .where(eq(kullanicilar.id, userId))
    .returning({ id: kullanicilar.id, email: kullanicilar.email });
  return row ?? null;
}

export async function findUserByEmail(email: string) {
  if (!hasDatabaseUrl()) {
    return null;
  }
  const db = getDb();
  const [row] = await db
    .select({
      id: kullanicilar.id,
      email: kullanicilar.email,
      passwordHash: kullanicilar.passwordHash,
      rol: kullanicilar.rol,
      aktif: kullanicilar.aktif,
      mustChangePassword: kullanicilar.sifreDegistirmeZorunlu,
    })
    .from(kullanicilar)
    .where(eq(kullanicilar.email, email.toLowerCase().trim()))
    .limit(1);
  return row ?? null;
}

function hashToken(token: string) {
  return crypto.createHash('sha256').update(token).digest('hex');
}

export async function createSession(userId: number, ttlDays = 14) {
  if (!hasDatabaseUrl()) {
    throw new Error('DATABASE_URL is not configured.');
  }
  const db = getDb();
  const token = crypto.randomBytes(32).toString('hex');
  const tokenHash = hashToken(token);
  const expiresAt = new Date(Date.now() + ttlDays * 24 * 60 * 60 * 1000);

  await db.insert(oturumlar).values({
    kullaniciId: userId,
    tokenHash,
    expiresAt,
  });

  return { token, expiresAt };
}

export async function getSessionWithUser(token: string) {
  if (!hasDatabaseUrl()) {
    return null;
  }
  const db = getDb();
  const tokenHash = hashToken(token);

  const [row] = await db
    .select({
      sessionId: oturumlar.id,
      expiresAt: oturumlar.expiresAt,
      userId: kullanicilar.id,
      email: kullanicilar.email,
      role: kullanicilar.rol,
      isActive: kullanicilar.aktif,
      mustChangePassword: kullanicilar.sifreDegistirmeZorunlu,
    })
    .from(oturumlar)
    .innerJoin(kullanicilar, eq(oturumlar.kullaniciId, kullanicilar.id))
    .where(and(eq(oturumlar.tokenHash, tokenHash), gt(oturumlar.expiresAt, new Date())))
    .limit(1);

  return row ?? null;
}

export async function deleteSession(token: string) {
  if (!hasDatabaseUrl()) {
    return;
  }
  const db = getDb();
  const tokenHash = hashToken(token);
  await db.delete(oturumlar).where(eq(oturumlar.tokenHash, tokenHash));
}

export async function assignUserToClub(userId: number, clubId: number, role: ClubMembershipRole = 'staff') {
  if (!hasDatabaseUrl()) {
    throw new Error('DATABASE_URL is not configured.');
  }
  const db = getDb();
  const [row] = await db
    .insert(kulupUyelikKullanicilari)
    .values({ kullaniciId: userId, kulupId: clubId, rol: role })
    .onConflictDoNothing()
    .returning({
      id: kulupUyelikKullanicilari.id,
      kullaniciId: kulupUyelikKullanicilari.kullaniciId,
      kulupId: kulupUyelikKullanicilari.kulupId,
      rol: kulupUyelikKullanicilari.rol,
    });

  return row ?? null;
}

export async function ensureClubUserForClub(input: {
  email: string;
  passwordHash: string;
  clubId: number;
  membershipRole?: ClubMembershipRole;
}) {
  if (!hasDatabaseUrl()) {
    throw new Error('DATABASE_URL is not configured.');
  }
  const db = getDb();
  const normalizedEmail = input.email.toLowerCase().trim();
  let user = await findUserByEmail(normalizedEmail);

  if (!user) {
    const [created] = await db
      .insert(kullanicilar)
      .values({
        email: normalizedEmail,
        passwordHash: input.passwordHash,
        rol: 'club',
        sifreDegistirmeZorunlu: true,
      })
      .returning({
        id: kullanicilar.id,
        email: kullanicilar.email,
        passwordHash: kullanicilar.passwordHash,
        rol: kullanicilar.rol,
        aktif: kullanicilar.aktif,
      });
    user = created;
  } else {
    await updateUserPassword(user.id, input.passwordHash, { forcePasswordChange: true });
  }

  await assignUserToClub(user.id, input.clubId, input.membershipRole ?? 'owner');

  const [club] = await db
    .select({ id: kulupler.id, ad: kulupler.ad })
    .from(kulupler)
    .where(eq(kulupler.id, input.clubId))
    .limit(1);

  return {
    userId: user.id,
    email: user.email,
    clubId: input.clubId,
    clubName: club?.ad ?? '',
  };
}

export async function getUserPrimaryClub(userId: number) {
  if (!hasDatabaseUrl()) {
    return null;
  }
  const db = getDb();
  const [row] = await db
    .select({
      clubId: kulupUyelikKullanicilari.kulupId,
      membershipRole: kulupUyelikKullanicilari.rol,
      clubName: kulupler.ad,
      clubStatus: kulupler.durum,
    })
    .from(kulupUyelikKullanicilari)
    .innerJoin(kulupler, eq(kulupUyelikKullanicilari.kulupId, kulupler.id))
    .where(eq(kulupUyelikKullanicilari.kullaniciId, userId))
    .limit(1);

  return row ?? null;
}
