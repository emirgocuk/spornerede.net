CREATE TYPE "public"."basvuru_belge_tur" AS ENUM('dekont', 'kimlik', 'sozlesme', 'diger');--> statement-breakpoint
CREATE TYPE "public"."kullanici_rol" AS ENUM('admin', 'club');--> statement-breakpoint
CREATE TYPE "public"."kulup_uyelik_rol" AS ENUM('owner', 'staff');--> statement-breakpoint
CREATE TABLE "basvuru_belgeleri" (
	"id" serial PRIMARY KEY NOT NULL,
	"basvuru_id" integer NOT NULL,
	"tur" "basvuru_belge_tur" DEFAULT 'diger' NOT NULL,
	"storage_key" varchar(255) NOT NULL,
	"orijinal_dosya_adi" varchar(255) NOT NULL,
	"mime_type" varchar(120) NOT NULL,
	"byte_size" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "kullanicilar" (
	"id" serial PRIMARY KEY NOT NULL,
	"email" varchar(180) NOT NULL,
	"password_hash" varchar(255) NOT NULL,
	"rol" "kullanici_rol" DEFAULT 'club' NOT NULL,
	"aktif" boolean DEFAULT true NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "kulup_uyelik_kullanicilari" (
	"id" serial PRIMARY KEY NOT NULL,
	"kullanici_id" integer NOT NULL,
	"kulup_id" integer NOT NULL,
	"rol" "kulup_uyelik_rol" DEFAULT 'staff' NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "oturumlar" (
	"id" serial PRIMARY KEY NOT NULL,
	"kullanici_id" integer NOT NULL,
	"token_hash" varchar(128) NOT NULL,
	"expires_at" timestamp NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "basvuru_belgeleri" ADD CONSTRAINT "basvuru_belgeleri_basvuru_id_kulupler_id_fk" FOREIGN KEY ("basvuru_id") REFERENCES "public"."kulupler"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "kulup_uyelik_kullanicilari" ADD CONSTRAINT "kulup_uyelik_kullanicilari_kullanici_id_kullanicilar_id_fk" FOREIGN KEY ("kullanici_id") REFERENCES "public"."kullanicilar"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "kulup_uyelik_kullanicilari" ADD CONSTRAINT "kulup_uyelik_kullanicilari_kulup_id_kulupler_id_fk" FOREIGN KEY ("kulup_id") REFERENCES "public"."kulupler"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "oturumlar" ADD CONSTRAINT "oturumlar_kullanici_id_kullanicilar_id_fk" FOREIGN KEY ("kullanici_id") REFERENCES "public"."kullanicilar"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "basvuru_belgeleri_basvuru_idx" ON "basvuru_belgeleri" USING btree ("basvuru_id");--> statement-breakpoint
CREATE INDEX "basvuru_belgeleri_tur_idx" ON "basvuru_belgeleri" USING btree ("tur");--> statement-breakpoint
CREATE UNIQUE INDEX "kullanicilar_email_unique" ON "kullanicilar" USING btree ("email");--> statement-breakpoint
CREATE INDEX "kullanicilar_rol_idx" ON "kullanicilar" USING btree ("rol");--> statement-breakpoint
CREATE UNIQUE INDEX "kulup_uyelik_kullanicilari_unique" ON "kulup_uyelik_kullanicilari" USING btree ("kullanici_id","kulup_id");--> statement-breakpoint
CREATE INDEX "kulup_uyelik_kullanicilari_kulup_idx" ON "kulup_uyelik_kullanicilari" USING btree ("kulup_id");--> statement-breakpoint
CREATE UNIQUE INDEX "oturumlar_token_hash_unique" ON "oturumlar" USING btree ("token_hash");--> statement-breakpoint
CREATE INDEX "oturumlar_kullanici_expires_idx" ON "oturumlar" USING btree ("kullanici_id","expires_at");
