import { getAdminPb } from '../pb/client.js';
import { buildSeedRows } from '../lib/seed-keywords-data.js';

async function main() {
  const seeds = buildSeedRows();
  console.log(`Seed havuzu: ${seeds.length} anahtar kelime`);
  const pb = await getAdminPb();

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
  console.log(`Seed tamam: ${added} yeni, ${seeds.length - added} zaten vardi.`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
