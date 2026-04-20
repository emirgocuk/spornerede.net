CREATE TABLE "kulup_programlari" (
	"id" serial PRIMARY KEY NOT NULL,
	"kulup_id" integer NOT NULL,
	"ad" varchar(140) NOT NULL,
	"aciklama" text DEFAULT '' NOT NULL,
	"gun_saat" varchar(160) DEFAULT '' NOT NULL,
	"seviye" varchar(80) DEFAULT '' NOT NULL,
	"ucret_bilgisi" varchar(120) DEFAULT '' NOT NULL,
	"aktif" boolean DEFAULT true NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "kulup_programlari" ADD CONSTRAINT "kulup_programlari_kulup_id_kulupler_id_fk" FOREIGN KEY ("kulup_id") REFERENCES "public"."kulupler"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "kulup_programlari_kulup_idx" ON "kulup_programlari" USING btree ("kulup_id");--> statement-breakpoint
CREATE INDEX "kulup_programlari_aktif_idx" ON "kulup_programlari" USING btree ("aktif");
