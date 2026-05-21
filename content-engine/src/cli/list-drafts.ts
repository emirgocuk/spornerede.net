import { getAdminPb } from '../pb/client.js';
import { requirePocketBaseAdmin } from '../config.js';
import { listGuideRecords } from '../pb/list-guides.js';

async function main() {
  requirePocketBaseAdmin();
  const pb = await getAdminPb();
  const items = await listGuideRecords(pb, {
    durumIn: ['incelemede', 'taslak'],
  });

  if (items.length === 0) {
    console.log('Bekleyen taslak yok.');
    return;
  }

  console.log('\nTaslaklar:\n');
  for (const row of items) {
    console.log(
      `  ${row.slug}  |  ${row.baslik}  |  ${row.durum}  |  id=${row.id}`,
    );
  }
  console.log(`\nToplam: ${items.length}\n`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
