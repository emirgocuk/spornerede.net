import { getDb, hasDatabaseUrl } from '../../db/client';

export type ContactMessageInput = {
  adSoyad: string;
  telefon?: string;
  email: string;
  konu: string;
  mesaj: string;
};

export type ContactMessage = {
  id: number;
  adSoyad: string;
  telefon: string;
  email: string;
  konu: string;
  mesaj: string;
  okundu: boolean;
  cevaplandi: boolean;
  copKutusu: boolean;
  silindiAt: string | null;
  createdAt: string;
};

const TRASH_RETENTION_DAYS = 30;

function requireDatabase() {
  if (!hasDatabaseUrl()) {
    throw new Error('POCKETBASE_URL is not configured.');
  }
}

function recordTimestamp(value: unknown): string | null {
  if (value == null || value === '') return null;
  const date = value instanceof Date ? value : new Date(value as string | number);
  if (Number.isNaN(date.getTime())) return null;
  return date.toISOString();
}

function mapRow(row: Record<string, unknown>): ContactMessage {
  return {
    id: Number(row.legacyId),
    adSoyad: (row.adSoyad as string) ?? '',
    telefon: (row.telefon as string) ?? '',
    email: (row.email as string) ?? '',
    konu: (row.konu as string) ?? '',
    mesaj: (row.mesaj as string) ?? '',
    okundu: Boolean(row.okundu),
    cevaplandi: Boolean(row.cevaplandi),
    copKutusu: Boolean(row.copKutusu),
    silindiAt: recordTimestamp(row.silindiAt),
    createdAt: recordTimestamp(row.created) ?? recordTimestamp(Number(row.legacyId)) ?? '',
  };
}

export async function purgeExpiredTrashContactMessages() {
  requireDatabase();
  const db = await getDb();
  const cutoff = Date.now() - TRASH_RETENTION_DAYS * 24 * 60 * 60 * 1000;
  const rows = await db.collection('iletisim_mesajlari').getFullList({ sort: '-legacyId' }).catch(() => []);
  let purged = 0;
  for (const row of rows) {
    if (!row.copKutusu) continue;
    const deletedAt = recordTimestamp(row.silindiAt) ?? recordTimestamp(row.updated) ?? recordTimestamp(row.created);
    if (!deletedAt) continue;
    if (new Date(deletedAt).getTime() > cutoff) continue;
    await db.collection('iletisim_mesajlari').delete(row.id).catch(() => undefined);
    purged += 1;
  }
  return purged;
}

export async function createContactMessage(input: ContactMessageInput) {
  requireDatabase();
  const db = await getDb();
  const payload: Record<string, unknown> = {
    legacyId: Date.now(),
    adSoyad: input.adSoyad,
    telefon: input.telefon ?? '',
    email: input.email,
    konu: input.konu,
    mesaj: input.mesaj,
    okundu: false,
    cevaplandi: false,
    copKutusu: false,
    silindiAt: '',
  };

  let row;
  try {
    row = await db.collection('iletisim_mesajlari').create(payload);
  } catch {
    delete payload.copKutusu;
    delete payload.silindiAt;
    row = await db.collection('iletisim_mesajlari').create(payload);
  }

  return { id: Number(row.legacyId), mode: 'db' as const };
}

export async function listContactMessages(options?: { trash?: boolean }) {
  requireDatabase();
  await purgeExpiredTrashContactMessages();
  const db = await getDb();
  const rows = await db.collection('iletisim_mesajlari').getList(1, 200, { sort: '-legacyId' });
  const mapped = rows.items.map((row) => mapRow(row as unknown as Record<string, unknown>));
  if (options?.trash) {
    return mapped.filter((item) => item.copKutusu);
  }
  return mapped.filter((item) => !item.copKutusu);
}

export async function getContactMessageById(id: number) {
  requireDatabase();
  const db = await getDb();
  const row = await db.collection('iletisim_mesajlari').getFirstListItem(`legacyId = ${id}`).catch(() => null);
  return row ? mapRow(row as unknown as Record<string, unknown>) : null;
}

export async function markContactMessageRead(id: number, okundu = true) {
  requireDatabase();
  const db = await getDb();
  const row = await db.collection('iletisim_mesajlari').getFirstListItem(`legacyId = ${id}`).catch(() => null);
  if (!row) return null;
  const updated = await db.collection('iletisim_mesajlari').update(row.id, { okundu });
  return mapRow(updated as unknown as Record<string, unknown>);
}

export async function markContactMessageAnswered(id: number, cevaplandi = true) {
  requireDatabase();
  const db = await getDb();
  const row = await db.collection('iletisim_mesajlari').getFirstListItem(`legacyId = ${id}`).catch(() => null);
  if (!row) return null;
  const updated = await db.collection('iletisim_mesajlari').update(row.id, { cevaplandi });
  return mapRow(updated as unknown as Record<string, unknown>);
}

export async function moveContactMessageToTrash(id: number) {
  requireDatabase();
  const db = await getDb();
  const row = await db.collection('iletisim_mesajlari').getFirstListItem(`legacyId = ${id}`).catch(() => null);
  if (!row) return null;

  const payload: Record<string, unknown> = {
    copKutusu: true,
    silindiAt: new Date().toISOString(),
  };

  let updated;
  try {
    updated = await db.collection('iletisim_mesajlari').update(row.id, payload);
  } catch {
    return null;
  }
  return mapRow(updated as unknown as Record<string, unknown>);
}

export async function restoreContactMessageFromTrash(id: number) {
  requireDatabase();
  const db = await getDb();
  const row = await db.collection('iletisim_mesajlari').getFirstListItem(`legacyId = ${id}`).catch(() => null);
  if (!row) return null;

  const payload: Record<string, unknown> = {
    copKutusu: false,
    silindiAt: '',
  };

  let updated;
  try {
    updated = await db.collection('iletisim_mesajlari').update(row.id, payload);
  } catch {
    return null;
  }
  return mapRow(updated as unknown as Record<string, unknown>);
}
