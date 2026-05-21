import { getAdminPb } from '../pb/client.js';
import { requirePocketBaseAdmin } from '../config.js';

async function main() {
  requirePocketBaseAdmin();
  const pb = await getAdminPb();
  const list = await pb.collection('rehber_yazilari').getList(1, 50, {
    filter: 'durum = "incelemede" || durum = "taslak"',
    sort: '-created',
  });

  if (list.items.length === 0) {
    console.log('Bekleyen taslak yok.');
    return;
  }

  console.log('\nTaslaklar:\n');
  for (const row of list.items) {
    console.log(`  ${row.slug}  |  ${row.baslik}  |  ${row.durum}  |  id=${row.id}`);
  }
  console.log(`\nToplam: ${list.totalItems}\n`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
