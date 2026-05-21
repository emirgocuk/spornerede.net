/**
 * Izole PB sema — ana scripts/pb-setup.ts dosyasina dokunmaz.
 */
import PocketBase from 'pocketbase';
import { cfg, requirePocketBaseAdmin } from '../config.js';

type FieldDef = {
  name: string;
  type: string;
  required?: boolean;
  unique?: boolean;
};

const collections: Array<{ name: string; fields: FieldDef[] }> = [
  {
    name: 'seo_keywords',
    fields: [
      { name: 'anahtar', type: 'text', required: true, unique: true },
      { name: 'kategori', type: 'text', required: true },
      { name: 'gsc_impression', type: 'number' },
      { name: 'niyet', type: 'text' },
      { name: 'skor', type: 'number' },
      { name: 'durum', type: 'text', required: true },
      { name: 'site_context', type: 'json' },
    ],
  },
  {
    name: 'rehber_yazilari',
    fields: [
      { name: 'baslik', type: 'text', required: true },
      { name: 'slug', type: 'text', required: true, unique: true },
      { name: 'meta_title', type: 'text' },
      { name: 'meta_description', type: 'text' },
      { name: 'icerik_html', type: 'text' },
      { name: 'icerik_json', type: 'json' },
      { name: 'anahtar_kelime_id', type: 'text' },
      { name: 'ic_linkler', type: 'json' },
      { name: 'sema_tipi', type: 'text' },
      { name: 'yayinlanma_tarihi', type: 'date' },
      { name: 'durum', type: 'text', required: true },
      { name: 'gsc_tiklama', type: 'number' },
      { name: 'gsc_gosterim', type: 'number' },
      { name: 'gsc_konum', type: 'number' },
      { name: 'kaynak', type: 'text' },
    ],
  },
];

async function ensureCollection(pb: PocketBase, def: (typeof collections)[0]) {
  const list = await pb.collections.getList(1, 1, { filter: `name = "${def.name}"` });
  if (list.totalItems > 0) {
    console.log(`- ${def.name} zaten var`);
    return;
  }
  await pb.collections.create({
    name: def.name,
    type: 'base',
    listRule: '',
    viewRule: '',
    createRule: '',
    updateRule: '',
    deleteRule: '',
    fields: def.fields.map((f) => ({
      name: f.name,
      type: f.type,
      required: f.required ?? false,
      unique: f.unique ?? false,
    })),
  });
  console.log(`+ ${def.name} olusturuldu`);
}

async function main() {
  requirePocketBaseAdmin();
  const pb = new PocketBase(cfg.pocketbaseUrl);
  await pb.collection('_superusers').authWithPassword(
    cfg.pocketbaseAdminEmail,
    cfg.pocketbaseAdminPassword,
  );
  for (const def of collections) {
    await ensureCollection(pb, def);
  }
  console.log('\nTamam. Site dosyalari degistirilmedi.\n');
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
