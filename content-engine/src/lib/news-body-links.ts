import type PocketBase from 'pocketbase';
import { cfg } from '../config.js';
import { injectNewsInternalLinks } from './news-draft-quality.js';
import { parseKonu } from './parse-konu.js';
import { loadPublishedHistory } from './published-topics.js';

function slugifyTr(value: string): string {
  const lower = String(value ?? '').toLocaleLowerCase('tr-TR');
  return lower
    .replace(/ğ/g, 'g')
    .replace(/ü/g, 'u')
    .replace(/ş/g, 's')
    .replace(/ı/g, 'i')
    .replace(/ö/g, 'o')
    .replace(/ç/g, 'c')
    .replace(/İ/g, 'i')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

export function clubSlugFromRecord(ad: string, legacyId: number): string {
  const part = slugifyTr(ad) || 'kulup';
  return `${part}-${legacyId}`;
}

export type ClubLinkTarget = { ad: string; slug: string };
export type RelatedHaberTarget = { baslik: string; slug: string };

async function loadMatchingClubs(pb: PocketBase, konu: string, limit = 2): Promise<ClubLinkTarget[]> {
  const parsed = parseKonu(konu);
  try {
    let ilLegacyId: number | null = null;
    if (parsed.hasSehir) {
      const il = await pb
        .collection('iller')
        .getFirstListItem(`slug = "${parsed.sehir}"`)
        .catch(() => null);
      if (il) ilLegacyId = Number(il.legacyId);
    }

    let bransLegacyId: number | null = null;
    if (parsed.hasBrans) {
      const brans = await pb
        .collection('branslar')
        .getFirstListItem(`slug = "${parsed.brans}"`)
        .catch(() => null);
      if (brans) bransLegacyId = Number(brans.legacyId);
    }

    const clubFilter =
      ilLegacyId != null ? `durum = "approved" && ilLegacyId = ${ilLegacyId}` : 'durum = "approved"';
    let clubs = await pb.collection('kulupler').getFullList({ filter: clubFilter }).catch(() => []);

    if (bransLegacyId != null) {
      const links = await pb
        .collection('kulup_branslar')
        .getFullList({ filter: `bransLegacyId = ${bransLegacyId}` })
        .catch(() => []);
      const clubIds = new Set(links.map((l) => Number(l.kulupLegacyId)));
      clubs = clubs.filter((c) => clubIds.has(Number(c.legacyId)));
    }

    return clubs.slice(0, limit).map((c) => {
      const ad = String(c.ad ?? 'Kulüp').trim();
      const legacyId = Number(c.legacyId);
      return { ad, slug: clubSlugFromRecord(ad, legacyId) };
    });
  } catch {
    return [];
  }
}

function daysSince(iso: string): number {
  const t = Date.parse(String(iso).slice(0, 10));
  if (!Number.isFinite(t)) return 999;
  return Math.floor((Date.now() - t) / 86400000);
}

export async function findRelatedHaber(
  pb: PocketBase,
  konu: string,
  excludeSlug?: string,
): Promise<RelatedHaberTarget | null> {
  const parsed = parseKonu(konu);
  const history = await loadPublishedHistory(pb);

  for (const entry of history) {
    if (!entry.aktif || !entry.slug) continue;
    if (excludeSlug && entry.slug === excludeSlug) continue;
    if (daysSince(entry.tarih) > 30) continue;

    const ep = parseKonu(entry.konu);
    const bransMatch = parsed.hasBrans && ep.hasBrans && parsed.brans === ep.brans;
    const sehirMatch = parsed.hasSehir && ep.hasSehir && parsed.sehir === ep.sehir;
    if (!bransMatch && !sehirMatch) continue;

    return { baslik: entry.baslik || entry.konu, slug: entry.slug };
  }
  return null;
}

export async function resolveNewsBodyLinkTargets(
  pb: PocketBase,
  konu: string,
  excludeHaberSlug?: string,
): Promise<{ clubs: ClubLinkTarget[]; related: RelatedHaberTarget | null }> {
  const [clubs, related] = await Promise.all([
    loadMatchingClubs(pb, konu, 2),
    findRelatedHaber(pb, konu, excludeHaberSlug),
  ]);
  return { clubs, related };
}

export function buildClubLinksParagraph(clubs: ClubLinkTarget[], siteUrl: string): string {
  if (!clubs.length) return '';
  const base = siteUrl.replace(/\/$/, '');
  const links = clubs.map(
    (c) => `<a href="${base}/kulupler/${c.slug}">${c.ad.replace(/</g, '')}</a>`,
  );
  return `<p><strong>Platformda örnek kulüpler:</strong> ${links.join(' · ')}.</p>`;
}

export function buildRelatedHaberParagraph(related: RelatedHaberTarget, siteUrl: string): string {
  const base = siteUrl.replace(/\/$/, '');
  const title = related.baslik.replace(/</g, '');
  return `<p><strong>İlgili haber:</strong> <a href="${base}/haberler/${related.slug}">${title}</a>.</p>`;
}

/** CE-6: kulüp + ilgili haber bloklarini footer oncesine ekler. */
export async function injectNewsLinksWithPb(
  pb: PocketBase,
  bodyHtml: string,
  konu: string,
  siteUrl?: string,
  opts?: { excludeHaberSlug?: string },
): Promise<string> {
  const base = (siteUrl ?? cfg.siteUrl).replace(/\/$/, '');
  const { clubs, related } = await resolveNewsBodyLinkTargets(pb, konu, opts?.excludeHaberSlug);
  const blocks = [
    buildClubLinksParagraph(clubs, base),
    related ? buildRelatedHaberParagraph(related, base) : '',
  ]
    .filter(Boolean)
    .join('\n');
  return injectNewsInternalLinks(bodyHtml, konu, base, blocks);
}
