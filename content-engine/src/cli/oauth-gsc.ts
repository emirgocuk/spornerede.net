import http from 'node:http';
import { URL } from 'node:url';
import { cfg } from '../config.js';
import { GSC_READONLY_SCOPE, saveOAuthToken } from '../gsc/auth.js';

const PORT = 39247;
const REDIRECT_URI = `http://127.0.0.1:${PORT}/oauth2callback`;

async function main() {
  if (!cfg.gscOAuthClientPath) {
    console.log('\n[EKSIK] SEO_GSC_OAUTH_CLIENT_PATH (.env)');
    console.log('GCP → Credentials → OAuth client → Desktop → JSON indir');
    console.log('→ content-engine/secrets/gsc-oauth-client.json\n');
    process.exit(1);
  }

  const tokenPath = cfg.gscOAuthTokenPath || './secrets/gsc-oauth-token.json';
  const { google } = await import('googleapis');
  const { readFileSync } = await import('node:fs');
  const { resolve } = await import('node:path');
  const raw = JSON.parse(
    readFileSync(resolve(cfg.contentEngineRoot, cfg.gscOAuthClientPath), 'utf8'),
  ) as {
    installed?: { client_id: string; client_secret: string };
    web?: { client_id: string; client_secret: string };
  };
  const block = raw.installed ?? raw.web;
  if (!block?.client_id || !block?.client_secret) {
    console.error('OAuth client JSON gecersiz.');
    process.exit(1);
  }

  const oauth2 = new google.auth.OAuth2(block.client_id, block.client_secret, REDIRECT_URI);
  const authUrl = oauth2.generateAuthUrl({
    access_type: 'offline',
    scope: [GSC_READONLY_SCOPE],
    prompt: 'consent',
  });

  console.log('\n=== GSC OAuth (kisisel Google hesabi) ===\n');
  console.log('Search Console mulk sahibi olan hesapla giris yapin.\n');
  console.log(authUrl);
  console.log('\nTarayici acilmazsa yukaridaki linki kopyalayin.\n');

  const code = await new Promise<string>((resolve, reject) => {
    const server = http.createServer((req, res) => {
      try {
        const url = new URL(req.url ?? '/', REDIRECT_URI);
        if (url.pathname !== '/oauth2callback') {
          res.writeHead(404);
          res.end();
          return;
        }
        const err = url.searchParams.get('error');
        if (err) {
          res.writeHead(400);
          res.end(`Hata: ${err}`);
          reject(new Error(err));
          server.close();
          return;
        }
        const c = url.searchParams.get('code');
        if (!c) {
          res.writeHead(400);
          res.end('code yok');
          return;
        }
        res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
        res.end(
          '<p>Giris tamam. Bu sekmeyi kapatabilirsiniz; terminalde devam edecek.</p>',
        );
        resolve(c);
        server.close();
      } catch (e) {
        reject(e);
        server.close();
      }
    });
    server.listen(PORT, '127.0.0.1', () => {
      import('node:child_process').then(({ exec }) => {
        exec(`start "" "${authUrl}"`, () => undefined);
      });
    });
    server.on('error', reject);
  });

  const { tokens } = await oauth2.getToken(code);
  oauth2.setCredentials(tokens);
  saveOAuthToken(tokenPath, {
    refresh_token: tokens.refresh_token ?? undefined,
    access_token: tokens.access_token ?? undefined,
    expiry_date: tokens.expiry_date ?? undefined,
    token_type: tokens.token_type ?? undefined,
    scope: tokens.scope ?? undefined,
  });

  console.log('Token kaydedildi:', tokenPath);
  console.log('\n.env icine ekleyin:\n');
  console.log('SEO_GSC_AUTH_MODE=oauth');
  console.log(`SEO_GSC_OAUTH_CLIENT_PATH=${cfg.gscOAuthClientPath}`);
  console.log(`SEO_GSC_OAUTH_TOKEN_PATH=${tokenPath}`);
  console.log('SEO_GSC_SITE_URL=sc-domain:spornerede.net');
  console.log('\nSonra: npm run gsc:check\n');
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
