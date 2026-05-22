/**
 * Pasif haber taslagı (admin'den yayinlanir).
 * Kullanim: npm run create:manual-news -- "Yaz donemi voleybol kamplari"
 */
import { getAdminPb } from '../pb/client.js';
import { createNewsDraft } from '../pb/news.js';
import { requirePocketBaseAdmin, cfg } from '../config.js';

const baslik = process.argv.slice(2).join(' ').trim();
if (!baslik) {
  console.error('Kullanim: npm run create:manual-news -- <baslik>');
  process.exit(1);
}

async function main() {
  requirePocketBaseAdmin();
  const pb = await getAdminPb();

  try {
    await pb.collection('haberler').getList(1, 1);
  } catch {
    console.error('haberler koleksiyonu yok. Ana projede: npm run pb:setup');
    process.exit(1);
  }

  const { record, legacyId, slug } = await createNewsDraft(pb, { baslik });

  console.log('Haber taslagı (pasif):', record.id, `legacyId=${legacyId}`);
  console.log(`Slug: ${slug}`);
  console.log('Admin → Haberler sekmesi → duzenle → Yayinla');
  console.log(`Lokal onizleme (yayindan sonra): ${cfg.siteUrl.replace(/\/$/, '')}/haberler/${slug}`);
  console.log('(Pasif kayitlar sitede gorunmez; admin panelinde "Pasif" olarak listelenir.)');
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
