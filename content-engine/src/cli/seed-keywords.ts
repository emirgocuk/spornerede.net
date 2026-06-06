import { getAdminPb } from '../pb/client.js';
import { seedKeywords } from '../lib/seed-keywords-run.js';

async function main() {
  const pb = await getAdminPb();
  const seeds = (await import('../lib/seed-keywords-data.js')).buildSeedRows();
  console.log(`Seed havuzu: ${seeds.length} anahtar kelime`);
  await seedKeywords(pb);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
