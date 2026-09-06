/**
 * seo_keywords + rehber_yazilari — kayit API 404 veriyorsa yeniden olusturur.
 */
import PocketBase, { ClientResponseError } from 'pocketbase';
import { cfg, requirePocketBaseAdmin } from '../config.js';
import { seedKeywords } from './seed-keywords-run.js';
import { createFreshAdminPb, resetAdminPb } from '../pb/client.js';

type FieldDef = {
  name: string;
  type: string;
  required?: boolean;
  unique?: boolean;
  max?: number;
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
      { name: 'planlanan_tarih', type: 'date' },
    ],
  },
  {
    name: 'rehber_yazilari',
    fields: [
      { name: 'baslik', type: 'text', required: true },
      { name: 'slug', type: 'text', required: true, unique: true },
      { name: 'meta_title', type: 'text' },
      { name: 'meta_description', type: 'text' },
      { name: 'icerik_html', type: 'text', max: 200000 },
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

async function recordsApiWorks(pb: PocketBase, name: string): Promise<boolean> {
  try {
    if (name === 'seo_keywords') {
      await pb.collection(name).getList(1, 40, {
        filter: 'durum = "kuyrukta"',
        sort: '-skor',
      });
    } else {
      await pb.collection(name).getList(1, 1);
    }
    return true;
  } catch (e) {
    const err = e as { status?: number };
    return err.status !== 404;
  }
}

async function ensureCollection(
  pb: PocketBase,
  def: (typeof collections)[0],
  quiet: boolean,
): Promise<boolean> {
  const list = await pb.collections.getList(1, 1, { filter: `name = "${def.name}"` });
  const existing = list.items[0] as { id: string } | undefined;

  if (existing && (await recordsApiWorks(pb, def.name))) {
    const existingFields = (existing as { fields?: FieldDef[] }).fields ?? [];
    const existingFieldNames = new Set(existingFields.map((f) => f.name));
    const missingFields = def.fields.filter((f) => !existingFieldNames.has(f.name));
    if (missingFields.length > 0) {
      await pb.collections.update(existing.id, {
        fields: [
          ...existingFields,
          ...missingFields.map((f) => ({
            name: f.name,
            type: f.type,
            required: f.required ?? false,
            unique: f.unique ?? false,
          })),
        ],
      });
      if (!quiet) {
        console.log(`~ ${def.name} alan eklendi: ${missingFields.map((f) => f.name).join(', ')}`);
      }
    } else if (!quiet) {
      console.log(`- ${def.name} OK`);
    }
    return false;
  }

  if (existing) {
    console.log(`~ ${def.name} kayit API 404 — yeniden olusturuluyor...`);
    await pb.collections.delete(existing.id);
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
  return true;
}

export function isMissingCollectionError(e: unknown): boolean {
  if (!(e instanceof ClientResponseError)) return false;
  const msg = String(e.message ?? (e.response as { message?: string })?.message ?? '');
  return e.status === 404 && /collection/i.test(msg);
}

export async function withCollectionRepair<T>(
  pb: PocketBase,
  fn: (client: PocketBase) => Promise<T>,
): Promise<T> {
  try {
    return await fn(pb);
  } catch (e) {
    if (!isMissingCollectionError(e)) throw e;
    resetAdminPb();
    await ensureContentEngineCollections();
    const fresh = await createFreshAdminPb();
    return await fn(fresh);
  }
}

export async function ensureContentEngineCollections(
  pb?: PocketBase,
  opts?: { quiet?: boolean },
): Promise<{ recreated: boolean }> {
  requirePocketBaseAdmin();
  const quiet = opts?.quiet ?? false;
  const client = pb ?? (await createFreshAdminPb());
  let seoKeywordsRecreated = false;
  let anyRecreated = false;
  for (const def of collections) {
    const created = await ensureCollection(client, def, quiet);
    if (created) anyRecreated = true;
    if (def.name === 'seo_keywords' && created) {
      seoKeywordsRecreated = true;
    }
  }
  if (anyRecreated) {
    resetAdminPb();
  }
  const seededClient = await createFreshAdminPb();
  if (seoKeywordsRecreated) {
    console.log('[pb] seo_keywords yenilendi — keyword seed yukleniyor...');
    await seedKeywords(seededClient, { quiet });
  }
  return { recreated: anyRecreated };
}
