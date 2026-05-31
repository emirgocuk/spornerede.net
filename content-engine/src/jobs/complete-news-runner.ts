import { requirePocketBaseAdmin } from '../config.js';
import { getAdminPb } from '../pb/client.js';
import { completeNewsBody } from '../llm/generate-news-complete.js';
import {
  assessNewsDraft,
  stripCeKonuFromOzet,
  wrapOzetWithKonu,
} from '../lib/news-draft-quality.js';
import { buildNewsRealData } from '../lib/site-context.js';

export type CompleteNewsResult =
  | {
      ok: true;
      legacyId: number;
      slug: string;
      complete: boolean;
      wordCount: number;
      issues: string[];
      modelUsed: string;
      rewritten: boolean;
    }
  | { ok: false; code: string; message: string };

export async function runCompleteNewsPipeline(legacyId: number): Promise<CompleteNewsResult> {
  requirePocketBaseAdmin();
  const pb = await getAdminPb();

  let record;
  try {
    record = await pb.collection('haberler').getFirstListItem(`legacyId = ${legacyId}`);
  } catch {
    return { ok: false, code: 'not_found', message: 'Haber bulunamadi.' };
  }

  const rawOzet = String(record.ozet ?? '');
  const { konu, body } = stripCeKonuFromOzet(rawOzet);
  const baslik = String(record.baslik ?? '');
  const topic = konu || baslik;

  if (!body.trim()) {
    return { ok: false, code: 'empty', message: 'Metin bos.' };
  }

  let modelUsed = 'none';
  let merged = body;
  let rewritten = false;

  const realData = await buildNewsRealData(pb, topic);

  try {
    const result = await completeNewsBody({
      konu: topic,
      baslik,
      existingHtml: body,
      realData,
    });
    merged = result.html;
    modelUsed = result.modelUsed;
    rewritten = result.rewritten;
  } catch (e) {
    const msg = String(e);
    if (msg.includes('429') || msg.toLowerCase().includes('rate-limited')) {
      return { ok: false, code: 'rate_limit', message: 'Model kotasi dolu (429).' };
    }
    return { ok: false, code: 'error', message: msg };
  }

  const assessment = assessNewsDraft(stripCeKonuFromOzet(merged).body || merged, topic);
  const ozet = wrapOzetWithKonu(topic, merged);

  await pb.collection('haberler').update(record.id, { ozet });

  return {
    ok: true,
    legacyId,
    slug: String(record.slug ?? ''),
    complete: assessment.complete,
    wordCount: assessment.wordCount,
    issues: assessment.issues,
    modelUsed,
    rewritten,
  };
}
