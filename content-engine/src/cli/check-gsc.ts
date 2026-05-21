import { cfg } from '../config.js';
import {
  getServiceAccountEmail,
  gscAuthConfigured,
  oauthTokenExists,
} from '../gsc/auth.js';
import { fetchGscQueries, listGscSiteEntries, resolveGscSiteUrl } from '../gsc/client.js';

async function main() {
  console.log('\n=== GSC baglanti kontrolu ===\n');
  console.log('Kimlik:', cfg.gscAuthMode);

  if (!gscAuthConfigured()) {
    console.log('[EKSIK] GSC kimlik bilgisi yok.');
    console.log('  service_account: SEO_GSC_SERVICE_ACCOUNT_PATH');
    console.log('  oauth: SEO_GSC_OAUTH_CLIENT_PATH + token (npm run gsc:oauth)');
    console.log('Rehber: content-engine/GSC-KURULUM-tr.md\n');
    process.exit(1);
  }

  if (cfg.gscAuthMode === 'oauth') {
    console.log('OAuth client:', cfg.gscOAuthClientPath);
    console.log('OAuth token:', cfg.gscOAuthTokenPath, oauthTokenExists() ? '(var)' : '(yok)');
    if (!oauthTokenExists()) {
      console.log('\n[EKSIK] Once: npm run gsc:oauth\n');
      process.exit(1);
    }
  } else {
    console.log('JSON:', cfg.gscServiceAccountPath);
    const email = getServiceAccountEmail();
    if (email) {
      console.log('client_email (GSC kullanicilarina eklenmeli):', email);
      console.log('  → "e-posta bulunamadi" ise rehberde OAuth bolumune bakin.');
    }
  }

  console.log('.env site:', cfg.gscSiteUrl || '(bos)');

  let sites: Awaited<ReturnType<typeof listGscSiteEntries>>;
  try {
    sites = await listGscSiteEntries();
  } catch (e) {
    console.error('\n[HATA] GSC API:', e instanceof Error ? e.message : e);
    process.exit(1);
  }

  if (!sites.length) {
    console.log('\n[UYARI] Hic mulk gorunmuyor.');
    if (cfg.gscAuthMode === 'service_account') {
      console.log('  → Service account GSC kullanicilarina ekli degil VEYA Google arayuzu reddetti.');
      console.log('  → Cozum: SEO_GSC_AUTH_MODE=oauth + npm run gsc:oauth (kisisel hesap)\n');
    } else {
      console.log('  → OAuth ile girilen hesapta spornerede mulku var mi kontrol edin.\n');
    }
    process.exit(1);
  }

  console.log('\nErisilebilir mulkler:\n');
  for (const s of sites) {
    console.log(`  ${s.siteUrl}  (${s.permissionLevel ?? '?'})`);
  }

  const resolved = await resolveGscSiteUrl();
  console.log('\nKullanilacak siteUrl:', resolved);

  if (resolved !== cfg.gscSiteUrl) {
    console.log('\n[ONERI] .env:');
    console.log(`SEO_GSC_SITE_URL=${resolved}`);
  }

  try {
    const rows = await fetchGscQueries(7);
    console.log(`\nTest sorgu (son 7 gun): ${rows.length} satir`);
    if (rows[0]) {
      console.log('Ornek:', rows[0].query, '| imp:', rows[0].impressions);
    }
    console.log('\nGSC baglantisi OK.\n');
  } catch (e) {
    console.error('\n[HATA] Sorgu:', e instanceof Error ? e.message : e);
    process.exit(1);
  }
}

main();
