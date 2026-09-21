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

  // Kırık / 404 veren Unsplash spor görsellerini çalışan yüksek kaliteli görsellerle güncelle
  out = out.replace(
    /https:\/\/images\.unsplash\.com\/photo-1526676037777-05a232554f77[^\s"']*/gi,
    'https://images.unsplash.com/photo-1574629810360-7efbbe195018?auto=format&fit=crop&w=1200&q=80',
  );
  out = out.replace(
    /https:\/\/images\.unsplash\.com\/photo-1519766304817-4f37bda74a29[^\s"']*/gi,
    'https://images.unsplash.com/photo-1519861531473-9200262188bf?auto=format&fit=crop&w=1200&q=80',
  );
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
