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

const NEW_BRANCH = {
  ad: 'Sualtı Hokeyi',
  slug: 'sualti-hokeyi',
  emoji: '🤿',
  renk: '#0EA5E9',
  aciklama: 'Havuz dibinde palet, şnorkel ve mini sopalarla oynanan dinamik sualtı takım sporu',
};

async function addToSqlite(dbPath) {
  if (!existsSync(dbPath)) {
    console.warn(`[SQLite] Dosya bulunamadı: ${dbPath}`);
    return false;
  }

  const db = new DatabaseSync(dbPath);
  const existing = db.prepare('SELECT id, legacyId, ad, slug, emoji, renk FROM branslar WHERE slug = ?').get(NEW_BRANCH.slug);

  if (existing) {
    console.log(`[SQLite] Sualtı Hokeyi branşı (${dbPath}) zaten mevcut:`, existing);
    return true;
  }

  const id = generatePbId();
  const legacyId = makeLegacyId('branch', NEW_BRANCH.slug);

  db.prepare(`
    INSERT INTO branslar (id, legacyId, ad, slug, emoji, renk, aciklama)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `).run(id, legacyId, NEW_BRANCH.ad, NEW_BRANCH.slug, NEW_BRANCH.emoji, NEW_BRANCH.renk, NEW_BRANCH.aciklama);

  const inserted = db.prepare('SELECT id, legacyId, ad, slug, emoji, renk, aciklama FROM branslar WHERE slug = ?').get(NEW_BRANCH.slug);
  const total = db.prepare('SELECT count(*) as count FROM branslar').get();
  console.log(`[SQLite] Başarıyla eklendi (${dbPath}):`, inserted);
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

    const existing = await pb.collection('branslar').getFirstListItem(`slug = "${NEW_BRANCH.slug}"`).catch(() => null);
    if (existing) {
      console.log('[PB API] Sualtı Hokeyi branşı zaten PocketBase API üzerinde mevcut.');
      return;
    }

    const legacyId = makeLegacyId('branch', NEW_BRANCH.slug);
    const created = await pb.collection('branslar').create({
      legacyId,
      ad: NEW_BRANCH.ad,
      slug: NEW_BRANCH.slug,
      emoji: NEW_BRANCH.emoji,
      renk: NEW_BRANCH.renk,
      aciklama: NEW_BRANCH.aciklama,
    });
    console.log('[PB API] PocketBase API üzerinden başarıyla eklendi:', created.id, created.ad);
  } catch (err) {
    console.log('[PB API] PocketBase API çağrısı atlandı / ulaşılamadı:', err.message || err);
  }
}

async function main() {
  console.log('--- Sualtı Hokeyi Branşı Ekleme Başlatılıyor ---');
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
