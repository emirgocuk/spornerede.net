import { getDb, hasDatabaseUrl } from '../../db/client';

export type PanelFeedback = {
  id: number;
  kullaniciLegacyId: number;
  mesaj: string;
  durum: 'yeni' | 'incelendi' | 'kapandi';
  createdAt: string;
};

function requireDatabase() {
  if (!hasDatabaseUrl()) {
    throw new Error('POCKETBASE_URL is not configured.');
  }
}

function mapFeedbackRow(row: Record<string, unknown>): PanelFeedback {
  return {
    id: Number(row.legacyId),
    kullaniciLegacyId: Number(row.kullaniciLegacyId),
    mesaj: (row.mesaj as string) || '',
    durum: (row.durum as PanelFeedback['durum']) || 'yeni',
    createdAt: (row.created as string) || '',
  };
}

export async function createPanelFeedback(kullaniciLegacyId: number, mesaj: string): Promise<PanelFeedback> {
  requireDatabase();
  const db = await getDb();
  
  const created = await db.collection('panel_geribildirimleri').create({
    legacyId: Date.now(),
    kullaniciLegacyId,
    mesaj,
    durum: 'yeni',
  });
  
  return mapFeedbackRow(created as unknown as Record<string, unknown>);
}

export async function getAdminFeedbacks(): Promise<PanelFeedback[]> {
  requireDatabase();
  const db = await getDb();
  
  const list = await db.collection('panel_geribildirimleri').getFullList({
    sort: '-created',
  });
  
  return list.map((row) => mapFeedbackRow(row as unknown as Record<string, unknown>));
}

export async function updateAdminFeedbackStatus(id: number, durum: PanelFeedback['durum']): Promise<PanelFeedback | null> {
  requireDatabase();
  const db = await getDb();
  
  const row = await db.collection('panel_geribildirimleri').getFirstListItem(`legacyId = ${id}`).catch(() => null);
  if (!row) return null;
  
  const updated = await db.collection('panel_geribildirimleri').update(row.id, { durum });
  return mapFeedbackRow(updated as unknown as Record<string, unknown>);
}