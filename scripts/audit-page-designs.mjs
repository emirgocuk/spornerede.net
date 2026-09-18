import { readdirSync, statSync, readFileSync } from 'node:fs';
import { join, relative } from 'node:path';

const PAGES_DIR = 'src/pages';

function getAstroFiles(dir) {
  const files = [];
  const entries = readdirSync(dir);
  for (const entry of entries) {
    const full = join(dir, entry);
    const stat = statSync(full);
    if (stat.isDirectory()) {
      files.push(...getAstroFiles(full));
    } else if (entry.endsWith('.astro')) {
      files.push(full);
    }
  }
  return files;
}

function analyzePage(filePath) {
  const content = readFileSync(filePath, 'utf8');
  const relPath = relative(PAGES_DIR, filePath).replace(/\\/g, '/');
  const route = '/' + relPath.replace(/\.astro$/, '').replace(/index$/, '').replace(/\/$/, '');

  // Skip internal / admin / auth / api pages for public design score
  const isExcluded =
    relPath.startsWith('panel/') ||
    relPath.startsWith('api/') ||
    relPath === 'admin.astro' ||
    relPath === 'merkez.astro';

  const isLegal =
    relPath.includes('politikasi') ||
    relPath.includes('kosullari') ||
    relPath.includes('aydinlatma');

  // Design signals
  const hasHero = /class=["'][^"']*(?:hero|header-banner|page-header)[^"']*["']|<Hero/i.test(content);
  const hasAvatarEmoji = /class=["'][^"']*(?:avatar|emoji|icon)[^"']*["']/i.test(content) || /[\u{1F300}-\u{1F9FF}]/u.test(content);
  const hasWhatsApp = /wa\.me|whatsapp/i.test(content);
  const hasPhoneCall = /href=["']tel:|telUrl|\btel:/i.test(content);
  const hasMaps = /maps\.google|google\.com\/maps/i.test(content);
  const hasBreadcrumb = /Breadcrumb/i.test(content);
  const hasJsonLd = /jsonLd|schema/i.test(content);
  const hasPills = /class=["'][^"']*(?:pill|badge|chip)[^"']*["']/i.test(content);
  const hasMultiCol = /grid-template-columns|repeat\(\d|content-layout|two-col|2col/i.test(content);
  const lineCount = content.split('\n').length;

  let score = 0;
  if (hasHero) score += 20;
  if (hasAvatarEmoji) score += 10;
  if (hasWhatsApp) score += 20;
  if (hasPhoneCall) score += 10;
  if (hasMaps) score += 10;
  if (hasBreadcrumb) score += 10;
  if (hasPills) score += 10;
  if (hasMultiCol) score += 10;

  let tier = '✨ Modern / Zengin';
  let badgeColor = '\x1b[32m'; // green
  if (score < 40) {
    tier = '🚨 Atıl / Çok Sade';
    badgeColor = '\x1b[31m'; // red
  } else if (score < 70) {
    tier = '⚠️  Geliştirilebilir';
    badgeColor = '\x1b[33m'; // yellow
  }

  return {
    relPath,
    route: route || '/',
    lineCount,
    isExcluded,
    isLegal,
    score,
    tier,
    badgeColor,
    features: {
      hasHero,
      hasAvatarEmoji,
      hasWhatsApp,
      hasPhoneCall,
      hasMaps,
      hasBreadcrumb,
      hasPills,
      hasMultiCol,
      hasJsonLd,
    },
  };
}

function run() {
  console.log('\n🔍 --- SporNerede Sayfa Tasarımı & Zenginlik Denetimi ---\n');

  const files = getAstroFiles(PAGES_DIR);
  const results = files.map(analyzePage);

  const publicResults = results.filter((r) => !r.isExcluded && !r.isLegal);

  // Sort by score ascending (lowest score = most neglected first)
  publicResults.sort((a, b) => a.score - b.score);

  console.log('📌 Public Kullanıcı Karşılama Sayfaları (Öncelik Sırasına Göre):\n');
  console.log(
    'Puan | Durum               | Satır | Rota / Dosya                  | Eksik Özellikler'
  );
  console.log('-'.repeat(95));

  for (const r of publicResults) {
    const missing = [];
    if (!r.features.hasWhatsApp) missing.push('WhatsApp');
    if (!r.features.hasPhoneCall) missing.push('Telefon');
    if (!r.features.hasMaps) missing.push('Harita');
    if (!r.features.hasMultiCol) missing.push('2-Kolon');
    if (!r.features.hasHero) missing.push('Hero');

    const scoreStr = String(r.score).padStart(3, ' ') + '/100';
    const lineStr = String(r.lineCount).padStart(5, ' ');
    const routeStr = (r.route + ' (' + r.relPath + ')').padEnd(30, ' ').slice(0, 30);
    const missingStr = missing.length ? missing.join(', ') : 'Tam donanımlı';

    console.log(
      `${scoreStr} | ${r.badgeColor}${r.tier.padEnd(19, ' ')}\x1b[0m | ${lineStr} | ${routeStr} | ${missingStr}`
    );
  }

  console.log('\n' + '='.repeat(95));
  console.log('💡 Özet ve Öneriler:');
  const neglected = publicResults.filter((r) => r.score < 40);
  const improvable = publicResults.filter((r) => r.score >= 40 && r.score < 70);

  console.log(`- Acil Yenilenmesi Gereken Atıl Sayfalar: ${neglected.length} adet (${neglected.map(n => n.route).join(', ')})`);
  console.log(`- Geliştirilebilir Sayfalar: ${improvable.length} adet (${improvable.map(n => n.route).join(', ')})`);
  console.log(`- Zengin / Modern Sayfalar: ${publicResults.filter(r => r.score >= 70).length} adet`);
  console.log('='.repeat(95) + '\n');
}

run();
