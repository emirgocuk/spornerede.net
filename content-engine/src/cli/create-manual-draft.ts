/**
 * LLM olmadan bos taslak (admin HTML doldurur).
 * Kullanim: npm run create:manual-draft -- voleybol kursu rehberi
 */
import { getAdminPb } from '../pb/client.js';
import { requirePocketBaseAdmin, cfg } from '../config.js';

function slugify(value: string) {
  return value
    .toLowerCase()
    .trim()
    .replace(/ğ/g, 'g')
    .replace(/ü/g, 'u')
    .replace(/ş/g, 's')
    .replace(/ı/g, 'i')
    .replace(/ö/g, 'o')
    .replace(/ç/g, 'c')
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');
}

const anahtar = process.argv.slice(2).join(' ').trim();
if (!anahtar) {
  console.error('Kullanim: npm run create:manual-draft -- <anahtar kelime veya baslik>');
  process.exit(1);
}

const TEMPLATE_HTML = `<p><strong>{{ANAHTAR}}</strong> hakkinda rehber taslagidir. Asagidaki bolumleri doldurun.</p>
<h2>Genel bilgi</h2>
<p>...</p>
<h2>Kurs secimi ipuclari</h2>
<ul><li>...</li></ul>
<h2>Sik sorulan sorular</h2>
<p>...</p>`;

async function main() {
  requirePocketBaseAdmin();
  const pb = await getAdminPb();

  let keywordId = '';
  try {
    const kw = await pb.collection('seo_keywords').getFirstListItem(
      `anahtar = ${JSON.stringify(anahtar.toLowerCase())}`,
    );
    keywordId = String(kw.id);
  } catch {
    const created = await pb.collection('seo_keywords').create({
      anahtar: anahtar.toLowerCase(),
      kategori: 'manuel',
      niyet: 'bilgi',
      durum: 'yazildi',
      skor: 5,
    });
    keywordId = String(created.id);
  }

  const baseSlug = slugify(anahtar) || 'rehber-taslak';
  let slug = baseSlug;
  let n = 0;
  while (true) {
    const candidate = n === 0 ? slug : `${baseSlug}-${n}`;
    try {
      await pb.collection('rehber_yazilari').getFirstListItem(`slug = ${JSON.stringify(candidate)}`);
      n++;
    } catch {
      slug = candidate;
      break;
    }
  }

  const baslik = anahtar.charAt(0).toUpperCase() + anahtar.slice(1);
  const html = TEMPLATE_HTML.replace(/\{\{ANAHTAR\}\}/g, baslik);

  const record = await pb.collection('rehber_yazilari').create({
    baslik,
    slug,
    meta_title: `${baslik} | SporNerede`,
    meta_description: `${baslik} rehberi — yakinindaki spor kurslarini SporNerede ile bulun.`,
    icerik_html: html,
    icerik_json: { faq: [] },
    anahtar_kelime_id: keywordId,
    durum: 'incelemede',
    kaynak: 'content-engine:manual',
  });

  console.log('Manuel taslak:', record.id, slug);
  console.log('Admin → SEO Rehber → duzenle → Yayinla');
  if (!cfg.autoPublish) {
    console.log(`npm run publish:draft -- ${slug}`);
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
