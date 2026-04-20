import { desc, eq } from 'drizzle-orm';
import { getDb, hasDatabaseUrl } from '../../db/client';
import { basvuruBelgeleri } from '../../db/schema';

export type ApplicationDocumentKind = 'dekont' | 'kimlik' | 'sozlesme' | 'diger';

export type CreateApplicationDocumentInput = {
  applicationId: number;
  kind: ApplicationDocumentKind;
  storageKey: string;
  originalFilename: string;
  mimeType: string;
  byteSize: number;
};

function requireDatabase() {
  if (!hasDatabaseUrl()) {
    throw new Error('DATABASE_URL is not configured.');
  }
}

export async function createApplicationDocument(input: CreateApplicationDocumentInput) {
  requireDatabase();

  const db = getDb();
  const [row] = await db
    .insert(basvuruBelgeleri)
    .values({
      basvuruId: input.applicationId,
      tur: input.kind,
      storageKey: input.storageKey,
      orijinalDosyaAdi: input.originalFilename,
      mimeType: input.mimeType,
      byteSize: input.byteSize,
    })
    .returning({ id: basvuruBelgeleri.id });

  return { id: row.id, mode: 'db' as const };
}

export async function listApplicationDocuments(applicationId: number) {
  requireDatabase();

  const db = getDb();
  return db
    .select({
      id: basvuruBelgeleri.id,
      applicationId: basvuruBelgeleri.basvuruId,
      kind: basvuruBelgeleri.tur,
      storageKey: basvuruBelgeleri.storageKey,
      originalFilename: basvuruBelgeleri.orijinalDosyaAdi,
      mimeType: basvuruBelgeleri.mimeType,
      byteSize: basvuruBelgeleri.byteSize,
      createdAt: basvuruBelgeleri.createdAt,
    })
    .from(basvuruBelgeleri)
    .where(eq(basvuruBelgeleri.basvuruId, applicationId))
    .orderBy(desc(basvuruBelgeleri.createdAt));
}

export async function getApplicationDocumentById(id: number) {
  requireDatabase();

  const db = getDb();
  const [row] = await db
    .select({
      id: basvuruBelgeleri.id,
      applicationId: basvuruBelgeleri.basvuruId,
      kind: basvuruBelgeleri.tur,
      storageKey: basvuruBelgeleri.storageKey,
      originalFilename: basvuruBelgeleri.orijinalDosyaAdi,
      mimeType: basvuruBelgeleri.mimeType,
      byteSize: basvuruBelgeleri.byteSize,
      createdAt: basvuruBelgeleri.createdAt,
    })
    .from(basvuruBelgeleri)
    .where(eq(basvuruBelgeleri.id, id))
    .limit(1);

  return row ?? null;
}
