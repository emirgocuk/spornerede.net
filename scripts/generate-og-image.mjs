#!/usr/bin/env node
/**
 * generate-og-image.mjs
 * public/og-image.svg dosyasini public/og-image.png olarak rasterize eder.
 * Cikti: 1200x630, optimize edilmis PNG.
 *
 * Kullanim:
 *   node scripts/generate-og-image.mjs
 *
 * Astro build sirasinda calistirmaya gerek yok; SVG'yi degistirdikten sonra
 * bu scripti elle calistirip dogan PNG'yi commitlemek yeterli.
 */
import { readFile, writeFile } from 'node:fs/promises';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import sharp from 'sharp';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const SVG_PATH = resolve(__dirname, '..', 'public', 'og-image.svg');
const PNG_PATH = resolve(__dirname, '..', 'public', 'og-image.png');

async function main() {
  const svg = await readFile(SVG_PATH);
  const png = await sharp(svg, { density: 144 })
    .resize(1200, 630, { fit: 'cover' })
    .png({ compressionLevel: 9, quality: 92 })
    .toBuffer();
  await writeFile(PNG_PATH, png);
  console.log(`[og] ${PNG_PATH} (${(png.byteLength / 1024).toFixed(1)} KB)`);
}

main().catch((error) => {
  console.error('[og] PNG uretilemedi:', error);
  process.exitCode = 1;
});
