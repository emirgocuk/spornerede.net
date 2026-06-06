/** Takili kalan yaziliyor keyword'lerini kuyruga alir */
import { getAdminPb } from '../pb/client.js';

const pb = await getAdminPb();
const stuck = await pb.collection('seo_keywords').getFullList({
  filter: 'durum = "yaziliyor"',
});
let fixed = 0;
for (const row of stuck) {
  await pb.collection('seo_keywords').update(String(row.id), { durum: 'kuyrukta' });
  fixed++;
}
console.log(`Takili keyword: ${fixed} adet kuyruga alindi.`);
