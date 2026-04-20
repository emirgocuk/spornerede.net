import {
  boolean,
  decimal,
  index,
  integer,
  pgEnum,
  pgTable,
  serial,
  text,
  timestamp,
  uniqueIndex,
  varchar,
} from 'drizzle-orm/pg-core';

export const kulupDurumuEnum = pgEnum('kulup_durumu', ['pending', 'approved', 'rejected']);
export const odemeDurumuEnum = pgEnum('odeme_durumu', ['pending', 'paid', 'expired']);
export const uyelikPeriyotEnum = pgEnum('uyelik_periyot', ['monthly', 'yearly', 'one_time']);
export const kullaniciRolEnum = pgEnum('kullanici_rol', ['admin', 'club']);
export const kulupUyelikRolEnum = pgEnum('kulup_uyelik_rol', ['owner', 'staff']);
export const basvuruBelgeTurEnum = pgEnum('basvuru_belge_tur', ['dekont', 'kimlik', 'sozlesme', 'diger']);

export const iller = pgTable(
  'iller',
  {
    id: serial('id').primaryKey(),
    slug: varchar('slug', { length: 80 }).notNull(),
    ad: varchar('ad', { length: 120 }).notNull(),
    createdAt: timestamp('created_at').defaultNow().notNull(),
  },
  (table) => ({
    slugUnique: uniqueIndex('iller_slug_unique').on(table.slug),
  })
);

export const ilceler = pgTable(
  'ilceler',
  {
    id: serial('id').primaryKey(),
    ilId: integer('il_id').notNull().references(() => iller.id, { onDelete: 'cascade' }),
    slug: varchar('slug', { length: 120 }).notNull(),
    ad: varchar('ad', { length: 120 }).notNull(),
    createdAt: timestamp('created_at').defaultNow().notNull(),
  },
  (table) => ({
    ilceUniqueInCity: uniqueIndex('ilceler_il_id_slug_unique').on(table.ilId, table.slug),
  })
);

export const branslar = pgTable(
  'branslar',
  {
    id: serial('id').primaryKey(),
    slug: varchar('slug', { length: 120 }).notNull(),
    ad: varchar('ad', { length: 120 }).notNull(),
    aciklama: text('aciklama').notNull().default(''),
    emoji: varchar('emoji', { length: 10 }).notNull().default(''),
    renk: varchar('renk', { length: 20 }).notNull().default('#E30A17'),
    createdAt: timestamp('created_at').defaultNow().notNull(),
  },
  (table) => ({
    slugUnique: uniqueIndex('branslar_slug_unique').on(table.slug),
  })
);

export const uyelikPaketleri = pgTable(
  'uyelik_paketleri',
  {
    id: serial('id').primaryKey(),
    kod: varchar('kod', { length: 50 }).notNull(),
    ad: varchar('ad', { length: 120 }).notNull(),
    aciklama: text('aciklama').notNull().default(''),
    ucret: decimal('ucret', { precision: 10, scale: 2 }).notNull().default('0'),
    paraBirimi: varchar('para_birimi', { length: 8 }).notNull().default('TRY'),
    periyot: uyelikPeriyotEnum('periyot').notNull().default('monthly'),
    aktif: boolean('aktif').notNull().default(true),
    createdAt: timestamp('created_at').defaultNow().notNull(),
  },
  (table) => ({
    kodUnique: uniqueIndex('uyelik_paketleri_kod_unique').on(table.kod),
  })
);

export const kulupler = pgTable(
  'kulupler',
  {
    id: serial('id').primaryKey(),
    ad: varchar('ad', { length: 160 }).notNull(),
    slug: varchar('slug', { length: 180 }).notNull(),
    ilId: integer('il_id').notNull().references(() => iller.id),
    ilceId: integer('ilce_id').references(() => ilceler.id),
    adres: text('adres').notNull().default(''),
    yasAraligi: varchar('yas_araligi', { length: 50 }).notNull().default(''),
    fiyatBilgisi: varchar('fiyat_bilgisi', { length: 120 }).notNull().default(''),
    telefon: varchar('telefon', { length: 30 }).notNull().default(''),
    email: varchar('email', { length: 180 }).notNull().default(''),
    aciklama: text('aciklama').notNull().default(''),
    oneCikan: boolean('one_cikan').notNull().default(false),
    puan: decimal('puan', { precision: 3, scale: 2 }).notNull().default('0'),
    yorumSayisi: integer('yorum_sayisi').notNull().default(0),
    durum: kulupDurumuEnum('durum').notNull().default('pending'),
    adminNotu: text('admin_notu').notNull().default(''),
    sorumluAdminEmail: varchar('sorumlu_admin_email', { length: 180 }).notNull().default(''),
    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at').defaultNow().notNull(),
  },
  (table) => ({
    slugUnique: uniqueIndex('kulupler_slug_unique').on(table.slug),
    cityDistrictIdx: index('kulupler_il_ilce_idx').on(table.ilId, table.ilceId),
    statusIdx: index('kulupler_durum_idx').on(table.durum),
  })
);

export const kulupBranslar = pgTable(
  'kulup_branslar',
  {
    id: serial('id').primaryKey(),
    kulupId: integer('kulup_id').notNull().references(() => kulupler.id, { onDelete: 'cascade' }),
    bransId: integer('brans_id').notNull().references(() => branslar.id, { onDelete: 'cascade' }),
    createdAt: timestamp('created_at').defaultNow().notNull(),
  },
  (table) => ({
    kulupBransUnique: uniqueIndex('kulup_branslar_unique').on(table.kulupId, table.bransId),
  })
);

export const kulupUyelikleri = pgTable('kulup_uyelikleri', {
  id: serial('id').primaryKey(),
  kulupId: integer('kulup_id').notNull().references(() => kulupler.id, { onDelete: 'cascade' }),
  paketId: integer('paket_id').notNull().references(() => uyelikPaketleri.id),
  odemeDurumu: odemeDurumuEnum('odeme_durumu').notNull().default('pending'),
  baslangicTarihi: timestamp('baslangic_tarihi'),
  bitisTarihi: timestamp('bitis_tarihi'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

export const kullanicilar = pgTable(
  'kullanicilar',
  {
    id: serial('id').primaryKey(),
    email: varchar('email', { length: 180 }).notNull(),
    passwordHash: varchar('password_hash', { length: 255 }).notNull(),
    rol: kullaniciRolEnum('rol').notNull().default('club'),
    aktif: boolean('aktif').notNull().default(true),
    sifreDegistirmeZorunlu: boolean('sifre_degistirme_zorunlu').notNull().default(false),
    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at').defaultNow().notNull(),
  },
  (table) => ({
    emailUnique: uniqueIndex('kullanicilar_email_unique').on(table.email),
    rolIdx: index('kullanicilar_rol_idx').on(table.rol),
  })
);

export const oturumlar = pgTable(
  'oturumlar',
  {
    id: serial('id').primaryKey(),
    kullaniciId: integer('kullanici_id')
      .notNull()
      .references(() => kullanicilar.id, { onDelete: 'cascade' }),
    tokenHash: varchar('token_hash', { length: 128 }).notNull(),
    expiresAt: timestamp('expires_at').notNull(),
    createdAt: timestamp('created_at').defaultNow().notNull(),
  },
  (table) => ({
    tokenHashUnique: uniqueIndex('oturumlar_token_hash_unique').on(table.tokenHash),
    userExpiresIdx: index('oturumlar_kullanici_expires_idx').on(table.kullaniciId, table.expiresAt),
  })
);

export const kulupUyelikKullanicilari = pgTable(
  'kulup_uyelik_kullanicilari',
  {
    id: serial('id').primaryKey(),
    kullaniciId: integer('kullanici_id')
      .notNull()
      .references(() => kullanicilar.id, { onDelete: 'cascade' }),
    kulupId: integer('kulup_id')
      .notNull()
      .references(() => kulupler.id, { onDelete: 'cascade' }),
    rol: kulupUyelikRolEnum('rol').notNull().default('staff'),
    createdAt: timestamp('created_at').defaultNow().notNull(),
  },
  (table) => ({
    uniqMembership: uniqueIndex('kulup_uyelik_kullanicilari_unique').on(table.kullaniciId, table.kulupId),
    kulupIdx: index('kulup_uyelik_kullanicilari_kulup_idx').on(table.kulupId),
  })
);

export const basvuruBelgeleri = pgTable(
  'basvuru_belgeleri',
  {
    id: serial('id').primaryKey(),
    basvuruId: integer('basvuru_id')
      .notNull()
      .references(() => kulupler.id, { onDelete: 'cascade' }),
    tur: basvuruBelgeTurEnum('tur').notNull().default('diger'),
    storageKey: varchar('storage_key', { length: 255 }).notNull(),
    orijinalDosyaAdi: varchar('orijinal_dosya_adi', { length: 255 }).notNull(),
    mimeType: varchar('mime_type', { length: 120 }).notNull(),
    byteSize: integer('byte_size').notNull().default(0),
    createdAt: timestamp('created_at').defaultNow().notNull(),
  },
  (table) => ({
    basvuruIdx: index('basvuru_belgeleri_basvuru_idx').on(table.basvuruId),
    turIdx: index('basvuru_belgeleri_tur_idx').on(table.tur),
  })
);

export const kulupProgramlari = pgTable(
  'kulup_programlari',
  {
    id: serial('id').primaryKey(),
    kulupId: integer('kulup_id')
      .notNull()
      .references(() => kulupler.id, { onDelete: 'cascade' }),
    ad: varchar('ad', { length: 140 }).notNull(),
    aciklama: text('aciklama').notNull().default(''),
    gunSaat: varchar('gun_saat', { length: 160 }).notNull().default(''),
    seviye: varchar('seviye', { length: 80 }).notNull().default(''),
    ucretBilgisi: varchar('ucret_bilgisi', { length: 120 }).notNull().default(''),
    aktif: boolean('aktif').notNull().default(true),
    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at').defaultNow().notNull(),
  },
  (table) => ({
    kulupIdx: index('kulup_programlari_kulup_idx').on(table.kulupId),
    aktifIdx: index('kulup_programlari_aktif_idx').on(table.aktif),
  })
);

export const adminBasvuruLoglari = pgTable(
  'admin_basvuru_loglari',
  {
    id: serial('id').primaryKey(),
    basvuruId: integer('basvuru_id')
      .notNull()
      .references(() => kulupler.id, { onDelete: 'cascade' }),
    aksiyon: varchar('aksiyon', { length: 40 }).notNull(),
    oncekiDurum: kulupDurumuEnum('onceki_durum'),
    yeniDurum: kulupDurumuEnum('yeni_durum'),
    notMetni: text('not_metni').notNull().default(''),
    atananAdminEmail: varchar('atanan_admin_email', { length: 180 }).notNull().default(''),
    islemYapanEmail: varchar('islem_yapan_email', { length: 180 }).notNull().default(''),
    createdAt: timestamp('created_at').defaultNow().notNull(),
  },
  (table) => ({
    basvuruIdx: index('admin_basvuru_loglari_basvuru_idx').on(table.basvuruId),
    tarihIdx: index('admin_basvuru_loglari_tarih_idx').on(table.createdAt),
  })
);

