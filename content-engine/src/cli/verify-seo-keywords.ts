/** Tam pickNewsKeyword sorgusunu test eder */
import PocketBase from 'pocketbase';
import { cfg, requirePocketBaseAdmin } from '../config.js';

async function main() {
  requirePocketBaseAdmin();
  const pb = new PocketBase(cfg.pocketbaseUrl);
  await pb.collection('_superusers').authWithPassword(
    cfg.pocketbaseAdminEmail,
    cfg.pocketbaseAdminPassword,
  );

  console.log('PB URL:', cfg.pocketbaseUrl);

  const cols = await pb.collections.getList(1, 200);
  const hasAdmin = cols.items.some((c) => c.name === 'seo_keywords');
  console.log('Admin koleksiyonlar:', hasAdmin ? 'seo_keywords VAR' : 'seo_keywords YOK');

  try {
    const batch = await pb.collection('seo_keywords').getList(1, 40, {
      filter: 'durum = "kuyrukta"',
      sort: '-skor',
    });
    console.log('Kuyrukta keyword:', batch.totalItems);
    if (batch.totalItems === 0) {
      console.log('Uyari: kuyruk bos. npm run seed:keywords calistirin.');
    }
  } catch (e) {
    const err = e as { status?: number; message?: string };
    console.error('HATA:', err.message ?? e);
    if (err.status === 404) {
      console.error('\nCozum (PocketBase acikken):');
      console.error('  npm run content-engine:ensure');
      console.error('veya admin panelden haber uret — otomatik onarir.');
    }
    process.exit(1);
  }
}

main().catch((e) => {
  console.error('HATA:', e);
  process.exit(1);
});
