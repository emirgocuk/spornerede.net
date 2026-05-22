/** Admin editorden gelen HTML — PB ve site icin temizler */
export function sanitizeArticleHtml(html: string): string {
  let out = String(html ?? '').trim();
  if (!out) return '';

  out = out.replace(/<!--[\s\S]*?-->/g, '');
  out = out.replace(/<div[^>]*class="[^"]*ql-tooltip[^"]*"[\s\S]*?<\/div>/gi, '');
  out = out.replace(/<a[^>]*class="[^"]*ql-preview[^"]*"[\s\S]*?<\/a>/gi, '');
  out = out.replace(/\sclass="[^"]*"/gi, '');
  out = out.replace(/\sstyle="[^"]*"/gi, '');
  out = out.replace(/\sdata-[a-z-]+="[^"]*"/gi, '');
  out = out.replace(/<p>(\s|&nbsp;|<br\s*\/?>)*<\/p>/gi, '');
  out = out.replace(/<p[^>]*>\s*(?:<strong>\s*)?Kay[ıi]t\s+ve\s*(?:<\/strong>\s*)?<\/p>/gi, '');

  out = out.replace(
    /<p[^>]*>\s*<strong>[^<]*<\/strong>\s*[^<]*(rehber\s+taslag|rehber\s+yazisi|rehber\s+icerik)[^<]*<\/p>/gi,
    '',
  );

  return out.trim();
}

export function pbDateNow(): string {
  return new Date().toISOString();
}
