/**
 * scripts/optimize-cta-images.mjs
 * Landing page CTA (ClubCTA) icin asiri buyuk webp kaynak gorsellerini
 * "kaynak" boyutunda yeniden encode eder. Astro <Image> ile birlikte
 * production'da artistik srcset uretildiginde de toplam transfer ciddi azalir.
 *
 * Kullanim:
 *   node scripts/optimize-cta-images.mjs
 */
import { promises as fs } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import sharp from 'sharp';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, '..');

const targets = [
  'src/assets/images/footwear.webp',
  'src/assets/images/basketball.webp',
  'src/assets/images/voleyball.webp',
];

const MAX_WIDTH = 1600;
const QUALITY = 78;

function fmt(bytes) {
  return `${(bytes / 1024 / 1024).toFixed(2)} MB`;
}

for (const rel of targets) {
  const abs = path.join(root, rel);
  const before = (await fs.stat(abs)).size;
  const input = await fs.readFile(abs);
  const meta = await sharp(input).metadata();
  const targetWidth = Math.min(meta.width ?? MAX_WIDTH, MAX_WIDTH);

  const out = await sharp(input)
    .resize({ width: targetWidth, withoutEnlargement: true })
    .webp({ quality: QUALITY, effort: 6 })
    .toBuffer();

  await fs.writeFile(abs, out);
  const after = (await fs.stat(abs)).size;
  console.log(
    `${rel}: ${meta.width}x${meta.height} ${fmt(before)} -> ${targetWidth}px ${fmt(after)} (-${(((before - after) / before) * 100).toFixed(1)}%)`,
  );
}
