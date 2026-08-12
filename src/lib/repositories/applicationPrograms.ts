import { getDb, hasDatabaseUrl } from '../../db/client';
import { parseProgramContent, serializeProgramContent } from './programContent';

export type BasvuruIlanInput = {
  brans: string;
  yasAraligi?: string;
  aidatBilgisi?: string;
};

function slugify(input: string) {
  return input
    .toLowerCase()
    .replaceAll(' ', '-')
    .replaceAll('.', '')
    .replaceAll(',', '')
    .replaceAll("'", '')
    .replaceAll('ı', 'i')
    .replaceAll('ğ', 'g')
    .replaceAll('ü', 'u')
    .replaceAll('ş', 's')
    .replaceAll('ö', 'o')
    .replaceAll('ç', 'c');
}

function requireDatabase() {
  if (!hasDatabaseUrl()) {
    throw new Error('POCKETBASE_URL is not configured.');
  }
}

export async function linkClubBranch(db: Awaited<ReturnType<typeof getDb>>, clubLegacyId: number, bransName: string) {
  const s = slugify(bransName);
  const targetSlug = s === 'jimnastik' ? 'cimnastik' : s;
  let branch = await db.collection('branslar').getFirstListItem(`slug = "${targetSlug}"`).catch(() => null);
  if (!branch && s !== targetSlug) {
    branch = await db.collection('branslar').getFirstListItem(`slug = "${s}"`).catch(() => null);
  }
  if (!branch) return;
  const existing = await db
    .collection('kulup_branslar')
    .getFirstListItem(`kulupLegacyId = ${clubLegacyId} && bransLegacyId = ${Number(branch.legacyId)}`)
    .catch(() => null);
  if (existing) return;
  await db.collection('kulup_branslar').create({
    legacyId: Date.now() + Math.floor(Math.random() * 1000),
    kulupLegacyId: clubLegacyId,
    bransLegacyId: Number(branch.legacyId),
  });
}

/** Başvuru sırasında her branş için vitrin ilanı (program) oluşturur; onaylanana kadar pasif. */
export async function createProgramsFromApplication(clubLegacyId: number, ilanlar: BasvuruIlanInput[]) {
  requireDatabase();
  const db = await getDb();
  const linkedBranches = new Set<string>();

  for (let i = 0; i < ilanlar.length; i++) {
    const ilan = ilanlar[i];
    const brans = ilan.brans.trim();
    if (!brans) continue;

    await db.collection('kulup_programlari').create({
      legacyId: Date.now() + i + 1,
      kulupLegacyId: clubLegacyId,
      ad: brans.slice(0, 180),
      aciklama: serializeProgramContent({
        summary: '',
        locationText: '',
        mapsUrl: '',
        yasAraligi: ilan.yasAraligi?.trim() ?? '',
      }),
      gunSaat: '',
      seviye: '',
      ucretBilgisi: ilan.aidatBilgisi?.trim().slice(0, 120) ?? '',
      aktif: false,
    });

    if (!linkedBranches.has(brans)) {
      linkedBranches.add(brans);
      await linkClubBranch(db, clubLegacyId, brans);
    }
  }
}

export async function listApplicationPrograms(clubLegacyId: number) {
  requireDatabase();
  const db = await getDb();
  const rows = await db.collection('kulup_programlari').getFullList({
    filter: `kulupLegacyId = ${clubLegacyId}`,
    sort: 'legacyId',
  });
  return rows.map((row) => {
    const parsed = parseProgramContent((row.aciklama as string) ?? '');
    const ad = (row.ad as string) ?? '';
    return {
      id: Number(row.legacyId),
      ad,
      brans: ad,
      aciklama: parsed.content.summary || parsed.legacyText || '',
      gunSaat: (row.gunSaat as string) ?? '',
      seviye: (row.seviye as string) ?? '',
      ucretBilgisi: (row.ucretBilgisi as string) ?? '',
      aidatBilgisi: (row.ucretBilgisi as string) ?? '',
      locationText: parsed.content.locationText,
      mapsUrl: parsed.content.mapsUrl,
      yasAraligi: parsed.content.yasAraligi,
      aktif: Boolean(row.aktif),
    };
  });
}

export async function updateApplicationProgram(
  clubLegacyId: number,
  programLegacyId: number,
  input: BasvuruIlanInput,
) {
  requireDatabase();
  const db = await getDb();
  const row = await db
    .collection('kulup_programlari')
    .getFirstListItem(`legacyId = ${programLegacyId} && kulupLegacyId = ${clubLegacyId}`)
    .catch(() => null);
  if (!row) return null;

  const brans = input.brans.trim() || 'İlan';
  await db.collection('kulup_programlari').update(row.id, {
    ad: brans.slice(0, 180),
    aciklama: serializeProgramContent({
      summary: '',
      locationText: '',
      mapsUrl: '',
      yasAraligi: input.yasAraligi?.trim() ?? '',
    }),
    gunSaat: '',
    seviye: '',
    ucretBilgisi: input.aidatBilgisi?.trim().slice(0, 120) ?? '',
  });
  await linkClubBranch(db, clubLegacyId, brans);
  return { id: programLegacyId };
}

export async function setClubProgramsPublication(clubLegacyId: number, aktif: boolean) {
  requireDatabase();
  const db = await getDb();
  const rows = await db.collection('kulup_programlari').getFullList({
    filter: `kulupLegacyId = ${clubLegacyId}`,
  });
  await Promise.all(
    rows.map((row) => db.collection('kulup_programlari').update(row.id, { aktif }).catch(() => undefined)),
  );
}
