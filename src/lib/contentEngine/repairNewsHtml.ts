/** content-engine/src/lib/repair-news-html.ts ile senkron */
import {
  hasIncompleteEnding,
  hasInternalLinksFooter,
  stripAllInternalLinksFooters,
} from './newsDraftQuality';

export type RepairResult = {
  html: string;
  fixes: string[];
};

const ORPHAN_KAYIT = /<p[^>]*>\s*(?:<strong>\s*)?Kay[ıi]t\s+ve\s*(?:<\/strong>\s*)?<\/p>/gi;

function normalizeH2Title(raw: string): string {
  let t = raw.trim();
  t = t.replace(/Kayitve/gi, 'Kayıt ve');
  t = t.replace(/kayitsureci/gi, 'kayıt süreci');
  t = t.replace(/\s+/g, ' ');
  return t;
}

function stripTags(s: string) {
  return s.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();
}

export function repairNewsHtml(html: string): RepairResult {
  const fixes: string[] = [];
  let out = String(html ?? '').trim();

  out = out.replace(ORPHAN_KAYIT, () => {
    fixes.push('orphan_kayit_ve');
    return '';
  });

  out = out.replace(/<h2[^>]*>([\s\S]*?)<\/h2>/gi, (_full, title) => {
    const normalized = normalizeH2Title(stripTags(title));
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

  if (hasInternalLinksFooter(out)) {
    const stripped = stripAllInternalLinksFooters(out);
    if (stripped !== out) {
      fixes.push('duplicate_ilgili_sayfalar');
      out = stripped;
    }
  }

  return { html: out.trim(), fixes };
}

export function needsFullRewrite(html: string): boolean {
  const body = stripAllInternalLinksFooters(html);
  if (ORPHAN_KAYIT.test(body)) return true;
  if (/Kayitve/i.test(body)) return true;
  if ((body.match(/<h2[^>]*>[^<]*kay[ıi]t[^<]*<\/h2>/gi) ?? []).length > 1) return true;
  if (hasIncompleteEnding(body)) return true;
  return false;
}
