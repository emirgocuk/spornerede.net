/**
 * Pasif haberi aktif yapar (landing + /haberler).
 * Kullanim: npm run publish:news -- <slug>
 */
import { getAdminPb } from '../pb/client.js';
import { publishNewsBySlug } from '../pb/news.js';
import { requirePocketBaseAdmin, cfg } from '../config.js';

const slug = process.argv[2]?.trim();
if (!slug) {
  console.error('Kullanim: npm run publish:news -- <slug>');
  process.exit(1);
}

async function main() {
  requirePocketBaseAdmin();
  const pb = await getAdminPb();
  const record = await publishNewsBySlug(pb, slug);
  const baslik = String(record.baslik ?? slug);
  console.log(`Yayinda: ${baslik}`);
  console.log(`URL: /haberler/${slug}`);
  console.log(`Lokal: http://localhost:4321/haberler/${slug}`);
  console.log(`Canli: ${cfg.siteUrl}/haberler/${slug}`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
