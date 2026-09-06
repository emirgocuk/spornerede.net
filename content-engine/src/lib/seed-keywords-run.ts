import type PocketBase from 'pocketbase';
import { buildSeedRows } from './seed-keywords-data.js';

export async function seedKeywords(
  pb: PocketBase,
  opts?: { quiet?: boolean },
): Promise<{ added: number; total: number }> {
  // Eski 'nedir' kategorisindeki kuyrukta bekleyen anahtarları iptal et
  try {
    const staleNedir = await pb.collection('seo_keywords').getFullList({
      filter: 'kategori = "nedir" && durum = "kuyrukta"',
    });
    for (const item of staleNedir) {
      await pb.collection('seo_keywords').update(item.id, { durum: 'iptal' }).catch(() => {});
    }
    if (staleNedir.length > 0 && !opts?.quiet) {
      console.log(`[seed] ${staleNedir.length} adet eski 'nedir' anahtar kelimesi iptal edildi.`);
    }
  } catch {}

  const seeds = await buildSeedRows(pb);
  let added = 0;
  for (const row of seeds) {
    const skor = row.skor ?? 10;
    try {
      const existing = await pb.collection('seo_keywords').getFirstListItem(
        `anahtar = ${JSON.stringify(row.anahtar)}`,
      );
      // Eger mevcutsa ve skoru dusukse veya siteContext yoksa guncelle
      if ((existing.skor as number) < skor || (!existing.site_context && row.siteContext)) {
        await pb.collection('seo_keywords').update(existing.id, {
          skor,
          site_context: row.siteContext ?? existing.site_context ?? {},
        }).catch(() => {});
      }
    } catch {
      await pb.collection('seo_keywords').create({
        anahtar: row.anahtar,
        kategori: row.kategori,
        niyet: row.niyet,
        skor,
        durum: 'kuyrukta',
        site_context: row.siteContext ?? {},
      });
      added++;
    }
  }
  if (!opts?.quiet) {
    console.log(`Seed tamam: ${added} yeni, ${seeds.length - added} zaten vardi.`);
  }
  return { added, total: seeds.length };
}
