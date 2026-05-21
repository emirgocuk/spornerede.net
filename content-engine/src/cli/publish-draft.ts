import { getAdminPb } from '../pb/client.js';
import { requirePocketBaseAdmin } from '../config.js';

const slug = process.argv[2]?.trim();
if (!slug) {
  console.error('Kullanim: npm run publish:draft -- <slug>');
  process.exit(1);
}

async function main() {
  requirePocketBaseAdmin();
  const pb = await getAdminPb();
  const record = await pb.collection('rehber_yazilari').getFirstListItem(
    `slug = ${JSON.stringify(slug)}`,
  );

  await pb.collection('rehber_yazilari').update(record.id, {
    durum: 'yayinda',
    yayinlanma_tarihi: new Date().toISOString(),
  });

  console.log(`Yayinda: /rehber/${slug}`);
  console.log('Lokal: http://localhost:4321/rehber/' + slug);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
