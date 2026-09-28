import { DatabaseSync } from 'node:sqlite';
import { existsSync, readFileSync } from 'node:fs';

function makeLegacyId(...parts) {
  const key = parts.join('|');
  let hash = 2166136261;
  for (let i = 0; i < key.length; i += 1) {
    hash ^= key.charCodeAt(i);
    hash = Math.imul(hash, 16777619);
  }
  return Math.abs(hash >>> 0);
}

function generatePbId() {
  const chars = 'abcdefghijklmnopqrstuvwxyz0123456789';
  let id = '';
  for (let i = 0; i < 15; i += 1) {
    id += chars[Math.floor(Math.random() * chars.length)];
  }
  return id;
}

const NEW_BRANCHES = [
  {
    ad: 'Hokey',
    slug: 'hokey',
    emoji: '🏑',
    renk: '#10B981',
    aciklama: 'Açık alan ve salon hokeyi; strateji, hız, çeviklik ve dinamik takım oyunu eğitimi',
  },
  {
    ad: 'MMA',
    slug: 'mma',
    emoji: '🥊',
    renk: '#DC2626',
    aciklama: 'Karma dövüş sanatları; boks, güreş, jiu-jitsu ve tekme-yumruk tekniklerini birleştiren tam temaslı mücadele sporu',
  },
  {
    ad: 'Hemsball',
    slug: 'hemsball',
    emoji: '🏓',
    renk: '#F59E0B',
    aciklama: 'Milli spor dalımız; refleks, odaklanma, el-göz koordinasyonu ve denge geliştiren dinamik raket sporu',
  },
];

async function addToSqlite(dbPath) {
  if (!existsSync(dbPath)) {
    console.warn(`[SQLite] Dosya bulunamadı: ${dbPath}`);
    return false;
  }

  const db = new DatabaseSync(dbPath);

  for (const branch of NEW_BRANCHES) {
    const existing = db.prepare('SELECT id, legacyId, ad, slug, emoji, renk FROM branslar WHERE slug = ?').get(branch.slug);

    if (existing) {
      console.log(`[SQLite] ${branch.ad} branşı (${dbPath}) zaten mevcut:`, existing);
      continue;
    }

    const id = generatePbId();
    const legacyId = makeLegacyId('branch', branch.slug);

    db.prepare(`
      INSERT INTO branslar (id, legacyId, ad, slug, emoji, renk, aciklama)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `).run(id, legacyId, branch.ad, branch.slug, branch.emoji, branch.renk, branch.aciklama);

    const inserted = db.prepare('SELECT id, legacyId, ad, slug, emoji, renk, aciklama FROM branslar WHERE slug = ?').get(branch.slug);
    console.log(`[SQLite] Başarıyla eklendi (${dbPath}):`, inserted);
  }

  const total = db.prepare('SELECT count(*) as count FROM branslar').get();
  console.log(`[SQLite] Toplam branş sayısı:`, total.count);
  return true;
}

async function addToPocketBaseApi() {
  let envFile = '.env';
  if (!existsSync(envFile) && existsSync('/opt/spornerede/.env')) {
    envFile = '/opt/spornerede/.env';
  }
  if (!existsSync(envFile)) return;

  const envLines = readFileSync(envFile, 'utf8').split(/\r?\n/);
  const env = {};
  for (const line of envLines) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const idx = trimmed.indexOf('=');
    if (idx === -1) continue;
    const k = trimmed.slice(0, idx).trim();
    const v = trimmed.slice(idx + 1).trim().replace(/^["']|["']$/g, '');
    env[k] = v;
  }

  const pbUrl = env.POCKETBASE_URL || process.env.POCKETBASE_URL || 'http://127.0.0.1:8090';
  const adminEmail = env.POCKETBASE_ADMIN_EMAIL || process.env.POCKETBASE_ADMIN_EMAIL;
  const adminPass = env.POCKETBASE_ADMIN_PASSWORD || process.env.POCKETBASE_ADMIN_PASSWORD;

  if (!adminEmail || !adminPass) return;

  try {
    const { default: PocketBase } = await import('pocketbase');
    const pb = new PocketBase(pbUrl);
    await pb.collection('_superusers').authWithPassword(adminEmail, adminPass);

    for (const branch of NEW_BRANCHES) {
      const existing = await pb.collection('branslar').getFirstListItem(`slug = "${branch.slug}"`).catch(() => null);
      if (existing) {
        console.log(`[PB API] ${branch.ad} branşı zaten PocketBase API üzerinde mevcut:`, existing.id, existing.ad);
        continue;
      }

      const legacyId = makeLegacyId('branch', branch.slug);
      const created = await pb.collection('branslar').create({
        legacyId,
        ad: branch.ad,
        slug: branch.slug,
        emoji: branch.emoji,
        renk: branch.renk,
        aciklama: branch.aciklama,
      });
      console.log(`[PB API] PocketBase API üzerinden başarıyla eklendi:`, created.id, created.ad);
    }
  } catch (err) {
    console.log('[PB API] PocketBase API çağrısı atlandı / ulaşılamadı:', err.message || err);
  }
}

async function main() {
  console.log('--- Hokey, MMA, Hemsball Branşları Ekleme Başlatılıyor ---');
  const targetDb =
    process.argv[2] ||
    (existsSync('/opt/spornerede/pocketbase/pb_data/data.db')
      ? '/opt/spornerede/pocketbase/pb_data/data.db'
      : 'pocketbase/pb_data/data.db');

  await addToSqlite(targetDb);
  await addToPocketBaseApi();
  console.log('--- İşlem Tamamlandı ---');
}

main().catch((err) => {
  console.error('Hata oluştu:', err);
  process.exit(1);
});
