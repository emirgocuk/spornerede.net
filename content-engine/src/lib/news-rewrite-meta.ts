/** GSC tabanli otomatik rewrite izleme — ozet HTML yorumlari */

const REWRITE_RE = /<!--\s*ce-rewrite:([\s\S]*?)\s*-->/i;

export function parseCeRewriteAt(raw: string): Date | null {
  const m = String(raw ?? '').match(REWRITE_RE);
  if (!m?.[1]) return null;
  const t = new Date(m[1].trim()).getTime();
  return Number.isNaN(t) ? null : new Date(t);
}

export function weeksSinceCeRewrite(raw: string, now = Date.now()): number {
  const at = parseCeRewriteAt(raw);
  if (!at) return Infinity;
  return (now - at.getTime()) / (7 * 24 * 60 * 60 * 1000);
}

export function stripCeRewriteComment(raw: string): string {
  return String(raw ?? '')
    .replace(/\n?<!--\s*ce-rewrite:[\s\S]*?-->\s*/gi, '')
    .trim();
}

export function stampCeRewriteMeta(ozet: string, at = new Date()): string {
  const base = stripCeRewriteComment(ozet);
  const stamp = `<!-- ce-rewrite:${at.toISOString()} -->`;
  return base.startsWith('<!--') ? `${stamp}\n${base}` : `${stamp}\n${base}`;
}

/** ce-konu / ce-keyword / ce-mode satirlarini koru */
export function preserveOzetMetaPrefix(originalOzet: string, newBodyHtml: string): string {
  const original = String(originalOzet ?? '');
  const prefix =
    original.match(/(?:<!--\s*ce-(?:konu|keyword|mode|template):[\s\S]*?-->\s*)+/i)?.[0]?.trim() ??
    '';
  const body = String(newBodyHtml ?? '').trim();
  if (!prefix) return body;
  return `${prefix}\n${body}`;
}
