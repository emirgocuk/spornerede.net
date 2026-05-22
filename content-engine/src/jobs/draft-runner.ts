import { cfg, requirePocketBaseAdmin } from '../config.js';
import { getAdminPb } from '../pb/client.js';
import { generateArticleParsed } from '../llm/generate-article.js';
import { buildInternalLinks, buildSiteContext } from '../lib/site-context.js';

export type DraftRunResult =
  | {
      ok: true;
      id: string;
      slug: string;
      baslik: string;
      modelUsed: string;
      anahtar: string;
    }
  | {
      ok: false;
      code: 'daily_limit' | 'no_keyword' | 'rate_limit' | 'error';
      message: string;
    };

async function countTodayDrafts(pb: Awaited<ReturnType<typeof getAdminPb>>): Promise<number> {
  const start = new Date();
  start.setHours(0, 0, 0, 0);
  const list = await pb.collection('rehber_yazilari').getList(1, 200);
  return list.items.filter((row) => {
    const created = new Date(String(row.created ?? ''));
    return !Number.isNaN(created.getTime()) && created >= start;
  }).length;
}

async function pickKeyword(pb: Awaited<ReturnType<typeof getAdminPb>>) {
  const list = await pb.collection('seo_keywords').getList(1, 1, {
    filter: 'durum = "kuyrukta"',
    sort: '-skor',
  });
  const row = list.items[0];
  if (!row) return null;
  return row;
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

export async function runDraftPipeline(): Promise<DraftRunResult> {
  requirePocketBaseAdmin();
  const pb = await getAdminPb();

  const todayCount = await countTodayDrafts(pb);
  if (todayCount >= cfg.dailyArticleLimit) {
    return {
      ok: false,
      code: 'daily_limit',
      message: `Gunluk limit (${cfg.dailyArticleLimit}) dolu. Yarin tekrar deneyin.`,
    };
  }

  const keyword = await pickKeyword(pb);
  if (!keyword) {
    return {
      ok: false,
      code: 'no_keyword',
      message: 'Kuyrukta anahtar kelime yok. npm run seed:keywords calistirin.',
    };
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
      return {
        ok: false,
        code: 'rate_limit',
        message:
          'Ucretsiz model kotasi dolu (429). 15-60 dk sonra tekrar deneyin veya manuel taslak olusturun.',
      };
    }
    return { ok: false, code: 'error', message: msg };
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

  return {
    ok: true,
    id: String(record.id),
    slug: uniqueSlug,
    baslik: parsed.baslik,
    modelUsed,
    anahtar,
  };
}
