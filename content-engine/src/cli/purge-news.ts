/**
 * Eski haberleri siler; varsayilan olarak content-engine test haberini korur.
 * npm run purge:news
 * npm run purge:news -- --all   (hepsini sil)
 */
import { getAdminPb } from '../pb/client.js';
import { listNewsRecords } from '../pb/news.js';
import { requirePocketBaseAdmin } from '../config.js';

const DEFAULT_KEEP = 'yaz-donemi-spor-kamplari-ve-kurs-kayitlari-1779470014938';
const deleteAll = process.argv.includes('--all');
const keepSlug = process.argv.find((a) => a.startsWith('--keep='))?.slice(7) ?? DEFAULT_KEEP;

async function main() {
  requirePocketBaseAdmin();
  const pb = await getAdminPb();
  const rows = await listNewsRecords(pb);
  let deleted = 0;

  for (const row of rows) {
    const slug = String(row.slug ?? '');
    const id = String(row.id);
    if (!deleteAll && slug === keepSlug) {
      console.log('Korundu:', slug);
      continue;
    }
    await pb.collection('haberler').delete(id);
    console.log('Silindi:', String(row.baslik ?? id), slug || '(bos slug)');
    deleted++;
  }

  console.log(`\nToplam silinen: ${deleted}`);
  if (!deleteAll) {
    console.log(`Korunan slug: ${keepSlug || '(yok)'}`);
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
