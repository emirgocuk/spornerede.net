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

