import PocketBase from 'pocketbase';
import { existsSync, readFileSync } from 'node:fs';

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

function loadLocalEnv() {
  if (!existsSync('.env')) return;
  const lines = readFileSync('.env', 'utf8').split(/\r?\n/);
  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const separatorIndex = trimmed.indexOf('=');
    if (separatorIndex === -1) continue;
    const key = trimmed.slice(0, separatorIndex).trim();
    const rawValue = trimmed.slice(separatorIndex + 1).trim();
    if (!key || process.env[key]) continue;
    process.env[key] = rawValue.replace(/^["']|["']$/g, '');
  }
}

const COLLECTIONS: CollectionDef[] = [
  {
    name: 'iller',
    fields: [
      { name: 'legacyId', type: 'number', required: true, unique: true },
      { name: 'slug', type: 'text', unique: true },
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
      { name: 'slug', type: 'text', unique: true },
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
      { name: 'bransSayisi', type: 'number' },
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
      { name: 'baslangicTarihi', type: 'date' },
      { name: 'bitisTarihi', type: 'date' },
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
  {
    name: 'iletisim_mesajlari',
    fields: [
      { name: 'legacyId', type: 'number', required: true, unique: true },
      { name: 'adSoyad', type: 'text', required: true },
      { name: 'telefon', type: 'text' },
      { name: 'email', type: 'email', required: true },
      { name: 'konu', type: 'text', required: true },
      { name: 'mesaj', type: 'text', required: true },
      { name: 'okundu', type: 'bool' },
      { name: 'cevaplandi', type: 'bool' },
      { name: 'copKutusu', type: 'bool' },
      { name: 'silindiAt', type: 'date' },
    ],
  },
  {
    name: 'panel_geribildirimleri',
    fields: [
      { name: 'legacyId', type: 'number', required: true, unique: true },
      { name: 'kullaniciLegacyId', type: 'number', required: true },
      { name: 'adSoyad', type: 'text' },
      { name: 'kullaniciEmail', type: 'email' },
      { name: 'mesaj', type: 'text', required: true },
      { name: 'sayfaUrl', type: 'text' },
      { name: 'tarayiciBilgisi', type: 'text' },
      { name: 'gorselUrl', type: 'text' },
      { name: 'gorselDeleteUrl', type: 'text' },
      { name: 'durum', type: 'text' },
    ],
  },
  {
    name: 'mail_kuyrugu',
    fields: [
      { name: 'legacyId', type: 'number', required: true, unique: true },
      { name: 'kind', type: 'text', required: true },
      { name: 'toEmail', type: 'email', required: true },
      { name: 'subject', type: 'text', required: true },
      { name: 'html', type: 'editor', required: true },
      { name: 'replyTo', type: 'email' },
      { name: 'status', type: 'text', required: true },
      { name: 'attemptCount', type: 'number' },
      { name: 'lastError', type: 'text' },
      { name: 'nextAttemptAt', type: 'date', required: true },
      { name: 'sentAt', type: 'date' },
    ],
  },
  {
    name: 'sifre_sifirlama_tokenlari',
    fields: [
      { name: 'legacyId', type: 'number', required: true, unique: true },
      { name: 'kullaniciLegacyId', type: 'number', required: true },
      { name: 'tokenHash', type: 'text', required: true, unique: true },
      { name: 'expiresAt', type: 'date', required: true },
      { name: 'usedAt', type: 'date' },
    ],
  },
  {
    name: 'haberler',
    fields: [
      { name: 'legacyId', type: 'number', required: true, unique: true },
      { name: 'kategori', type: 'text', required: true },
      { name: 'kategoriRenk', type: 'text' },
      { name: 'tarih', type: 'date', required: true },
      { name: 'baslik', type: 'text', required: true },
      { name: 'ozet', type: 'text' },
      { name: 'link', type: 'text' },
      { name: 'slug', type: 'text', required: true, unique: true },
      { name: 'seoTitle', type: 'text' },
      { name: 'seoDescription', type: 'text' },
      { name: 'aktif', type: 'bool' },
    ],
  },
  {
    name: 'seo_keywords',
    fields: [
      { name: 'anahtar', type: 'text', required: true, unique: true },
      { name: 'kategori', type: 'text', required: true },
      { name: 'gsc_impression', type: 'number' },
      { name: 'niyet', type: 'text' },
      { name: 'skor', type: 'number' },
      { name: 'durum', type: 'text', required: true },
      { name: 'site_context', type: 'json' },
    ],
  },
  {
    name: 'rehber_yazilari',
    fields: [
      { name: 'baslik', type: 'text', required: true },
      { name: 'slug', type: 'text', required: true, unique: true },
      { name: 'meta_title', type: 'text' },
      { name: 'meta_description', type: 'text' },
      { name: 'icerik_html', type: 'text' },
      { name: 'icerik_json', type: 'json' },
      { name: 'anahtar_kelime_id', type: 'text' },
      { name: 'ic_linkler', type: 'json' },
      { name: 'sema_tipi', type: 'text' },
      { name: 'yayinlanma_tarihi', type: 'date' },
      { name: 'durum', type: 'text', required: true },
      { name: 'gsc_tiklama', type: 'number' },
      { name: 'gsc_gosterim', type: 'number' },
      { name: 'gsc_konum', type: 'number' },
      { name: 'kaynak', type: 'text' },
    ],
  },
  {
    name: 'content_engine_schedule',
    fields: [
      { name: 'legacyId', type: 'number', required: true, unique: true },
      { name: 'enabled', type: 'bool' },
      { name: 'runHour', type: 'number' },
      { name: 'runMinute', type: 'number' },
      { name: 'autoPublish', type: 'bool' },
      { name: 'lastRunAt', type: 'date' },
      { name: 'lastRunStatus', type: 'text' },
      { name: 'lastRunMessage', type: 'text' },
      { name: 'lastKeywordSyncAt', type: 'date' },
      { name: 'lastKeywordSyncMessage', type: 'text' },
    ],
  },
];

async function recordsApiWorks(pb: PocketBase, name: string): Promise<boolean> {
  try {
    await pb.collection(name).getList(1, 1);
    return true;
  } catch (e) {
    const err = e as { status?: number };
    return err.status !== 404;
  }
}

async function ensureCollection(pb: PocketBase, def: CollectionDef) {
  const existingList = await pb.collections.getList(1, 200, { filter: `name = "${def.name}"` });
  let existing = existingList.items[0] as { id: string; fields?: Array<SchemaField & { id?: string }> } | undefined;

  if (existing && !(await recordsApiWorks(pb, def.name))) {
    console.log(`~ ${def.name} kayit API 404 — yeniden olusturuluyor...`);
    await pb.collections.delete(existing.id);
    existing = undefined;
  }

  if (existing) {
    const existingFields = existing.fields ?? [];
    const existingFieldNames = new Set(existingFields.map((field) => field.name));
    const missingFields = def.fields.filter((field) => !existingFieldNames.has(field.name));
    if (missingFields.length > 0) {
      await pb.collections.update(existing.id, {
        fields: [
          ...existingFields,
          ...missingFields.map((field) => ({
            name: field.name,
            type: field.type,
            required: field.required ?? false,
            unique: field.unique ?? false,
            options: field.options ?? {},
          })),
        ],
      });
      console.log(`~ ${def.name} eksik alanlar eklendi: ${missingFields.map((field) => field.name).join(', ')}`);
      return;
    }
    const hasCustomFields = existingFields.some((field) => !['id', 'created', 'updated'].includes(field.name));
    if (hasCustomFields) {
      console.log(`- ${def.name} mevcut`);
      return;
    }
    await pb.collections.delete(existing.id);
    console.log(`~ ${def.name} yeniden olusturulacak`);
    existing = undefined;
  }

  if (!existing) {
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
}

async function main() {
  loadLocalEnv();
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
