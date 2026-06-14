import { requirePocketBaseAdmin } from '../config.js';
import { getAdminPb } from '../pb/client.js';
import { pickNewsKeyword } from '../lib/pick-news-keyword.js';

async function main() {
  requirePocketBaseAdmin();
  const pb = await getAdminPb();
  const picked = await pickNewsKeyword(pb);
  console.log(JSON.stringify(picked ? { id: picked.id, anahtar: picked.anahtar } : null));
}

main().catch((e) => {
  console.log(JSON.stringify(null));
  console.error(e instanceof Error ? e.message : e);
  process.exit(1);
});
