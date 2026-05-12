/**
 * Outlines public/logo-spornerede*.svg (Outfit 900) to paths — no @import / network at view time.
 * Font: @fontsource/outfit files/*.woff if present, else jsDelivr (needs network once).
 * Run: node scripts/outline-outfit-logo.mjs
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import opentype from 'opentype.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, '..');
const outDark = path.join(root, 'public', 'logo-spornerede.svg');
const outLight = path.join(root, 'public', 'logo-spornerede-light.svg');

const OUTFIT_WOFF_REL = path.join(
  'node_modules',
  '@fontsource',
  'outfit',
  'files',
  'outfit-latin-900-normal.woff',
);
const OUTFIT_VERSION = '5.2.8';
const OUTFIT_WOFF_URL = `https://cdn.jsdelivr.net/npm/@fontsource/outfit@${OUTFIT_VERSION}/files/outfit-latin-900-normal.woff`;

function parseFontBuffer(buf) {
  return opentype.parse(buf.buffer.slice(buf.byteOffset, buf.byteOffset + buf.byteLength));
}

function measureWidth(font, text, fontSize, letterSpacingEm) {
  const scale = fontSize / font.unitsPerEm;
  const ls = letterSpacingEm * fontSize;
  let w = 0;
  for (let i = 0; i < text.length; i++) {
    const g = font.charToGlyph(text[i]);
    w += g.advanceWidth * scale;
    if (i < text.length - 1) w += ls;
  }
  return w;
}

function pathForText(font, text, x, y, fontSize, letterSpacingEm) {
  const PathCtor = font.getPath('x', 0, 0, fontSize).constructor;
  const composite = new PathCtor();
  const scale = fontSize / font.unitsPerEm;
  const ls = letterSpacingEm * fontSize;
  let xPos = x;
  for (let i = 0; i < text.length; i++) {
    const glyph = font.charToGlyph(text[i]);
    const gp = glyph.getPath(xPos, y, fontSize);
    composite.extend(gp);
    xPos += glyph.advanceWidth * scale;
    if (i < text.length - 1) xPos += ls;
  }
  return composite;
}

function bboxUnion(a, b) {
  return {
    x1: Math.min(a.x1, b.x1),
    y1: Math.min(a.y1, b.y1),
    x2: Math.max(a.x2, b.x2),
    y2: Math.max(a.y2, b.y2),
  };
}

function wrapPathD(d, maxLen = 96) {
  if (d.length <= maxLen) return d;
  const lines = [];
  let start = 0;
  while (start < d.length) {
    const hardEnd = Math.min(start + maxLen, d.length);
    if (hardEnd >= d.length) {
      lines.push(d.slice(start));
      break;
    }
    const chunk = d.slice(start, hardEnd);
    const rel = chunk.lastIndexOf(' ');
    const breakAt = rel > 8 ? start + rel : hardEnd;
    lines.push(d.slice(start, breakAt));
    start = breakAt;
    while (start < d.length && d[start] === ' ') start += 1;
  }
  return lines.join('\n');
}

async function loadOutfit900Buffer() {
  const local = path.join(root, OUTFIT_WOFF_REL);
  if (fs.existsSync(local)) {
    return fs.readFileSync(local);
  }
  const res = await fetch(OUTFIT_WOFF_URL);
  if (!res.ok) throw new Error(`Fetch Outfit woff failed: ${res.status} ${OUTFIT_WOFF_URL}`);
  return Buffer.from(await res.arrayBuffer());
}

const buf = await loadOutfit900Buffer();
const font = parseFontBuffer(buf);

// Matches legacy logo-spornerede.svg <text> layout (Outfit 900, -0.04em)
const FS1 = 16;
const FS2 = 14;
const FSQ = 40;
const LS = -0.04;
const Y1 = 16;
const Y2 = 32;
const XQ = 68;
const YQ = 38;

const p1 = pathForText(font, 'Spor', 0, Y1, FS1, LS);
const p2 = pathForText(font, 'Nerede', 0, Y2, FS2, LS);
const pQ = font.getPath('?', XQ, YQ, FSQ);

const bAll = bboxUnion(bboxUnion(p1.getBoundingBox(), p2.getBoundingBox()), pQ.getBoundingBox());
const pad = 2;
const vbX = bAll.x1 - pad;
const vbY = bAll.y1 - pad;
const vbW = bAll.x2 - bAll.x1 + 2 * pad;
const vbH = bAll.y2 - bAll.y1 + 2 * pad;

const d1 = wrapPathD(p1.toPathData(3));
const d2 = wrapPathD(p2.toPathData(3));
const dq = wrapPathD(pQ.toPathData(3));

function buildSvg(fillText, fillQ) {
  return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" viewBox="${vbX.toFixed(2)} ${vbY.toFixed(2)} ${vbW.toFixed(2)} ${vbH.toFixed(2)}" role="img" aria-label="Spor Nerede?">
  <!-- Outlined Outfit 900 (no runtime font). Regenerate: npm run logo:outfit-outline -->
  <g fill="${fillText}">
    <path d="${d1}"/>
    <path d="${d2}"/>
  </g>
  <g fill="${fillQ}">
    <path d="${dq}"/>
  </g>
</svg>
`;
}

fs.writeFileSync(outDark, buildSvg('#212529', '#E30A17'), 'utf8');
fs.writeFileSync(outLight, buildSvg('#FFFFFF', '#E30A17'), 'utf8');

console.log('Wrote', outDark);
console.log('Wrote', outLight);
