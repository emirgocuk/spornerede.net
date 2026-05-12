/**
 * Reads local Georgia Bold (not bundled), outlines header logo text to SVG paths.
 * Writes BOTH in one run (same geometry, only fills differ):
 *   - public/logo-spornerede-header-markup.svg       — #212529 + #FF6B75 (?)
 *   - public/logo-spornerede-header-markup-light.svg — #FFFFFF + #FF6B75 (?)
 * No <text>, no embedded font, wrapPathD for editor-friendly lines.
 * Run: npm run logo:header-outline
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import opentype from 'opentype.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, '..');
const outDark = path.join(root, 'public', 'logo-spornerede-header-markup.svg');
const outLight = path.join(root, 'public', 'logo-spornerede-header-markup-light.svg');

function resolveGeorgiaBold() {
  const candidates = [
    'C:/Windows/Fonts/georgiab.ttf',
    'C:/Windows/Fonts/Georgiab.ttf',
    '/Library/Fonts/Georgia Bold.ttf',
    '/System/Library/Fonts/Supplemental/Georgia Bold.ttf',
  ];
  for (const p of candidates) {
    try {
      if (fs.existsSync(p)) return p;
    } catch {
      /* ignore */
    }
  }
  return null;
}

function parseFont(fontPath) {
  const buf = fs.readFileSync(fontPath);
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

/** @param {import('opentype.js').Font} font */
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

/** Short lines so editors / viewers do not choke on one huge attribute line. */
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

const fontPath = resolveGeorgiaBold();
if (!fontPath) {
  console.error(
    'Georgia Bold not found. On Windows install fonts or use W:\\Windows\\Fonts\\georgiab.ttf path.',
  );
  process.exit(1);
}

const font = parseFont(fontPath);

// Header.astro (16px root): spor 1.2rem, nerede 1.08rem, gaps 0.08rem / 0.16rem
const FS_SPOR = 19.2;
const FS_NEREDE = 17.28;
const FS_Q = 43.2;
const GAP_LINES = 0.08 * 16;
const GAP_STACK_Q = 0.16 * 16;
const Y_SPOR = 15.5;
const Y_NEREDE = Y_SPOR + FS_SPOR * 1 + GAP_LINES;

const pSpor = pathForText(font, 'spor', 0, Y_SPOR, FS_SPOR, -0.03);
const pNerede = pathForText(font, 'nerede', 0, Y_NEREDE, FS_NEREDE, -0.025);

const wStack = Math.max(
  measureWidth(font, 'spor', FS_SPOR, -0.03),
  measureWidth(font, 'nerede', FS_NEREDE, -0.025),
);
const qx = wStack + GAP_STACK_Q;

const bStack = bboxUnion(pSpor.getBoundingBox(), pNerede.getBoundingBox());
const targetMidY = (bStack.y1 + bStack.y2) / 2;

const qProbe = font.getPath('?', qx, 0, FS_Q);
const bQ0 = qProbe.getBoundingBox();
const midQ0 = (bQ0.y1 + bQ0.y2) / 2;
const baselineQ = targetMidY - midQ0;
const pQ = font.getPath('?', qx, baselineQ, FS_Q);

const bAll = bboxUnion(bboxUnion(pSpor.getBoundingBox(), pNerede.getBoundingBox()), pQ.getBoundingBox());
const pad = 2;
const vbX = bAll.x1 - pad;
const vbY = bAll.y1 - pad;
const vbW = bAll.x2 - bAll.x1 + 2 * pad;
const vbH = bAll.y2 - bAll.y1 + 2 * pad;

const dSpor = pSpor.toPathData(3);
const dNerede = pNerede.toPathData(3);
const dQ = pQ.toPathData(3);

const fontBase = path.basename(fontPath);

function buildSvg(fillText, fillQ, note) {
  const ws = wrapPathD(dSpor);
  const wn = wrapPathD(dNerede);
  const wq = wrapPathD(dQ);
  return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" viewBox="${vbX.toFixed(2)} ${vbY.toFixed(2)} ${vbW.toFixed(2)} ${vbH.toFixed(2)}" role="img" aria-label="spor nerede?">
  <!-- ${note} Outlined from local Georgia Bold (${fontBase}). -->
  <g fill="${fillText}">
    <path d="${ws}"/>
    <path d="${wn}"/>
  </g>
  <g fill="${fillQ}">
    <path d="${wq}"/>
  </g>
</svg>
`;
}

fs.writeFileSync(
  outDark,
  buildSvg('#212529', '#FF6B75', 'Inner pages / scrolled header (text).'),
  'utf8',
);
fs.writeFileSync(
  outLight,
  buildSvg('#FFFFFF', '#FF6B75', 'Home header before scroll (site-header--home).'),
  'utf8',
);

console.log('Wrote', outDark, '(dark text)');
console.log('Wrote', outLight, '(light text, same paths as dark)');
