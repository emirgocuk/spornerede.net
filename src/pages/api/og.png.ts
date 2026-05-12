import type { APIRoute } from 'astro';
import sharp from 'sharp';

export const prerender = false;

/**
 * Dinamik OG image endpoint.
 * Kullanim: /api/og?title=...&kicker=...&badge=...
 *
 * Sosyal medya paylasimi icin 1200x630 PNG uretir.
 * SVG sablonu marka uyumlu (kirmizi-beyaz, Outfit benzeri sistem fontu).
 *
 * Cache: 1 gun CDN cache + SWR
 */

function escapeXml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

/** Tek satira sigmayacak uzun basliklari kelime sinirinda kir */
function wrapText(text: string, maxCharsPerLine: number, maxLines: number): string[] {
  const words = text.split(/\s+/).filter(Boolean);
  const lines: string[] = [];
  let current = '';
  for (const word of words) {
    const candidate = current ? `${current} ${word}` : word;
    if (candidate.length > maxCharsPerLine && current) {
      lines.push(current);
      current = word;
    } else {
      current = candidate;
    }
    if (lines.length === maxLines - 1 && current.length > maxCharsPerLine) {
      // Son satira sigmiyor, ... ekle
      current = `${current.slice(0, maxCharsPerLine - 1)}…`;
      break;
    }
  }
  if (current && lines.length < maxLines) lines.push(current);
  return lines;
}

function buildSvg(opts: {
  title: string;
  kicker?: string;
  badge?: string;
}): string {
  const { title, kicker, badge } = opts;
  const safeTitle = escapeXml(title);
  const safeKicker = kicker ? escapeXml(kicker) : '';
  const safeBadge = badge ? escapeXml(badge) : '';

  const lines = wrapText(safeTitle, 26, 3);
  const titleFontSize = lines.length >= 3 ? 56 : 64;
  const lineHeight = titleFontSize + 14;

  const titleTspans = lines
    .map((line, i) => `<tspan x="80" dy="${i === 0 ? 0 : lineHeight}">${line}</tspan>`)
    .join('');

  return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="630" viewBox="0 0 1200 630">
  <defs>
    <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0" stop-color="#ffffff" />
      <stop offset="0.55" stop-color="#fff5f5" />
      <stop offset="1" stop-color="#ffe7e9" />
    </linearGradient>
    <radialGradient id="glow" cx="0.85" cy="0.15" r="0.6">
      <stop offset="0" stop-color="#E30A17" stop-opacity="0.18" />
      <stop offset="1" stop-color="#E30A17" stop-opacity="0" />
    </radialGradient>
  </defs>

  <rect width="1200" height="630" fill="url(#bg)" />
  <rect width="1200" height="630" fill="url(#glow)" />

  ${
    safeBadge
      ? `<g transform="translate(80, 80)">
    <rect x="0" y="0" width="${Math.max(110, safeBadge.length * 14 + 36)}" height="38" rx="19" fill="#E30A17" />
    <text x="${Math.max(55, (safeBadge.length * 14 + 36) / 2)}" y="25" font-family="-apple-system, 'Segoe UI', system-ui, sans-serif" font-weight="800" font-size="15" fill="#ffffff" text-anchor="middle">${safeBadge.toUpperCase()}</text>
  </g>`
      : ''
  }

  ${
    safeKicker
      ? `<g transform="translate(80, ${safeBadge ? 145 : 110})">
    <text font-family="-apple-system, 'Segoe UI', system-ui, sans-serif" font-weight="700" font-size="20" fill="#6c757d" letter-spacing="2">${safeKicker.toUpperCase()}</text>
  </g>`
      : ''
  }

  <g transform="translate(0, ${safeBadge ? 220 : 190})">
    <text font-family="-apple-system, 'Segoe UI', system-ui, sans-serif" font-weight="900" font-size="${titleFontSize}" fill="#0d0d0d" letter-spacing="-1.8" dominant-baseline="hanging">
      ${titleTspans}
    </text>
  </g>

  <g transform="translate(80, 555)">
    <text font-family="-apple-system, 'Segoe UI', system-ui, sans-serif" font-weight="600" font-size="22" fill="#6c757d">spornerede.net</text>
  </g>

  <g transform="translate(950, 80)" opacity="0.9">
    <circle cx="100" cy="100" r="100" fill="#E30A17" opacity="0.12" />
    <circle cx="100" cy="100" r="100" fill="none" stroke="#E30A17" stroke-width="6" stroke-dasharray="20 10" opacity="0.45" />
    <text x="100" y="120" font-family="-apple-system, 'Segoe UI', system-ui, sans-serif" font-weight="900" font-size="52" fill="#E30A17" text-anchor="middle">SN</text>
  </g>

  <rect x="0" y="618" width="1200" height="12" fill="#E30A17" />
</svg>`;
}

export const GET: APIRoute = async ({ url }) => {
  const params = url.searchParams;
  const title = (params.get('title') ?? 'SporNerede.net').trim().slice(0, 120);
  const kicker = (params.get('kicker') ?? '').trim().slice(0, 60);
  const badge = (params.get('badge') ?? '').trim().slice(0, 30);

  try {
    const svg = buildSvg({ title, kicker, badge });
    const png = await sharp(Buffer.from(svg), { density: 144 })
      .resize(1200, 630, { fit: 'cover' })
      .png({ compressionLevel: 9, quality: 90 })
      .toBuffer();

    return new Response(png, {
      headers: {
        'Content-Type': 'image/png',
        'Cache-Control': 'public, max-age=3600, s-maxage=86400, stale-while-revalidate=604800',
        'X-Content-Type-Options': 'nosniff',
      },
    });
  } catch (error) {
    console.error('[og] Dinamik OG image uretilemedi:', error);
    return new Response(null, { status: 500 });
  }
};
