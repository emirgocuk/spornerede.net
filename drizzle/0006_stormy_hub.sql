ALTER TABLE "kulupler" ADD COLUMN "sorumlu_admin_email" varchar(180) DEFAULT '' NOT NULL;
--> statement-breakpoint
CREATE TABLE "admin_basvuru_loglari" (
	"id" serial PRIMARY KEY NOT NULL,
	"basvuru_id" integer NOT NULL,
	"aksiyon" varchar(40) NOT NULL,
	"onceki_durum" "kulup_durumu",
	"yeni_durum" "kulup_durumu",
	"not_metni" text DEFAULT '' NOT NULL,
	"atanan_admin_email" varchar(180) DEFAULT '' NOT NULL,
	"islem_yapan_email" varchar(180) DEFAULT '' NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "admin_basvuru_loglari" ADD CONSTRAINT "admin_basvuru_loglari_basvuru_id_kulupler_id_fk" FOREIGN KEY ("basvuru_id") REFERENCES "public"."kulupler"("id") ON DELETE cascade ON UPDATE no action;
--> statement-breakpoint
CREATE INDEX "admin_basvuru_loglari_basvuru_idx" ON "admin_basvuru_loglari" USING btree ("basvuru_id");
--> statement-breakpoint
CREATE INDEX "admin_basvuru_loglari_tarih_idx" ON "admin_basvuru_loglari" USING btree ("created_at");
