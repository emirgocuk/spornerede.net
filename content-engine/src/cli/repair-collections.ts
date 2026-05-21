/**
 * rehber_yazilari listesi 400 veriyorsa koleksiyonu silip yeniden olusturur (dev).
 */
import PocketBase from 'pocketbase';
import { cfg, requirePocketBaseAdmin } from '../config.js';

async function main() {
  requirePocketBaseAdmin();
  const pb = new PocketBase(cfg.pocketbaseUrl);
  await pb.collection('_superusers').authWithPassword(
    cfg.pocketbaseAdminEmail,
    cfg.pocketbaseAdminPassword,
  );

  const list = await pb.collections.getList(1, 50, {
    filter: 'name = "rehber_yazilari"',
  });
  if (list.totalItems === 0) {
    console.log('rehber_yazilari yok; npm run setup:collections calistirin.');
    return;
  }

  const col = list.items[0];
  try {
    await pb.collection('rehber_yazilari').getList(1, 1);
    await pb.collection('rehber_yazilari').getFullList({ sort: '-created' });
    console.log('rehber_yazilari OK, onarim gerekmedi.');
    return;
  } catch {
    console.log('rehber_yazilari bozuk; siliniyor ve yeniden olusturulacak...');
    await pb.collections.delete(col.id);
    console.log('Silindi. Simdi: npm run setup:collections');
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
