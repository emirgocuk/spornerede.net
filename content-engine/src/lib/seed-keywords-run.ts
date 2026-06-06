import type PocketBase from 'pocketbase';
import { buildSeedRows } from './seed-keywords-data.js';

export async function seedKeywords(
  pb: PocketBase,
  opts?: { quiet?: boolean },
): Promise<{ added: number; total: number }> {
  const seeds = buildSeedRows();
  let added = 0;
  for (const row of seeds) {
    try {
      await pb.collection('seo_keywords').getFirstListItem(
        `anahtar = ${JSON.stringify(row.anahtar)}`,
      );
    } catch {
      await pb.collection('seo_keywords').create({
        anahtar: row.anahtar,
        kategori: row.kategori,
        niyet: row.niyet,
        skor: 10,
        durum: 'kuyrukta',
      });
      added++;
    }
  }
  if (!opts?.quiet) {
    console.log(`Seed tamam: ${added} yeni, ${seeds.length - added} zaten vardi.`);
  }
  return { added, total: seeds.length };
}
