import type PocketBase from 'pocketbase';
import { stripCeKonuFromOzet, stripAllInternalLinksFooters } from './news-draft-quality.js';
import { signaturesSimilar, topicSignature } from './topic-signature.js';

export type PublishedEntry = {
  konu: string;
  signature: string;
  baslik: string;
  slug: string;
  templateId: string;
  aktif: boolean;
  tarih: string;
  keywordId: string;
};

function parseMetaComments(ozet: string) {
  const tpl = ozet.match(/<!--\s*ce-template:([\w_]+)\s*-->/i)?.[1] ?? '';
  const kw = ozet.match(/<!--\s*ce-keyword:([\w]+)\s*-->/i)?.[1] ?? '';
  return { templateId: tpl, keywordId: kw };
}

export async function loadPublishedHistory(pb: PocketBase): Promise<PublishedEntry[]> {
  const rows = await pb.collection('haberler').getFullList();
  const out: PublishedEntry[] = [];

  for (const row of rows) {
    const ozet = String(row.ozet ?? '');
    const { konu, body } = stripCeKonuFromOzet(ozet);
    const topic = konu || String(row.baslik ?? '');
    if (!topic && !body) continue;
    const meta = parseMetaComments(ozet);
    out.push({
      konu: topic,
      signature: topicSignature(topic),
      baslik: String(row.baslik ?? ''),
      slug: String(row.slug ?? ''),
      templateId: meta.templateId,
      aktif: Boolean(row.aktif),
      tarih: String(row.tarih ?? row.created ?? ''),
      keywordId: meta.keywordId,
    });
  }

  return out.sort((a, b) => String(b.tarih).localeCompare(String(a.tarih)));
}

export function isKonuAlreadyPublished(
  konu: string,
  history: PublishedEntry[],
  opts?: { includePassive?: boolean },
): boolean {
  const sig = topicSignature(konu);
  for (const entry of history) {
    if (!opts?.includePassive && !entry.aktif) continue;
    if (signaturesSimilar(sig, entry.signature)) return true;
    if (entry.konu.toLowerCase().trim() === konu.toLowerCase().trim()) return true;
  }
  return false;
}

/** Son yayinlarin ic-link footer'i cikarilmis ana govdeleri (dedup karsilastirmasi icin) */
export async function loadRecentPublishedBodies(pb: PocketBase, limit = 20): Promise<string[]> {
  const rows = await pb.collection('haberler').getFullList({ sort: '-created' });
  const out: string[] = [];
  for (const row of rows) {
    const { body } = stripCeKonuFromOzet(String(row.ozet ?? ''));
    const clean = stripAllInternalLinksFooters(body).trim();
    if (clean) out.push(clean);
    if (out.length >= limit) break;
  }
  return out;
}

export function recentTemplateIds(history: PublishedEntry[], limit = 8): string[] {
  return history
    .filter((h) => h.templateId)
    .slice(0, limit)
    .map((h) => h.templateId);
}

export function buildAvoidanceBrief(history: PublishedEntry[], limit = 12): string {
  const lines = history.slice(0, limit).map((h) => {
    const st = h.aktif ? 'yayinda' : 'pasif';
    return `- [${st}] ${h.konu} (${h.templateId || 'sablon?'}) — ${h.baslik}`;
  });
  return lines.length ? lines.join('\n') : '(henuz yayin yok)';
}

export function buildGscHintText(ctx: Record<string, unknown> | undefined, anahtar: string): string {
  if (!ctx || typeof ctx !== 'object') {
    return `Anahtar: ${anahtar}. GSC verisi yok; metni dogal ve tekrarsiz tut.`;
  }
  const imp = Number(ctx.gsc_impressions ?? ctx.gsc_impression ?? 0);
  const ctr = Number(ctx.gsc_ctr ?? 0);
  const pos = Number(ctx.gsc_position ?? 0);
  const oneri = String(ctx.oneri ?? '').trim();
  const parts = [`Anahtar: ${anahtar}`];
  if (imp > 0) parts.push(`GSC: ${imp} gosterim, CTR %${(ctr * 100).toFixed(1)}, ort. konum ${pos.toFixed(1)}`);
  if (oneri === 'ctr_iyilestir') {
    parts.push('Oneri: meta baslik/aciklamayi guclendir; ilk paragrafta anahtar.');
  }
  return parts.join('. ');
}
