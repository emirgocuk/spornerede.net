import { cfg } from '../config.js';
import { ensureContentEngineCollections } from '../lib/ensure-collections.js';

async function main() {
  console.log('PocketBase:', cfg.pocketbaseUrl);
  await ensureContentEngineCollections();
  console.log('\nTamam. Sonra: npm run seed:keywords\n');
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
