import PocketBase from 'pocketbase';

type SchemaField = {
  name: string;
  type: string;
  required?: boolean;
  unique?: boolean;
  options?: Record<string, unknown>;
};

type CollectionDef = {
  name: string;
  fields: SchemaField[];
};

function env(name: string) {
  const value = process.env[name];
  if (!value) {
    throw new Error(`${name} tanimli degil.`);
  }
  return value;
}

const COLLECTIONS: CollectionDef[] = [
  {
    name: 'iller',
    fields: [
      { name: 'legacyId', type: 'number', required: true, unique: true },
      { name: 'slug', type: 'text', required: true, unique: true },
      { name: 'ad', type: 'text', required: true },
    ],
  },
  {
    name: 'ilceler',
    fields: [
      { name: 'legacyId', type: 'number', required: true, unique: true },
      { name: 'ilLegacyId', type: 'number', required: true },
      { name: 'slug', type: 'text', required: true },
      { name: 'ad', type: 'text', required: true },
    ],
  },
  {
    name: 'branslar',
    fields: [
      { name: 'legacyId', type: 'number', required: true, unique: true },
      { name: 'slug', type: 'text', required: true, unique: true },
      { name: 'ad', type: 'text', required: true },
      { name: 'aciklama', type: 'text' },
      { name: 'emoji', type: 'text' },
      { name: 'renk', type: 'text' },
    ],
  },
  {
    name: 'uyelik_paketleri',
    fields: [
      { name: 'legacyId', type: 'number', required: true, unique: true },
      { name: 'kod', type: 'text', required: true, unique: true },
      { name: 'ad', type: 'text', required: true },
      { name: 'aciklama', type: 'text' },
      { name: 'ucret', type: 'number' },
      { name: 'periyot', type: 'text' },
      { name: 'aktif', type: 'bool' },
    ],
  },
  {
    name: 'kulupler',
    fields: [
      { name: 'legacyId', type: 'number', required: true, unique: true },
      { name: 'ad', type: 'text', required: true },
      { name: 'slug', type: 'text', required: true, unique: true },
      { name: 'ilLegacyId', type: 'number', required: true },
      { name: 'ilceLegacyId', type: 'number' },
      { name: 'adres', type: 'text' },
      { name: 'yasAraligi', type: 'text' },
      { name: 'fiyatBilgisi', type: 'text' },
      { name: 'telefon', type: 'text' },
      { name: 'email', type: 'email' },
      { name: 'aciklama', type: 'text' },
      { name: 'oneCikan', type: 'bool' },
      { name: 'puan', type: 'number' },
      { name: 'yorumSayisi', type: 'number' },
      { name: 'durum', type: 'text' },
      { name: 'adminNotu', type: 'text' },
      { name: 'sorumluAdminEmail', type: 'text' },
      { name: 'enlem', type: 'number' },
      { name: 'boylam', type: 'number' },
    ],
  },
  {
    name: 'kulup_branslar',
    fields: [
      { name: 'legacyId', type: 'number', required: true, unique: true },
      { name: 'kulupLegacyId', type: 'number', required: true },
      { name: 'bransLegacyId', type: 'number', required: true },
    ],
  },
  {
    name: 'kulup_uyelikleri',
    fields: [
      { name: 'legacyId', type: 'number', required: true, unique: true },
      { name: 'kulupLegacyId', type: 'number', required: true },
      { name: 'paketLegacyId', type: 'number', required: true },
      { name: 'odemeDurumu', type: 'text' },
    ],
  },
  {
    name: 'kullanicilar',
    fields: [
      { name: 'legacyId', type: 'number', required: true, unique: true },
      { name: 'email', type: 'email', required: true, unique: true },
      { name: 'passwordHash', type: 'text', required: true },
      { name: 'rol', type: 'text', required: true },
      { name: 'aktif', type: 'bool' },
      { name: 'sifreDegistirmeZorunlu', type: 'bool' },
    ],
  },
  {
    name: 'oturumlar',
    fields: [
      { name: 'legacyId', type: 'number', required: true, unique: true },
      { name: 'kullaniciLegacyId', type: 'number', required: true },
      { name: 'tokenHash', type: 'text', required: true, unique: true },
      { name: 'expiresAt', type: 'date', required: true },
    ],
  },
  {
    name: 'kulup_uyelik_kullanicilari',
    fields: [
      { name: 'legacyId', type: 'number', required: true, unique: true },
      { name: 'kullaniciLegacyId', type: 'number', required: true },
      { name: 'kulupLegacyId', type: 'number', required: true },
      { name: 'rol', type: 'text', required: true },
    ],
  },
  {
    name: 'basvuru_belgeleri',
    fields: [
      { name: 'legacyId', type: 'number', required: true, unique: true },
      { name: 'basvuruLegacyId', type: 'number', required: true },
      { name: 'tur', type: 'text', required: true },
      { name: 'storageKey', type: 'text', required: true },
      { name: 'orijinalDosyaAdi', type: 'text', required: true },
      { name: 'mimeType', type: 'text', required: true },
      { name: 'byteSize', type: 'number' },
    ],
  },
  {
    name: 'kulup_programlari',
    fields: [
      { name: 'legacyId', type: 'number', required: true, unique: true },
      { name: 'kulupLegacyId', type: 'number', required: true },
      { name: 'ad', type: 'text', required: true },
      { name: 'aciklama', type: 'text' },
      { name: 'gunSaat', type: 'text' },
      { name: 'seviye', type: 'text' },
      { name: 'ucretBilgisi', type: 'text' },
      { name: 'aktif', type: 'bool' },
    ],
  },
  {
    name: 'admin_basvuru_loglari',
    fields: [
      { name: 'legacyId', type: 'number', required: true, unique: true },
      { name: 'basvuruLegacyId', type: 'number', required: true },
      { name: 'aksiyon', type: 'text', required: true },
      { name: 'oncekiDurum', type: 'text' },
      { name: 'yeniDurum', type: 'text' },
      { name: 'notMetni', type: 'text' },
      { name: 'atananAdminEmail', type: 'text' },
      { name: 'islemYapanEmail', type: 'text' },
    ],
  },
];

async function ensureCollection(pb: PocketBase, def: CollectionDef) {
  const existingList = await pb.collections.getList(1, 200, { filter: `name = "${def.name}"` });
  if (existingList.totalItems > 0) {
    const existing = existingList.items[0] as { id: string; fields?: Array<{ name: string }> };
    const existingFields = existing.fields ?? [];
    const hasCustomFields = existingFields.some((field) => !['id', 'created', 'updated'].includes(field.name));
    if (hasCustomFields) {
      console.log(`- ${def.name} mevcut`);
      return;
    }
    await pb.collections.delete(existing.id);
    console.log(`~ ${def.name} yeniden olusturulacak`);
  }

  await pb.collections.create({
    name: def.name,
    type: 'base',
    listRule: '',
    viewRule: '',
    createRule: '',
    updateRule: '',
    deleteRule: '',
    fields: def.fields.map((field) => ({
      name: field.name,
      type: field.type,
      required: field.required ?? false,
      unique: field.unique ?? false,
      options: field.options ?? {},
    })),
  });
  console.log(`+ ${def.name} olusturuldu`);
}

async function main() {
  const pb = new PocketBase(env('POCKETBASE_URL'));
  await pb.collection('_superusers').authWithPassword(env('POCKETBASE_ADMIN_EMAIL'), env('POCKETBASE_ADMIN_PASSWORD'));
  for (const collection of COLLECTIONS) {
    await ensureCollection(pb, collection);
  }
  console.log('PocketBase koleksiyon kurulumu tamamlandi.');
}

main().catch((error) => {
  console.error('PocketBase setup hatasi:', error);
  process.exit(1);
});
