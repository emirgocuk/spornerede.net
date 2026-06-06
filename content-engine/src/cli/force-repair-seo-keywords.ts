/**
 * seo_keywords koleksiyonunu silip yeniden olusturur + seed.
 * "Missing collection context" 404 icin tam onarim.
 */
import PocketBase from 'pocketbase';
import { cfg, requirePocketBaseAdmin } from '../config.js';
import { seedKeywords } from '../lib/seed-keywords-run.js';

const FIELDS = [
  { name: 'anahtar', type: 'text', required: true, unique: true },
  { name: 'kategori', type: 'text', required: true },
  { name: 'gsc_impression', type: 'number' },
  { name: 'niyet', type: 'text' },
  { name: 'skor', type: 'number' },
  { name: 'durum', type: 'text', required: true },
  { name: 'site_context', type: 'json' },
];

async function probe(pb: PocketBase): Promise<boolean> {
  try {
    await pb.collection('seo_keywords').getList(1, 40, {
      filter: 'durum = "kuyrukta"',
      sort: '-skor',
    });
    return true;
  } catch (e) {
    const err = e as { status?: number };
    return err.status !== 404;
  }
}

async function main() {
  requirePocketBaseAdmin();
  const pb = new PocketBase(cfg.pocketbaseUrl);
  await pb.collection('_superusers').authWithPassword(
    cfg.pocketbaseAdminEmail,
    cfg.pocketbaseAdminPassword,
  );

  console.log('PB:', cfg.pocketbaseUrl);

  if (await probe(pb)) {
    console.log('seo_keywords sorgusu zaten calisiyor — onarim gerekmedi.');
    return;
  }

  const list = await pb.collections.getList(1, 1, { filter: 'name = "seo_keywords"' });
  const existing = list.items[0] as { id: string } | undefined;
  if (existing) {
    console.log('~ Bozuk seo_keywords siliniyor...');
    await pb.collections.delete(existing.id);
  }

  await pb.collections.create({
    name: 'seo_keywords',
    type: 'base',
    listRule: '',
    viewRule: '',
    createRule: '',
    updateRule: '',
    deleteRule: '',
    fields: FIELDS.map((f) => ({
      name: f.name,
      type: f.type,
      required: f.required ?? false,
      unique: f.unique ?? false,
    })),
  });
  console.log('+ seo_keywords yeniden olusturuldu');

  const seeded = await seedKeywords(pb);
  console.log(`+ seed: ${seeded.added} yeni, ${seeded.total} toplam havuz`);

  if (!(await probe(pb))) {
    throw new Error('Onarim sonrasi sorgu hala basarisiz');
  }
  console.log('OK — pickNewsKeyword sorgusu calisiyor.');
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
