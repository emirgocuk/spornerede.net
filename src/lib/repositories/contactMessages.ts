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
  createdAt: string;
};

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
    createdAt: recordTimestamp(row.created) ?? recordTimestamp(Number(row.legacyId)) ?? '',
  };
}

export async function createContactMessage(input: ContactMessageInput) {
  requireDatabase();
  const db = await getDb();
  const row = await db.collection('iletisim_mesajlari').create({
    legacyId: Date.now(),
    adSoyad: input.adSoyad,
    telefon: input.telefon ?? '',
    email: input.email,
    konu: input.konu,
    mesaj: input.mesaj,
    okundu: false,
    cevaplandi: false,
  });

  return { id: Number(row.legacyId), mode: 'db' as const };
}

export async function listContactMessages() {
  requireDatabase();
  const db = await getDb();
  const rows = await db.collection('iletisim_mesajlari').getList(1, 100, { sort: '-legacyId' });
  return rows.items.map((row) => mapRow(row as unknown as Record<string, unknown>));
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
