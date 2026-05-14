#!/usr/bin/env node
/**
 * copy-fonts.mjs
 * @fontsource/outfit dosyalarini node_modules'den public/fonts'a kopyalar,
 * ardindan public/fonts/outfit-fonts.css uretir (sayfa kritik yolunu kisaltmak icin
 * @font-face kurallari global CSS bundle'ina gomulmez; BaseLayout async yukler).
 *
 * Agirliklar: 400-900 (300 kullanilmiyor). woff2 + latin + latin-ext.
 * Build oncesi: `npm run fonts:copy` (package.json prebuild ile otomatik).
 */
import { mkdir, copyFile, readdir, stat, writeFile, unlink } from 'node:fs/promises';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const PROJECT = resolve(__dirname, '..');

const SRC = join(PROJECT, 'node_modules', '@fontsource', 'outfit', 'files');
const DEST = join(PROJECT, 'public', 'fonts', 'outfit');
const OUTFIT_CSS = join(PROJECT, 'public', 'fonts', 'outfit-fonts.css');

const WEIGHTS = [400, 500, 600, 700, 800, 900];
const SUBSETS = ['latin', 'latin-ext'];

const UNICODE_LATIN =
  'U+0000-00FF, U+0131, U+0152-0153, U+02BB-02BC, U+02C6, U+02DA, U+02DC, U+2000-206F, U+2074, U+20AC, U+2122, U+2191, U+2193, U+2212, U+2215, U+FEFF, U+FFFD';
const UNICODE_LATIN_EXT =
  'U+0100-024F, U+0259, U+1E00-1EFF, U+2020, U+20A0-20AB, U+20AD-20CF, U+2113, U+2C60-2C7F, U+A720-A7FF';

function fontFaceBlock(weight, unicodeRange, filename) {
  return `@font-face {
  font-family: 'Outfit';
  font-style: normal;
  font-weight: ${weight};
  font-display: swap;
  src: url('/fonts/outfit/${filename}') format('woff2');
  unicode-range: ${unicodeRange};
}
`;
}

async function writeOutfitFontCss() {
  let css = `/* Outfit — self-hosted; scripts/copy-fonts.mjs tarafindan uretildi. */
`;
  for (const weight of WEIGHTS) {
    css += fontFaceBlock(weight, UNICODE_LATIN, `outfit-latin-${weight}-normal.woff2`);
    css += fontFaceBlock(weight, UNICODE_LATIN_EXT, `outfit-latin-ext-${weight}-normal.woff2`);
  }
  await writeFile(OUTFIT_CSS, css, 'utf8');
}

async function removeObsolete300() {
  for (const name of ['outfit-latin-300-normal.woff2', 'outfit-latin-ext-300-normal.woff2']) {
    try {
      await unlink(join(DEST, name));
    } catch {
      /* yoksa atla */
    }
  }
}

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
  await removeObsolete300();

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
  await writeOutfitFontCss();
  console.log(`[fonts] ${copied} woff2 dosyasi kopyalandi -> ${DEST}`);
  console.log(`[fonts] @font-face -> ${OUTFIT_CSS}`);
}

main().catch((error) => {
  console.error('[fonts] kopyalama hatasi:', error);
  process.exitCode = 1;
});
