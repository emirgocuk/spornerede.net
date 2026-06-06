import { cfg, requirePocketBaseAdmin } from '../config.js';
import { getAdminPb } from '../pb/client.js';
import { fetchGscQueries } from '../gsc/client.js';
import { discoverGscKeywords } from '../lib/discover-gsc-keywords.js';

function scoreKeyword(
  row: { anahtar: string; niyet?: string; kategori?: string },
  gsc?: { impressions: number; ctr: number },
): number {
  let skor = 10;
  if (gsc) {
    skor += Math.min(50, Math.floor(gsc.impressions / 10));
    if (gsc.impressions >= 50 && gsc.ctr < 0.03) skor += 15;
  }
  const niyet = String(row.niyet ?? '');
  if (niyet === 'islem') skor += 5;
  else if (niyet === 'yonlendirme') skor += 3;
  else skor += 1;
  if (row.kategori === 'sehir_brans') skor += 2;
  return skor;
}

async function main() {
  requirePocketBaseAdmin();
  const pb = await getAdminPb();

  const gscRows = await fetchGscQueries(28);
  const gscByQuery = new Map(gscRows.map((r) => [r.query, r]));

  const keywords: Array<Record<string, unknown>> = [];
  const existingKeys = new Set<string>();
  const pageSize = 100;
  let page = 1;
  while (true) {
    const batch = await pb.collection('seo_keywords').getList(page, pageSize);
    keywords.push(...(batch.items as Array<Record<string, unknown>>));
    for (const kw of batch.items) {
      existingKeys.add(String((kw as Record<string, unknown>).anahtar ?? '').toLowerCase().trim());
    }
    if (batch.items.length < pageSize) break;
    page += 1;
  }

  const discovered = await discoverGscKeywords(pb, gscRows, existingKeys);
  if (discovered > 0) {
    console.log(`GSC kesif: ${discovered} yeni keyword kuyruga eklendi.`);
  }

  let updated = 0;

  for (const kw of keywords) {
    const anahtar = String(kw.anahtar ?? '').toLowerCase().trim();
    const gsc = gscByQuery.get(anahtar);
    const skor = scoreKeyword(
      { anahtar, niyet: String(kw.niyet), kategori: String(kw.kategori) },
      gsc,
    );
    const patch: Record<string, unknown> = { skor };
    if (gsc) {
      patch.gsc_impression = gsc.impressions;
      patch.site_context = {
        gsc_clicks: gsc.clicks,
        gsc_ctr: gsc.ctr,
        gsc_position: gsc.position,
      };
    }
    await pb.collection('seo_keywords').update(String(kw.id), patch);
    updated++;
  }

  console.log(`Keyword skorlari guncellendi: ${updated} kayit, GSC sorgu: ${gscRows.length}`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
