/** Admin editörden veya dış beslemelerden gelen HTML — XSS ve zararlı kodlara karşı temizler */
export function sanitizeArticleHtml(html: string): string {
  let out = String(html ?? '').trim();
  if (!out) return '';

  // Yorum satırlarını kaldır
  out = out.replace(/<!--[\s\S]*?-->/g, '');

  // Zararlı etiketleri (script, iframe, object, embed, form, meta, link, base vb.) ve içeriklerini kaldır
  out = out.replace(/<\s*(script|iframe|object|embed|applet|meta|link|style|form|base)[^>]*>[\s\S]*?<\s*\/\s*\1\s*>/gi, '');
  out = out.replace(/<\s*(script|iframe|object|embed|applet|meta|link|style|form|base)[^>]*\/?>/gi, '');

  // Tehlikeli inline JavaScript olay işleyicilerini (onerror, onload, onclick, onmouseover vb.) temizle
  out = out.replace(/\s*on[a-z]+\s*=\s*(?:'[^']*'|"[^"]*"|[^\s>]+)/gi, '');

  // javascript:, vbscript:, data:text/html bağlantı protokollerini temizle
  out = out.replace(/(?:href|src)\s*=\s*(['"])\s*(?:javascript|vbscript|data:text\/html):.*?\1/gi, '');

  // Editör araç ipucu ve önizleme kalıntılarını temizle
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
