import fs from 'fs';

function loadEnv() {
  const envFiles = ['.env', '/opt/spornerede/.env'];
  const env = {};
  for (const f of envFiles) {
    if (fs.existsSync(f)) {
      const lines = fs.readFileSync(f, 'utf8').split('\n');
      for (const line of lines) {
        const trimmed = line.trim();
        if (!trimmed || trimmed.startsWith('#')) continue;
        const eq = trimmed.indexOf('=');
        if (eq > 0) {
          const k = trimmed.substring(0, eq).trim();
          const v = trimmed.substring(eq + 1).trim();
          env[k] = v;
        }
      }
    }
  }
  return env;
}

async function run() {
  const fileEnv = loadEnv();
  const pbUrl = process.env.POCKETBASE_URL || fileEnv.POCKETBASE_URL || 'http://127.0.0.1:8090';
  const email = process.env.POCKETBASE_ADMIN_EMAIL || fileEnv.POCKETBASE_ADMIN_EMAIL;
  const pass = process.env.POCKETBASE_ADMIN_PASSWORD || fileEnv.POCKETBASE_ADMIN_PASSWORD;

  console.log(`Connecting to PocketBase at ${pbUrl}...`);

  let token = '';
  if (email && pass) {
    // Try _superusers auth first (PB 0.23+)
    let authRes = await fetch(`${pbUrl}/api/collections/_superusers/auth-with-password`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ identity: email, password: pass }),
    });

    if (!authRes.ok) {
      // Fallback to legacy admins auth (PB <= 0.22)
      authRes = await fetch(`${pbUrl}/api/admins/auth-with-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ identity: email, password: pass }),
      });
    }

    if (!authRes.ok) {
      throw new Error(`Admin auth failed: ${authRes.status} ${authRes.statusText}`);
    }

    const authData = await authRes.json();
    token = authData.token;
    console.log('Authenticated successfully.');
  }

  const headers = {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: token } : {}),
  };

  const listRes = await fetch(`${pbUrl}/api/collections/haberler/records?page=1&perPage=500`, { headers });
  if (!listRes.ok) {
    throw new Error(`Failed to list haberler: ${listRes.status} ${listRes.statusText}`);
  }

  const data = await listRes.json();
  const records = data.items || [];
  console.log(`Checking ${records.length} haberler records...`);

  let updatedCount = 0;

  for (const item of records) {
    let ozet = item.ozet || '';
    let changed = false;

    const isEskrim = (item.slug || '').includes('eskrim') || (item.baslik || '').toLowerCase().includes('eskrim');

    if (ozet.includes('photo-1526676037777-05a232554f77')) {
      if (isEskrim) {
        ozet = ozet.replace(
          /https:\/\/images\.unsplash\.com\/photo-1526676037777-05a232554f77\?auto=format&fit=crop&w=1200&q=80/g,
          'https://images.unsplash.com/photo-1589487391730-58f20eb2c308?auto=format&fit=crop&w=1200&q=80'
        );
        ozet = ozet.replace(/alt="[^"]*"/g, 'alt="Eskrim antrenmanı ve kılıç sporu eğitimi"');
      } else {
        ozet = ozet.replace(
          /https:\/\/images\.unsplash\.com\/photo-1526676037777-05a232554f77\?auto=format&fit=crop&w=1200&q=80/g,
          'https://images.unsplash.com/photo-1574629810360-7efbbe195018?auto=format&fit=crop&w=1200&q=80'
        );
      }
      changed = true;
    }

    if (ozet.includes('photo-1519766304817-4f37bda74a29')) {
      ozet = ozet.replace(
        /https:\/\/images\.unsplash\.com\/photo-1519766304817-4f37bda74a29\?auto=format&fit=crop&w=1200&q=80/g,
        'https://images.unsplash.com/photo-1519861531473-9200262188bf?auto=format&fit=crop&w=1200&q=80'
      );
      changed = true;
    }

    if (changed) {
      const patchRes = await fetch(`${pbUrl}/api/collections/haberler/records/${item.id}`, {
        method: 'PATCH',
        headers,
        body: JSON.stringify({ ozet }),
      });

      if (!patchRes.ok) {
        console.error(`Failed to patch ${item.id}:`, patchRes.status, patchRes.statusText);
      } else {
        console.log(`Updated news record: [${item.id}] ${item.baslik} (${item.slug})`);
        updatedCount++;
      }
    }
  }

  console.log(`\nFinished. Total records updated: ${updatedCount}`);
}

run().catch((e) => {
  console.error('Fatal error:', e);
  process.exit(1);
});
