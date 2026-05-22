import {
  hasIncompleteEnding,
  hasInternalLinksFooter,
  stripAllInternalLinksFooters,
} from './news-draft-quality.js';

export type RepairResult = {
  html: string;
  fixes: string[];
};

const ORPHAN_KAYIT = /<p[^>]*>\s*(?:<strong>\s*)?Kay[ıi]t\s+ve\s*(?:<\/strong>\s*)?<\/p>/gi;
const ORPHAN_SHORT_P = /<p[^>]*>\s*(?:<strong>\s*)?([^<]{1,18})\s*(?:<\/strong>\s*)?<\/p>/gi;

function normalizeH2Title(raw: string): string {
  let t = raw.trim();
  t = t.replace(/Kayitve/gi, 'Kayıt ve');
  t = t.replace(/kayitsureci/gi, 'kayıt süreci');
  t = t.replace(/kayit\s*ve\s*kayit/gi, 'Kayıt ve kayıt');
  t = t.replace(/\s+/g, ' ');
  return t;
}

function stripTags(s: string) {
  return s.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();
}

/** Deterministik HTML onarimi — LLM oncesi/sonrasi */
export function repairNewsHtml(html: string): RepairResult {
  const fixes: string[] = [];
  let out = String(html ?? '').trim();

  out = out.replace(ORPHAN_KAYIT, () => {
    fixes.push('orphan_kayit_ve_paragraph');
    return '';
  });

  out = out.replace(ORPHAN_SHORT_P, (full, inner) => {
    const plain = stripTags(inner);
    if (/^(kay[ıi]t\s+ve|program\s+ve|ve)$/i.test(plain)) {
      fixes.push(`orphan_short_p:${plain}`);
      return '';
    }
    return full;
  });

  out = out.replace(/<h2[^>]*>([\s\S]*?)<\/h2>/gi, (full, title) => {
    const normalized = normalizeH2Title(stripTags(title));
    if (normalized !== stripTags(title)) fixes.push(`h2_normalize:${stripTags(title)}`);
    return `<h2>${normalized}</h2>`;
  });

  let kayitH2Count = 0;
  out = out.replace(
    /<h2[^>]*>[^<]*kay[ıi]t[^<]*<\/h2>[\s\S]*?(?=<h2[^>]*>|$)/gi,
    (block) => {
      kayitH2Count += 1;
      if (kayitH2Count > 1) {
        fixes.push('duplicate_kayit_h2');
        return '';
      }
      return block;
    },
  );

  out = out.replace(/<p>(\s|&nbsp;|<br\s*\/?>)*<\/p>/gi, '');
  out = out.replace(/\n{3,}/g, '\n');

  if (hasInternalLinksFooter(out)) {
    const stripped = stripAllInternalLinksFooters(out);
    if (stripped !== out) {
      fixes.push('duplicate_ilgili_sayfalar');
      out = stripped;
    }
  }

  return { html: out.trim(), fixes };
}

export function detectNewsDefects(html: string): string[] {
  const body = stripAllInternalLinksFooters(html);
  const defects: string[] = [];

  if (ORPHAN_KAYIT.test(body)) defects.push('orphan_kayit_ve');
  if (/Kayitve/i.test(body)) defects.push('typo_kayitve');
  if ((body.match(/<h2[^>]*>[^<]*kay[ıi]t[^<]*<\/h2>/gi) ?? []).length > 1) {
    defects.push('duplicate_kayit_heading');
  }
  if (hasIncompleteEnding(body)) defects.push('incomplete_ending');

  return defects;
}

export function needsFullRewrite(html: string): boolean {
  return detectNewsDefects(html).length > 0;
}
