/** Branş slug / ad → emoji ve vurgu rengi (şimdilik emoji tabanlı vitrin). */

export type BranchVisual = { emoji: string; renk: string };

const DEFAULT_VISUAL: BranchVisual = { emoji: '🏅', renk: '#E30A17' };

export function slugifyBranch(value: string) {
  return String(value ?? '')
    .trim()
    .toLocaleLowerCase('tr-TR')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

function set(map: Record<string, BranchVisual>, names: string[], emoji: string, renk: string) {
  for (const name of names) {
    const slug = slugifyBranch(name);
    if (slug) map[slug] = { emoji, renk };
  }
}

const SLUG_VISUAL: Record<string, BranchVisual> = {};

set(SLUG_VISUAL, ['Futbol', 'Futsal', 'Plaj Futbolu', 'Kadin Futbolu', 'Teqball'], '⚽', '#22C55E');
set(SLUG_VISUAL, ['Basketbol', '3x3 Basketbol'], '🏀', '#F97316');
set(SLUG_VISUAL, ['Voleybol', 'Plaj Voleybolu'], '🏐', '#8B5CF6');
set(SLUG_VISUAL, ['Hentbol', 'Plaj Hentbolu'], '🤾', '#F97316');
set(SLUG_VISUAL, ['Yuzme', 'Akuatlon'], '🏊', '#3B82F6');
set(SLUG_VISUAL, ['Su Topu'], '🤽', '#3B82F6');
set(SLUG_VISUAL, ['Dalis', 'Serbest Dalis'], '🤿', '#0EA5E9');
set(SLUG_VISUAL, ['Kurek', 'Kano', 'Dragon Bot'], '🚣', '#0284C7');
set(SLUG_VISUAL, ['Rafting'], '🛶', '#0284C7');
set(SLUG_VISUAL, ['Yelken'], '⛵', '#0369A1');
set(SLUG_VISUAL, ['Ruzgar Sorlugu', 'Kitesurf'], '🪁', '#38BDF8');
set(SLUG_VISUAL, ['Surf', 'Wakeboard', 'Su Kayagi'], '🏄', '#06B6D4');
set(SLUG_VISUAL, ['Triatlon', 'Duatlon', 'Modern Pentatlon'], '🏅', '#E30A17');
set(SLUG_VISUAL, ['Atletizm', 'Maraton', 'Kosu', 'Yuruyus', 'Dag Kosusu'], '🏃', '#14B8A6');
set(
  SLUG_VISUAL,
  ['Bisiklet', 'Yol Bisikleti', 'Dag Bisikleti', 'BMX', 'Pist Bisikleti'],
  '🚴',
  '#84CC16',
);
set(SLUG_VISUAL, ['Tenis', 'Squash', 'Padel'], '🎾', '#EAB308');
set(SLUG_VISUAL, ['Masa Tenisi', 'Pickleball'], '🏓', '#F59E0B');
set(SLUG_VISUAL, ['Badminton'], '🏸', '#10B981');
set(SLUG_VISUAL, ['Boks', 'Kick Boks', 'Muay Thai'], '🥊', '#EF4444');
set(
  SLUG_VISUAL,
  ['Karate', 'Taekwondo', 'Judo', 'Aikido', 'Jiu Jitsu', 'Wushu', 'Capoeira'],
  '🥋',
  '#DC2626',
);
set(SLUG_VISUAL, ['Eskrim'], '🤺', '#7C3AED');
set(SLUG_VISUAL, ['Gures', 'Yagli Gures', 'Sambo'], '🤼', '#B45309');
set(SLUG_VISUAL, ['Halter', 'Crossfit'], '🏋️', '#78716C');
set(SLUG_VISUAL, ['Vucut Gelistirme', 'Fitness'], '💪', '#F97316');
set(SLUG_VISUAL, ['Pilates', 'Yoga'], '🧘', '#A855F7');
set(
  SLUG_VISUAL,
  ['Cimnastik', 'Artistik Cimnastik', 'Ritmik Cimnastik', 'Trambolin', 'Akrobasi'],
  '🤸',
  '#EC4899',
);
set(
  SLUG_VISUAL,
  ['Dans', 'Modern Dans', 'Hip Hop Dans', 'Salsa', 'Tango', 'Zumba', 'Halk Oyunlari'],
  '💃',
  '#DB2777',
);
set(SLUG_VISUAL, ['Bale'], '🩰', '#F472B6');
set(SLUG_VISUAL, ['Buz Pateni', 'Artistik Buz Pateni', 'Surat Pateni', 'Rulman Pateni'], '⛸️', '#60A5FA');
set(SLUG_VISUAL, ['Kayak', 'Alp Disiplini', 'Kayakla Atlama'], '⛷️', '#93C5FD');
set(SLUG_VISUAL, ['Kuzey Kayagi'], '🎿', '#93C5FD');
set(SLUG_VISUAL, ['Snowboard'], '🏂', '#60A5FA');
set(SLUG_VISUAL, ['Biathlon', 'Aticilik', 'Atis Poligonu'], '🎯', '#CA8A04');
set(SLUG_VISUAL, ['Buz Hokeyi'], '🏒', '#2563EB');
set(SLUG_VISUAL, ['Curling'], '🥌', '#64748B');
set(SLUG_VISUAL, ['Okculuk', 'Geleneksel Okculuk'], '🏹', '#65A30D');
set(SLUG_VISUAL, ['Binicilik', 'Engel Atlama', 'Atli Dayaniklilik', 'Polo'], '🐎', '#A16207');
set(
  SLUG_VISUAL,
  [
    'Motor Sporlari',
    'Ralli',
    'Karting',
    'Motokros',
    'Enduro',
    'ATV',
    'UTV',
    'Side by Side',
    'Trial Motosiklet',
    'Speedway',
    'Superbike',
    'Supermoto',
    '4x4 Offroad',
  ],
  '🏍️',
  '#525252',
);
set(SLUG_VISUAL, ['E-Spor'], '🎮', '#7C3AED');
set(SLUG_VISUAL, ['Satranc'], '♟️', '#57534E');
set(SLUG_VISUAL, ['Bric'], '♠️', '#57534E');
set(SLUG_VISUAL, ['Bilardo', 'Snooker'], '🎱', '#166534');
set(SLUG_VISUAL, ['Dart'], '🎯', '#CA8A04');
set(SLUG_VISUAL, ['Bocce', 'Petank'], '🥎', '#65A30D');
set(SLUG_VISUAL, ['Ragbi'], '🏉', '#15803D');
set(SLUG_VISUAL, ['Amerikan Futbolu'], '🏈', '#854D0E');
set(SLUG_VISUAL, ['Beyzbol', 'Softbol'], '⚾', '#DC2626');
set(SLUG_VISUAL, ['Lacrosse'], '🥍', '#16A34A');
set(SLUG_VISUAL, ['Yamac Parasutu'], '🪂', '#0EA5E9');
set(SLUG_VISUAL, ['Bowling'], '🎳', '#9333EA');

/** Başvuru formu ve seed için "Diğer" */
set(SLUG_VISUAL, ['Diger', 'Diğer'], '🏅', '#E30A17');

function matchByPattern(slug: string, name: string): BranchVisual | null {
  const haystack = `${slug} ${slugifyBranch(name)} ${name}`.toLocaleLowerCase('tr-TR');

  if (/amerikan.*futbol|ragbi/.test(haystack)) return { emoji: '🏉', renk: '#15803D' };
  if (/futbol|futsal/.test(haystack)) return { emoji: '⚽', renk: '#22C55E' };
  if (/basket/.test(haystack)) return { emoji: '🏀', renk: '#F97316' };
  if (/voleybol/.test(haystack)) return { emoji: '🏐', renk: '#8B5CF6' };
  if (/hentbol/.test(haystack)) return { emoji: '🤾', renk: '#F97316' };
  if (/yuzme|akuatlon/.test(haystack)) return { emoji: '🏊', renk: '#3B82F6' };
  if (/su-topu|su topu/.test(haystack)) return { emoji: '🤽', renk: '#3B82F6' };
  if (/dalis|daliş/.test(haystack)) return { emoji: '🤿', renk: '#0EA5E9' };
  if (/kurek|kano|dragon/.test(haystack)) return { emoji: '🚣', renk: '#0284C7' };
  if (/rafting/.test(haystack)) return { emoji: '🛶', renk: '#0284C7' };
  if (/yelken/.test(haystack)) return { emoji: '⛵', renk: '#0369A1' };
  if (/kite|ruzgar|sorf|surf|wake|kayak.*su|su-kay/.test(haystack)) return { emoji: '🏄', renk: '#06B6D4' };
  if (/triatlon|duatlon|pentatlon/.test(haystack)) return { emoji: '🏅', renk: '#E30A17' };
  if (/atletizm|maraton|kosu|kosusu|yuruyus/.test(haystack)) return { emoji: '🏃', renk: '#14B8A6' };
  if (/bisiklet|bmx/.test(haystack)) return { emoji: '🚴', renk: '#84CC16' };
  if (/tenis/.test(haystack) && !/masa/.test(haystack)) return { emoji: '🎾', renk: '#EAB308' };
  if (/masa-tenis|masa tenis|pickleball/.test(haystack)) return { emoji: '🏓', renk: '#F59E0B' };
  if (/badminton/.test(haystack)) return { emoji: '🏸', renk: '#10B981' };
  if (/boks|muay|kick/.test(haystack)) return { emoji: '🥊', renk: '#EF4444' };
  if (/karate|taekwondo|judo|aikido|jiu|wushu|capoeira|dojo/.test(haystack)) return { emoji: '🥋', renk: '#DC2626' };
  if (/eskrim/.test(haystack)) return { emoji: '🤺', renk: '#7C3AED' };
  if (/gures|sambo/.test(haystack)) return { emoji: '🤼', renk: '#B45309' };
  if (/halter|crossfit/.test(haystack)) return { emoji: '🏋️', renk: '#78716C' };
  if (/fitness|vucut|bodybuilding/.test(haystack)) return { emoji: '💪', renk: '#F97316' };
  if (/pilates|yoga/.test(haystack)) return { emoji: '🧘', renk: '#A855F7' };
  if (/cimnastik|trambolin|akrobasi/.test(haystack)) return { emoji: '🤸', renk: '#EC4899' };
  if (/bale/.test(haystack)) return { emoji: '🩰', renk: '#F472B6' };
  if (/dans|zumba|salsa|tango|halk-oyun/.test(haystack)) return { emoji: '💃', renk: '#DB2777' };
  if (/paten|kayak|snowboard|biathlon|hokeyi|curling/.test(haystack)) {
    if (/hokeyi/.test(haystack)) return { emoji: '🏒', renk: '#2563EB' };
    if (/curling/.test(haystack)) return { emoji: '🥌', renk: '#64748B' };
    if (/snowboard/.test(haystack)) return { emoji: '🏂', renk: '#60A5FA' };
    if (/kuzey/.test(haystack)) return { emoji: '🎿', renk: '#93C5FD' };
    if (/paten/.test(haystack)) return { emoji: '⛸️', renk: '#60A5FA' };
    return { emoji: '⛷️', renk: '#93C5FD' };
  }
  if (/okculuk|okçuluk/.test(haystack)) return { emoji: '🏹', renk: '#65A30D' };
  if (/aticilik|atis|poligon|dart|biathlon/.test(haystack)) return { emoji: '🎯', renk: '#CA8A04' };
  if (/binicilik|polo|engel-atlama|atli/.test(haystack)) return { emoji: '🐎', renk: '#A16207' };
  if (/motor|ralli|karting|motokros|enduro|atv|utv|superbike|supermoto|offroad|speedway/.test(haystack)) {
    return { emoji: '🏍️', renk: '#525252' };
  }
  if (/e-spor|espor/.test(haystack)) return { emoji: '🎮', renk: '#7C3AED' };
  if (/satranc|satranç/.test(haystack)) return { emoji: '♟️', renk: '#57534E' };
  if (/bric/.test(haystack)) return { emoji: '♠️', renk: '#57534E' };
  if (/bilardo|snooker/.test(haystack)) return { emoji: '🎱', renk: '#166534' };
  if (/beyzbol|softbol/.test(haystack)) return { emoji: '⚾', renk: '#DC2626' };
  if (/lacrosse/.test(haystack)) return { emoji: '🥍', renk: '#16A34A' };
  if (/parasut|paraşüt/.test(haystack)) return { emoji: '🪂', renk: '#0EA5E9' };
  if (/bowling/.test(haystack)) return { emoji: '🎳', renk: '#9333EA' };
  if (/bocce|petank/.test(haystack)) return { emoji: '🥎', renk: '#65A30D' };

  return null;
}

export function resolveBranchVisual(
  slug: string,
  name = '',
  stored?: Partial<BranchVisual>,
): BranchVisual {
  const key = slug.trim() || slugifyBranch(name);
  const mapped = (key && SLUG_VISUAL[key]) || matchByPattern(key, name);
  if (mapped) return mapped;

  const storedEmoji = stored?.emoji?.trim();
  if (storedEmoji && storedEmoji !== '🏅') {
    return {
      emoji: storedEmoji,
      renk: stored?.renk?.trim() || DEFAULT_VISUAL.renk,
    };
  }

  return DEFAULT_VISUAL;
}

export function enrichBranchFields(input: {
  slug: string;
  isim: string;
  emoji?: string;
  renk?: string;
  aciklama?: string;
}) {
  const visual = resolveBranchVisual(input.slug, input.isim, {
    emoji: input.emoji,
    renk: input.renk,
  });
  return {
    ...input,
    emoji: visual.emoji,
    renk: visual.renk,
  };
}
