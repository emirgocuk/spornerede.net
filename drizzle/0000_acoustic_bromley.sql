CREATE TYPE "public"."kulup_durumu" AS ENUM('pending', 'approved', 'rejected');--> statement-breakpoint
CREATE TYPE "public"."odeme_durumu" AS ENUM('pending', 'paid', 'expired');--> statement-breakpoint
CREATE TYPE "public"."uyelik_periyot" AS ENUM('monthly', 'yearly', 'one_time');--> statement-breakpoint
CREATE TABLE "branslar" (
	"id" serial PRIMARY KEY NOT NULL,
	"slug" varchar(120) NOT NULL,
	"ad" varchar(120) NOT NULL,
	"aciklama" text DEFAULT '' NOT NULL,
	"emoji" varchar(10) DEFAULT '' NOT NULL,
	"renk" varchar(20) DEFAULT '#E30A17' NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "ilceler" (
	"id" serial PRIMARY KEY NOT NULL,
	"il_id" integer NOT NULL,
	"slug" varchar(120) NOT NULL,
	"ad" varchar(120) NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "iller" (
	"id" serial PRIMARY KEY NOT NULL,
	"slug" varchar(80) NOT NULL,
	"ad" varchar(120) NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "kulup_branslar" (
	"id" serial PRIMARY KEY NOT NULL,
	"kulup_id" integer NOT NULL,
	"brans_id" integer NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "kulup_uyelikleri" (
	"id" serial PRIMARY KEY NOT NULL,
	"kulup_id" integer NOT NULL,
	"paket_id" integer NOT NULL,
	"odeme_durumu" "odeme_durumu" DEFAULT 'pending' NOT NULL,
	"baslangic_tarihi" timestamp,
	"bitis_tarihi" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "kulupler" (
	"id" serial PRIMARY KEY NOT NULL,
	"ad" varchar(160) NOT NULL,
	"slug" varchar(180) NOT NULL,
	"il_id" integer NOT NULL,
	"ilce_id" integer,
	"adres" text DEFAULT '' NOT NULL,
	"yas_araligi" varchar(50) DEFAULT '' NOT NULL,
	"fiyat_bilgisi" varchar(120) DEFAULT '' NOT NULL,
	"telefon" varchar(30) DEFAULT '' NOT NULL,
	"email" varchar(180) DEFAULT '' NOT NULL,
	"aciklama" text DEFAULT '' NOT NULL,
	"one_cikan" boolean DEFAULT false NOT NULL,
	"puan" numeric(3, 2) DEFAULT '0' NOT NULL,
	"yorum_sayisi" integer DEFAULT 0 NOT NULL,
	"durum" "kulup_durumu" DEFAULT 'pending' NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "uyelik_paketleri" (
	"id" serial PRIMARY KEY NOT NULL,
	"kod" varchar(50) NOT NULL,
	"ad" varchar(120) NOT NULL,
	"aciklama" text DEFAULT '' NOT NULL,
	"ucret" numeric(10, 2) DEFAULT '0' NOT NULL,
	"para_birimi" varchar(8) DEFAULT 'TRY' NOT NULL,
	"periyot" "uyelik_periyot" DEFAULT 'monthly' NOT NULL,
	"aktif" boolean DEFAULT true NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "ilceler" ADD CONSTRAINT "ilceler_il_id_iller_id_fk" FOREIGN KEY ("il_id") REFERENCES "public"."iller"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "kulup_branslar" ADD CONSTRAINT "kulup_branslar_kulup_id_kulupler_id_fk" FOREIGN KEY ("kulup_id") REFERENCES "public"."kulupler"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "kulup_branslar" ADD CONSTRAINT "kulup_branslar_brans_id_branslar_id_fk" FOREIGN KEY ("brans_id") REFERENCES "public"."branslar"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "kulup_uyelikleri" ADD CONSTRAINT "kulup_uyelikleri_kulup_id_kulupler_id_fk" FOREIGN KEY ("kulup_id") REFERENCES "public"."kulupler"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "kulup_uyelikleri" ADD CONSTRAINT "kulup_uyelikleri_paket_id_uyelik_paketleri_id_fk" FOREIGN KEY ("paket_id") REFERENCES "public"."uyelik_paketleri"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "kulupler" ADD CONSTRAINT "kulupler_il_id_iller_id_fk" FOREIGN KEY ("il_id") REFERENCES "public"."iller"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "kulupler" ADD CONSTRAINT "kulupler_ilce_id_ilceler_id_fk" FOREIGN KEY ("ilce_id") REFERENCES "public"."ilceler"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "branslar_slug_unique" ON "branslar" USING btree ("slug");--> statement-breakpoint
CREATE UNIQUE INDEX "ilceler_il_id_slug_unique" ON "ilceler" USING btree ("il_id","slug");--> statement-breakpoint
CREATE UNIQUE INDEX "iller_slug_unique" ON "iller" USING btree ("slug");--> statement-breakpoint
CREATE UNIQUE INDEX "kulup_branslar_unique" ON "kulup_branslar" USING btree ("kulup_id","brans_id");--> statement-breakpoint
CREATE UNIQUE INDEX "uyelik_paketleri_kod_unique" ON "uyelik_paketleri" USING btree ("kod");