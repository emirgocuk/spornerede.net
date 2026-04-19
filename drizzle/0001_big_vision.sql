CREATE UNIQUE INDEX "kulupler_slug_unique" ON "kulupler" USING btree ("slug");--> statement-breakpoint
CREATE INDEX "kulupler_il_ilce_idx" ON "kulupler" USING btree ("il_id","ilce_id");--> statement-breakpoint
CREATE INDEX "kulupler_durum_idx" ON "kulupler" USING btree ("durum");