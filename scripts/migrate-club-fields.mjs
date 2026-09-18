import { DatabaseSync } from 'node:sqlite';
import { resolve } from 'path';

import { existsSync } from 'node:fs';

const defaultLocal = resolve('pocketbase/pb_data/data.db');
const defaultRemote = '/opt/spornerede/pocketbase/pb_data/data.db';
const dbPath = process.env.PB_DATA_DB || (existsSync(defaultLocal) ? defaultLocal : defaultRemote);
const db = new DatabaseSync(dbPath);

console.log('--- Migrating kulupler table columns ---');
const cols = db.prepare("PRAGMA table_info(kulupler)").all().map(c => c.name);

const requiredCols = [
  { name: 'yetkili', type: 'TEXT DEFAULT ""' },
  { name: 'sonGuncellemeTalebi', type: 'TEXT DEFAULT ""' },
  { name: 'bilgiGuncellendiAt', type: 'TEXT DEFAULT ""' },
  { name: 'guncellemeToken', type: 'TEXT DEFAULT ""' },
  { name: 'guncellemeTokenExp', type: 'TEXT DEFAULT ""' },
];

for (const col of requiredCols) {
  if (!cols.includes(col.name)) {
    console.log(`Adding column ${col.name} to kulupler...`);
    db.exec(`ALTER TABLE kulupler ADD COLUMN ${col.name} ${col.type}`);
  } else {
    console.log(`Column ${col.name} already exists in kulupler.`);
  }
}

// Check if sayfa_ziyaretleri table exists
console.log('--- Ensuring sayfa_ziyaretleri table ---');
db.exec(`
  CREATE TABLE IF NOT EXISTS sayfa_ziyaretleri (
    id TEXT PRIMARY KEY,
    event TEXT NOT NULL,
    target_id TEXT,
    target_title TEXT,
    target_type TEXT,
    page TEXT,
    ip TEXT,
    created_at TEXT DEFAULT (datetime('now'))
  );
  CREATE INDEX IF NOT EXISTS idx_sayfa_ziyaretleri_event ON sayfa_ziyaretleri(event);
  CREATE INDEX IF NOT EXISTS idx_sayfa_ziyaretleri_target ON sayfa_ziyaretleri(target_type, target_id);
  CREATE INDEX IF NOT EXISTS idx_sayfa_ziyaretleri_created ON sayfa_ziyaretleri(created_at);
`);
console.log('sayfa_ziyaretleri table ensured.');

// Sync _collections definition so PocketBase API validates new fields
try {
  const colRow = db.prepare("SELECT id, name, fields FROM _collections WHERE name = 'kulupler'").get();
  if (colRow) {
    const fields = JSON.parse(colRow.fields || '[]');
    let changed = false;
    for (const nf of requiredCols) {
      if (!fields.some(f => f.name === nf.name)) {
        fields.push({
          system: false,
          id: 'fld_' + Math.random().toString(36).substring(2, 10),
          name: nf.name,
          type: 'text',
          required: false,
          presentable: false,
          unique: false,
          options: { min: null, max: null, pattern: '' }
        });
        changed = true;
      }
    }
    if (changed) {
      db.prepare("UPDATE _collections SET fields = ? WHERE id = ?").run(JSON.stringify(fields), colRow.id);
      console.log('PocketBase _collections schema updated for kulupler.');
    }
  }
} catch (e) {
  console.warn('Could not update _collections schema:', e.message);
}

console.log('Migration completed successfully.');

