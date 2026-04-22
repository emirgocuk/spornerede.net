import { getDb, hasDatabaseUrl } from '../src/db/client';
import { hashPassword } from '../src/lib/auth/password';
import { createUser, findUserByEmail, assignUserToClub } from '../src/lib/repositories/auth';

type DemoProgram = {
  ad: string;
  aciklama: string;
  gunSaat: string;
  seviye: string;
  ucretBilgisi: string;
};

const DEMO_USERS = [
  { email: 'demo-admin@spornerede.net', password: 'DemoAdmin!123', role: 'admin' as const },
  { email: 'demo-club@spornerede.net', password: 'DemoClub!123', role: 'club' as const },
];

const PROGRAM_TEMPLATES: DemoProgram[] = [
  {
    ad: 'Baslangic Grubu',
    aciklama: 'Temel teknik, koordinasyon ve duzenli gelisim odakli grup dersi.',
    gunSaat: 'Hafta ici 18:00-19:00',
    seviye: 'Baslangic',
    ucretBilgisi: 'Aylik 2500 TL',
  },
  {
    ad: 'Gelisim Grubu',
    aciklama: 'Teknik ilerleme ve kondisyonu birlikte calistiran orta seviye program.',
    gunSaat: 'Cumartesi 10:00-12:00',
    seviye: 'Orta',
    ucretBilgisi: 'Aylik 3200 TL',
  },
];

async function ensureUsers() {
  for (const demoUser of DEMO_USERS) {
    const existing = await findUserByEmail(demoUser.email);
    if (existing) continue;
    const passwordHash = await hashPassword(demoUser.password);
    await createUser({ email: demoUser.email, passwordHash, role: demoUser.role });
  }
}

async function seedProgramsAndMemberships() {
  const db = await getDb();
  const clubRows = await db.collection('kulupler').getList(1, 6, {
    filter: 'durum = "approved"',
    sort: 'legacyId',
  });
  const clubs = clubRows.items.map((row) => ({
    id: Number(row.legacyId),
    ad: row.ad as string,
    slug: row.slug as string,
  }));

  if (!clubs.length) {
    console.warn('Demo seed atlandi: onayli kulup bulunamadi.');
    return;
  }

  const programRows = await db.collection('kulup_programlari').getFullList();
  for (const row of programRows.filter((item) => clubs.some((club) => club.id === Number(item.kulupLegacyId)))) {
    await db.collection('kulup_programlari').delete(row.id);
  }

  for (const club of clubs) {
    const values = PROGRAM_TEMPLATES.map((template, index) => ({
      kulupId: club.id,
      ad: `${club.ad} - ${template.ad}`,
      aciklama: template.aciklama,
      gunSaat: template.gunSaat,
      seviye: template.seviye,
      ucretBilgisi: index === 0 ? template.ucretBilgisi : 'Aylik 3600 TL',
      aktif: true,
    }));
    for (const value of values) {
      await db.collection('kulup_programlari').create({
        legacyId: Date.now() + Math.floor(Math.random() * 10000),
        kulupLegacyId: value.kulupId,
        ad: value.ad,
        aciklama: value.aciklama,
        gunSaat: value.gunSaat,
        seviye: value.seviye,
        ucretBilgisi: value.ucretBilgisi,
        aktif: value.aktif,
      });
    }
  }

  const demoClubUser = await findUserByEmail('demo-club@spornerede.net');
  if (demoClubUser) {
    await assignUserToClub(demoClubUser.id, clubs[0].id, 'owner');
  }
}

async function main() {
  if (!hasDatabaseUrl()) {
    throw new Error('POCKETBASE_URL tanimli degil. Demo seed icin DB baglantisi zorunlu.');
  }

  await ensureUsers();
  await seedProgramsAndMemberships();

  console.log('Demo seed tamamlandi.');
  console.log('Demo admin: demo-admin@spornerede.net / DemoAdmin!123');
  console.log('Demo club:  demo-club@spornerede.net / DemoClub!123');
}

main().catch((error) => {
  console.error('Demo seed hatasi:', error);
  process.exit(1);
});
