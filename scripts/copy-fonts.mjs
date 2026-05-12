#!/usr/bin/env node
/**
 * copy-fonts.mjs
 * @fontsource/outfit dosyalarini node_modules'den public/fonts'a kopyalar.
 *
 * Self-host icin gerekli agirliklari secer (300, 400, 500, 600, 700, 800, 900),
 * sadece woff2 (modern tarayicilar) + Turkce karakterler icin latin + latin-ext
 * subset'lerini kullanir.
 *
 * Build oncesi calistirilabilir: `npm run fonts:copy`.
 */
import { mkdir, copyFile, readdir, stat } from 'node:fs/promises';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const PROJECT = resolve(__dirname, '..');

const SRC = join(PROJECT, 'node_modules', '@fontsource', 'outfit', 'files');
const DEST = join(PROJECT, 'public', 'fonts', 'outfit');

const WEIGHTS = [300, 400, 500, 600, 700, 800, 900];
const SUBSETS = ['latin', 'latin-ext'];

async function ensureDir(p) {
  await mkdir(p, { recursive: true });
}

async function main() {
  try {
    await stat(SRC);
  } catch {
    console.error(`[fonts] @fontsource/outfit bulunamadi: ${SRC}`);
    process.exitCode = 1;
    return;
  }

  await ensureDir(DEST);

  const all = await readdir(SRC);
  let copied = 0;
  for (const weight of WEIGHTS) {
    for (const subset of SUBSETS) {
      const filename = `outfit-${subset}-${weight}-normal.woff2`;
      if (!all.includes(filename)) {
        console.warn(`[fonts] eksik dosya atlanildi: ${filename}`);
        continue;
      }
      await copyFile(join(SRC, filename), join(DEST, filename));
      copied++;
    }
  }
  console.log(`[fonts] ${copied} woff2 dosyasi kopyalandi -> ${DEST}`);
}

main().catch((error) => {
  console.error('[fonts] kopyalama hatasi:', error);
  process.exitCode = 1;
});
