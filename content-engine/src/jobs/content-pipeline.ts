import { cfg, requirePocketBaseAdmin } from '../config.js';
import { getAdminPb } from '../pb/client.js';
import { generateArticleParsed } from '../llm/generate-article.js';
import { buildInternalLinks, buildSiteContext } from '../lib/site-context.js';

async function countTodayDrafts(pb: Awaited<ReturnType<typeof getAdminPb>>): Promise<number> {
  const start = new Date();
  start.setHours(0, 0, 0, 0);
  try {
    const list = await pb.collection('rehber_yazilari').getList(1, 200);
    const items = list.items;
    return items.filter((row) => {
      const created = new Date(String(row.created ?? ''));
      return !Number.isNaN(created.getTime()) && created >= start;
    }).length;
  } catch (e) {
    const msg = String(e);
    if (msg.includes('404') || msg.includes('not found')) {
      console.error('rehber_yazilari yok. Once: npm run setup:collections');
      process.exit(1);
    }
    throw e;
  }
}

async function pickKeyword(pb: Awaited<ReturnType<typeof getAdminPb>>) {
  const list = await pb.collection('seo_keywords').getList(1, 1, {
    filter: 'durum = "kuyrukta"',
    sort: '-skor',
  });
  const row = list.items[0];
  if (!row) throw new Error('Kuyrukta keyword yok');
  return row;
}

async function main() {
  requirePocketBaseAdmin();
  const pb = await getAdminPb();

  const todayCount = await countTodayDrafts(pb);
  if (todayCount >= cfg.dailyArticleLimit) {
    console.log(`Gunluk limit (${cfg.dailyArticleLimit}) dolu. Yarin tekrar deneyin.`);
    return;
  }

  let keyword;
  try {
    keyword = await pickKeyword(pb);
  } catch {
    console.error('Kuyrukta keyword yok. Once: npm run seed:keywords');
    process.exit(1);
  }

  const anahtar = String(keyword.anahtar);
  const siteContext = await buildSiteContext(pb, anahtar);
  const icLinkler = buildInternalLinks(anahtar);

  await pb.collection('seo_keywords').update(keyword.id, { durum: 'yaziliyor' });

  let parsed;
  let modelUsed = cfg.openrouterModel;
  try {
    const result = await generateArticleParsed({
      anahtar,
      kategori: String(keyword.kategori ?? 'diger'),
      niyet: String(keyword.niyet ?? 'bilgi'),
      siteContext,
      icLinkler,
    });
    parsed = result.parsed;
    modelUsed = result.modelUsed;
  } catch (e) {
    await pb.collection('seo_keywords').update(keyword.id, { durum: 'kuyrukta' });
    const msg = String(e);
    const rateLimited = msg.includes('429') || msg.toLowerCase().includes('rate-limited');
    if (rateLimited) {
      console.error(
        '\n[llm] Ucretsiz model kotasi dolu. 15-60 dk sonra: npm run job:draft',
      );
      console.error('      Alternatif: npm run create:manual-draft -- <anahtar>\n');
    }
    if (cfg.draftFailSoft && rateLimited) {
      process.exit(0);
    }
    throw e;
  }

  const uniqueSlug = await ensureUniqueSlug(pb, parsed.slug);

  const record = await pb.collection('rehber_yazilari').create({
    baslik: parsed.baslik,
    slug: uniqueSlug,
    meta_title: parsed.meta_title,
    meta_description: parsed.meta_description,
    icerik_html: parsed.icerik_html,
    icerik_json: parsed.icerik_json,
    anahtar_kelime_id: keyword.id,
    ic_linkler: icLinkler.split('\n').filter(Boolean),
    sema_tipi: parsed.sema_tipi,
    durum: cfg.autoPublish ? 'yayinda' : 'incelemede',
    kaynak: `content-engine:${modelUsed}`,
    ...(cfg.autoPublish ? { yayinlanma_tarihi: new Date().toISOString() } : {}),
  });

  await pb.collection('seo_keywords').update(keyword.id, { durum: 'yazildi' });

  console.log('Taslak olusturuldu:', record.id, uniqueSlug, `(${modelUsed})`);
  console.log(`Onay: npm run publish:draft -- ${uniqueSlug}`);
}

async function ensureUniqueSlug(
  pb: Awaited<ReturnType<typeof getAdminPb>>,
  base: string,
): Promise<string> {
  let slug = base.slice(0, 80) || 'rehber-taslak';
  let n = 0;
  while (true) {
    const candidate = n === 0 ? slug : `${slug}-${n}`;
    try {
      await pb.collection('rehber_yazilari').getFirstListItem(`slug = ${JSON.stringify(candidate)}`);
      n++;
    } catch {
      return candidate;
    }
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
