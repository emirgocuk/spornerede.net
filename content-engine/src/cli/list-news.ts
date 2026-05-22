import { getAdminPb } from '../pb/client.js';
import { listNewsRecords } from '../pb/news.js';
import { requirePocketBaseAdmin } from '../config.js';

async function main() {
  requirePocketBaseAdmin();
  const pb = await getAdminPb();
  const rows = await listNewsRecords(pb);

  if (!rows.length) {
    console.log('Haber kaydi yok.');
    return;
  }

  console.log('\n--- Haberler ---\n');
  for (const row of rows) {
    const aktif = Boolean(row.aktif);
    const durum = aktif ? 'AKTIF' : 'pasif';
    const baslik = String(row.baslik ?? '');
    const slug = String(row.slug ?? '');
    const kategori = String(row.kategori ?? '');
    const tarih = String(row.tarih ?? '').slice(0, 10);
    console.log(`[${durum}] ${baslik}`);
    console.log(`  slug: ${slug} | ${kategori} | ${tarih}`);
    if (!aktif) {
      console.log(`  yayinla: npm run publish:news -- ${slug}`);
    } else {
      console.log(`  url: /haberler/${slug}`);
    }
    console.log('');
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
