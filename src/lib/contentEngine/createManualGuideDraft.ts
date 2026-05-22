import { getDb, hasDatabaseUrl } from '../../db/client';

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

const TEMPLATE_HTML = (baslik: string) => `<p><strong>${baslik}</strong> — SEO haber taslagidir. Metni asagidan duzenleyip Content Engine veya Habere yayinla ile paylasin.</p>
<h2>Genel bilgi</h2>
<p>...</p>
<h2>Kurs secimi ipuclari</h2>
<ul><li>...</li></ul>
<h2>Sik sorulan sorular</h2>
<p>...</p>`;

export async function createManualGuideDraft(anahtarRaw: string) {
  if (!hasDatabaseUrl()) {
    throw new Error('POCKETBASE_URL yapilandirilmamis.');
  }

  const anahtar = anahtarRaw.trim().toLowerCase();
  if (!anahtar) {
    throw new Error('Anahtar kelime veya baslik gerekli.');
  }

  const db = await getDb();

  let keywordId = '';
  try {
    const kw = await db.collection('seo_keywords').getFirstListItem(
      `anahtar = ${JSON.stringify(anahtar)}`,
    );
    keywordId = String(kw.id);
  } catch {
    const created = await db.collection('seo_keywords').create({
      anahtar,
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
      await db.collection('rehber_yazilari').getFirstListItem(`slug = ${JSON.stringify(candidate)}`);
      n++;
    } catch {
      slug = candidate;
      break;
    }
  }

  const baslik = anahtar.charAt(0).toUpperCase() + anahtar.slice(1);

  const record = await db.collection('rehber_yazilari').create({
    baslik,
    slug,
    meta_title: `${baslik} | SporNerede`,
    meta_description: `${baslik} — spor kurslari ve kayit bilgileri SporNerede'de.`,
    icerik_html: TEMPLATE_HTML(baslik),
    icerik_json: { faq: [] },
    anahtar_kelime_id: keywordId,
    durum: 'incelemede',
    kaynak: 'content-engine:manual',
  });

  return {
    id: String(record.id),
    slug,
    baslik,
    anahtar,
  };
}
