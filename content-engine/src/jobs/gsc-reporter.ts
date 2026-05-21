import { cfg, requirePocketBaseAdmin } from '../config.js';
import { getAdminPb } from '../pb/client.js';
import { fetchGscQueries } from '../gsc/client.js';

async function main() {
  requirePocketBaseAdmin();
  const pb = await getAdminPb();

  const gscRows = await fetchGscQueries(28);
  if (!gscRows.length) {
    console.log('[gsc-reporter] GSC verisi yok veya erisim kapali.');
    return;
  }

  const byQuery = new Map(gscRows.map((r) => [r.query, r]));

  const articles = await pb.collection('rehber_yazilari').getFullList({
    filter: 'durum = "yayinda"',
  });

  let synced = 0;
  for (const article of articles) {
    const slug = String(article.slug ?? '');
    const baslik = String(article.baslik ?? '').toLowerCase();
    let match = byQuery.get(baslik);
    if (!match) {
      for (const [q, row] of byQuery) {
        if (baslik.includes(q) || q.includes(slug.replace(/-/g, ' '))) {
          match = row;
          break;
        }
      }
    }
    if (!match) continue;

    await pb.collection('rehber_yazilari').update(article.id, {
      gsc_tiklama: match.clicks,
      gsc_gosterim: match.impressions,
      gsc_konum: match.position,
    });
    synced++;
  }

  console.log(`GSC sync: ${synced} / ${articles.length} yayin makale`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
