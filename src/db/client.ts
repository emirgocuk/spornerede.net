import { drizzle } from 'drizzle-orm/node-postgres';
import { Pool } from 'pg';

let dbInstance: ReturnType<typeof drizzle> | null = null;

function getDatabaseUrl() {
  const astroEnvUrl = (import.meta as { env?: Record<string, string | undefined> }).env?.DATABASE_URL;
  return astroEnvUrl ?? process.env.DATABASE_URL ?? '';
}

export function hasDatabaseUrl() {
  return Boolean(getDatabaseUrl());
}

export function getDb() {
  const databaseUrl = getDatabaseUrl();
  if (!databaseUrl) {
    throw new Error('DATABASE_URL is not configured.');
  }
  if (dbInstance) {
    return dbInstance;
  }

  const pool = new Pool({
    connectionString: databaseUrl,
    max: 10,
  });

  dbInstance = drizzle(pool);
  return dbInstance;
}

