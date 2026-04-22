import { getDb, hasDatabaseUrl } from '../../db/client';

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
    throw new Error('POCKETBASE_URL is not configured.');
  }
}

export async function createApplicationDocument(input: CreateApplicationDocumentInput) {
  requireDatabase();

  const db = await getDb();
  const row = await db.collection('basvuru_belgeleri').create({
    legacyId: Date.now(),
    basvuruLegacyId: input.applicationId,
    tur: input.kind,
    storageKey: input.storageKey,
    orijinalDosyaAdi: input.originalFilename,
    mimeType: input.mimeType,
    byteSize: input.byteSize,
  });

  return { id: Number(row.legacyId), mode: 'db' as const };
}

export async function listApplicationDocuments(applicationId: number) {
  requireDatabase();

  const db = await getDb();
  const rows = await db.collection('basvuru_belgeleri').getFullList({
    filter: `basvuruLegacyId = ${applicationId}`,
    sort: '-legacyId',
  });
  return rows.map((row) => ({
    id: Number(row.legacyId),
    applicationId: Number(row.basvuruLegacyId),
    kind: row.tur as ApplicationDocumentKind,
    storageKey: row.storageKey as string,
    originalFilename: row.orijinalDosyaAdi as string,
    mimeType: row.mimeType as string,
    byteSize: Number(row.byteSize ?? 0),
    createdAt: row.created,
  }));
}

export async function getApplicationDocumentById(id: number) {
  requireDatabase();

  const db = await getDb();
  const row = await db.collection('basvuru_belgeleri').getFirstListItem(`legacyId = ${id}`).catch(() => null);
  if (!row) return null;
  return {
    id: Number(row.legacyId),
    applicationId: Number(row.basvuruLegacyId),
    kind: row.tur as ApplicationDocumentKind,
    storageKey: row.storageKey as string,
    originalFilename: row.orijinalDosyaAdi as string,
    mimeType: row.mimeType as string,
    byteSize: Number(row.byteSize ?? 0),
    createdAt: row.created,
  };
}
