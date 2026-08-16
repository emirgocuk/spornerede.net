import type { GuideArticle } from '../repositories/seoArticles';
import type { NewsItem } from '../repositories/news';
import { resolveBranchVisual } from '../branches/branchEmoji';

const BRANS_MAP: Record<string, { slug: string; name: string }> = {
  voleybol: { slug: 'voleybol', name: 'Voleybol' },
  basketbol: { slug: 'basketbol', name: 'Basketbol' },
  futbol: { slug: 'futbol', name: 'Futbol' },
  yuzme: { slug: 'yuzme', name: 'Yüzme' },
  tenis: { slug: 'tenis', name: 'Tenis' },
  pilates: { slug: 'pilates', name: 'Pilates' },
  badminton: { slug: 'badminton', name: 'Badminton' },
  judo: { slug: 'judo', name: 'Judo' },
  boks: { slug: 'boks', name: 'Boks' },
  jimnastik: { slug: 'cimnastik', name: 'Cimnastik' },
  cimnastik: { slug: 'cimnastik', name: 'Cimnastik' },
  atletizm: { slug: 'atletizm', name: 'Atletizm' },
  karate: { slug: 'karate', name: 'Karate' },
  tekvando: { slug: 'tekvando', name: 'Tekvando' },
  taekwondo: { slug: 'tekvando', name: 'Tekvando' },
  maraton: { slug: 'atletizm', name: 'Maraton' },
  kosu: { slug: 'atletizm', name: 'Koşu' },
  fitness: { slug: 'fitness', name: 'Fitness' },
  bale: { slug: 'bale', name: 'Bale' },
  dans: { slug: 'dans', name: 'Dans' },
  okculuk: { slug: 'okculuk', name: 'Okçuluk' },
  satranc: { slug: 'satranc', name: 'Satranç' },
  oryantiring: { slug: 'oryantiring', name: 'Oryantiring' },
  gures: { slug: 'gures', name: 'Güreş' },
  kurek: { slug: 'kurek', name: 'Kürek' },
  dalis: { slug: 'dalis', name: 'Dalış' },
  masa_tenisi: { slug: 'masa-tenisi', name: 'Masa Tenisi' },
};

function normalize(text: string) {
  return text
    .toLowerCase()
    .replace(/ğ/g, 'g')
    .replace(/ü/g, 'u')
    .replace(/ş/g, 's')
    .replace(/ı/g, 'i')
    .replace(/ö/g, 'o')
    .replace(/ç/g, 'c');
}

function extractBransInfo(...parts: string[]): { slug: string; name: string } | null {
  const blob = normalize(parts.join(' '));
  for (const [key, info] of Object.entries(BRANS_MAP)) {
    if (blob.includes(key)) return info;
  }
  return null;
}

export type NewsBranchTag = {
  name: string;
  slug: string;
  emoji: string;
  renk: string;
  href: string;
  cityChips: { label: string; href: string }[];
};

export type AraSearchLink = {
  href: string;
  label: string;
  description: string;
  chips?: { href: string; label: string }[];
};

/** Haberin branş etiketlerini ve GSC iç linkleme çiplerini tespit eder */
export function detectNewsBranchTags(haber: Pick<NewsItem, 'baslik' | 'kategori' | 'seoDescription' | 'ozet'>): NewsBranchTag | null {
  const info = extractBransInfo(haber.kategori, haber.baslik, haber.seoDescription, haber.ozet);
  if (!info) return null;

  const visual = resolveBranchVisual(info.slug, info.name);
  return {
    name: info.name,
    slug: info.slug,
    emoji: visual.emoji,
    renk: visual.renk,
    href: `/branslar/${info.slug}`,
    cityChips: [
      { label: `Ankara ${info.name}`, href: `/sehirler/ankara/${info.slug}` },
      { label: `İstanbul ${info.name}`, href: `/sehirler/istanbul/${info.slug}` },
      { label: `İzmir ${info.name}`, href: `/sehirler/izmir/${info.slug}` },
      { label: `${info.name} Kursları Bul`, href: `/ara?brans=${info.slug}` },
    ],
  };
}

/** Haber metninden /ara arama sorgusu ve GSC iç linkleme önerileri */
export function buildAraSearchFromNews(haber: Pick<NewsItem, 'baslik' | 'kategori' | 'seoDescription' | 'ozet'>): AraSearchLink {
  const bransTag = detectNewsBranchTags(haber);
  
  if (bransTag) {
    return {
      href: `/ara?brans=${bransTag.slug}`,
      label: `${bransTag.name} Kursları ve Onaylı Kulüpler`,
      description: `Bölgenizdeki lisanslı ${bransTag.name} eğitimlerini, ders saatlerini ve fiyat bilgilerini listeleyin.`,
      chips: [
        { href: `/branslar/${bransTag.slug}`, label: `${bransTag.name} Rehberi` },
        ...bransTag.cityChips,
      ],
    };
  }

  const kat = haber.kategori?.trim() || 'Spor';
  return {
    href: `/ara?q=${encodeURIComponent(kat)}`,
    label: `${kat} Branşında Yakınınızdaki Spor Kursları`,
    description: `Yakınınızdaki en popüler ${kat} kurslarını ve onaylı spor kulüplerini inceleyin.`,
    chips: [
      { href: '/branslar', label: 'Tüm Branşlar' },
      { href: '/sehirler/ankara', label: 'Ankara Spor Kursları' },
      { href: '/sehirler/istanbul', label: 'İstanbul Spor Kursları' },
    ],
  };
}

/** Başlık / kategori ile eşleşen rehberler */
export function pickGuidesForNews(
  haber: Pick<NewsItem, 'baslik' | 'kategori' | 'seoDescription'>,
  guides: GuideArticle[],
  limit = 3,
): GuideArticle[] {
  const tokens = normalize(`${haber.baslik} ${haber.kategori} ${haber.seoDescription}`)
    .split(/\s+/)
    .filter((t) => t.length > 3);

  const brans = extractBransInfo(haber.kategori, haber.baslik);

  const scored = guides
    .map((g) => {
      const blob = normalize(`${g.baslik} ${g.metaDescription} ${g.slug.replace(/-/g, ' ')}`);
      let score = 0;
      for (const t of tokens) {
        if (blob.includes(t)) score += 2;
      }
      if (brans && blob.includes(brans.slug)) score += 5;
      return { g, score };
    })
    .filter((x) => x.score > 0)
    .sort((a, b) => b.score - a.score);

  if (scored.length === 0) {
    return guides.slice(0, limit);
  }

  return scored.slice(0, limit).map((x) => x.g);
}
