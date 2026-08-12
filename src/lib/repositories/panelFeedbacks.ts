import { getDb, hasDatabaseUrl } from '../../db/client';

export type PanelFeedback = {
  id: number;
  kullaniciLegacyId: number;
  adSoyad: string;
  kullaniciEmail: string;
  mesaj: string;
  sayfaUrl: string;
  tarayiciBilgisi: string;
  gorselUrl: string;
  gorselDeleteUrl: string;
  durum: 'yeni' | 'incelendi' | 'kapandi';
  createdAt: string;
};

export type CreatePanelFeedbackInput = {
  kullaniciLegacyId: number;
  kullaniciEmail: string;
  adSoyad: string;
  mesaj: string;
  sayfaUrl: string;
  tarayiciBilgisi: string;
  gorselUrl?: string;
  gorselDeleteUrl?: string;
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
    adSoyad: (row.adSoyad as string) || '',
    kullaniciEmail: (row.kullaniciEmail as string) || '',
    mesaj: (row.mesaj as string) || '',
    sayfaUrl: (row.sayfaUrl as string) || '',
    tarayiciBilgisi: (row.tarayiciBilgisi as string) || '',
    gorselUrl: (row.gorselUrl as string) || '',
    gorselDeleteUrl: (row.gorselDeleteUrl as string) || '',
    durum: (row.durum as PanelFeedback['durum']) || 'yeni',
    createdAt: (row.created as string) || '',
  };
}

export async function createPanelFeedback(input: CreatePanelFeedbackInput): Promise<PanelFeedback> {
  requireDatabase();
  const db = await getDb();
  
  const created = await db.collection('panel_geribildirimleri').create({
    legacyId: Date.now(),
    kullaniciLegacyId: input.kullaniciLegacyId,
    kullaniciEmail: input.kullaniciEmail,
    adSoyad: input.adSoyad,
    mesaj: input.mesaj,
    sayfaUrl: input.sayfaUrl,
    tarayiciBilgisi: input.tarayiciBilgisi,
    gorselUrl: input.gorselUrl ?? '',
    gorselDeleteUrl: input.gorselDeleteUrl ?? '',
    durum: 'yeni',
  });
  
  return mapFeedbackRow(created as unknown as Record<string, unknown>);
}

export async function getAdminFeedbacks(): Promise<PanelFeedback[]> {
  requireDatabase();
  try {
    const db = await getDb();
    const list = await db.collection('panel_geribildirimleri').getFullList({
      sort: '-created',
    });
    return list.map((row) => mapFeedbackRow(row as unknown as Record<string, unknown>));
  } catch (error) {
    console.error('panel_geribildirimleri listelenemedi:', error);
    return [];
  }
}

export async function updateAdminFeedbackStatus(id: number, durum: PanelFeedback['durum']): Promise<PanelFeedback | null> {
  requireDatabase();
  const db = await getDb();
  
  const row = await db.collection('panel_geribildirimleri').getFirstListItem(`legacyId = ${id}`).catch(() => null);
  if (!row) return null;
  
  const updated = await db.collection('panel_geribildirimleri').update(row.id, { durum });
  return mapFeedbackRow(updated as unknown as Record<string, unknown>);
}