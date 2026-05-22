import PocketBase from 'pocketbase';
import { requirePocketBaseAdmin } from '../config.js';

async function main() {
  const { pocketbaseUrl, pocketbaseAdminEmail, pocketbaseAdminPassword } =
    requirePocketBaseAdmin();
  const pb = new PocketBase(pocketbaseUrl);
  await pb
    .collection('_superusers')
    .authWithPassword(pocketbaseAdminEmail, pocketbaseAdminPassword);

  for (const name of ['seo_keywords', 'rehber_yazilari', 'haberler']) {
    try {
      const r = await pb.collection(name).getList(1, 1);
      console.log(`[OK] ${name} — ${r.totalItems} kayit`);
    } catch (e) {
      const err = e as { status?: number; message?: string };
      console.log(`[ERR] ${name} — ${err.status ?? '?'} ${err.message ?? e}`);
    }
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
