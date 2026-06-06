import PocketBase from 'pocketbase';

let dbInstance: PocketBase | null = null;
let authInFlight: Promise<void> | null = null;

function getPocketBaseUrl() {
  const astroEnvUrl = (import.meta as { env?: Record<string, string | undefined> }).env?.POCKETBASE_URL;
  return process.env.POCKETBASE_URL ?? astroEnvUrl ?? '';
}

function getPocketBaseAdminEmail() {
  const astroEnvValue = (import.meta as { env?: Record<string, string | undefined> }).env?.POCKETBASE_ADMIN_EMAIL;
  return process.env.POCKETBASE_ADMIN_EMAIL ?? astroEnvValue ?? '';
}

function getPocketBaseAdminPassword() {
  const astroEnvValue = (import.meta as { env?: Record<string, string | undefined> }).env?.POCKETBASE_ADMIN_PASSWORD;
  return process.env.POCKETBASE_ADMIN_PASSWORD ?? astroEnvValue ?? '';
}

export function hasDatabaseUrl() {
  return Boolean(getPocketBaseUrl());
}

async function authenticateAsAdmin(pb: PocketBase) {
  if (pb.authStore.isValid) {
    return;
  }
  if (authInFlight) {
    await authInFlight;
    return;
  }
  const email = getPocketBaseAdminEmail();
  const password = getPocketBaseAdminPassword();
  if (!email || !password) {
    throw new Error('POCKETBASE_ADMIN_EMAIL / POCKETBASE_ADMIN_PASSWORD are not configured.');
  }
  authInFlight = pb
    .collection('_superusers')
    .authWithPassword(email, password)
    .then(() => undefined)
    .finally(() => {
      authInFlight = null;
    });
  await authInFlight;
}

export async function getDb() {
  const pocketbaseUrl = getPocketBaseUrl();
  if (!pocketbaseUrl) {
    throw new Error('POCKETBASE_URL is not configured.');
  }

  if (!dbInstance) {
    dbInstance = new PocketBase(pocketbaseUrl);
    dbInstance.autoCancellation(false);
  }

  await authenticateAsAdmin(dbInstance);
  return dbInstance;
}

export function resetDb() {
  dbInstance = null;
  authInFlight = null;
}

