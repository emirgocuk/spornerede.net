/** TinyMCE ↔ program bodyJson dönüşümü (panel + admin ilan editörü). */

export function escapeEditorHtml(value: unknown) {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

function renderInlineNodes(nodes: unknown[] = []) {
  return nodes
    .map((node) => {
      if (!node || typeof node !== 'object') return '';
      const n = node as { text?: string; type?: string; marks?: { type: string }[] };
      let text = escapeEditorHtml(n.text || '');
      const marks = Array.isArray(n.marks) ? n.marks : [];
      if (marks.some((mark) => mark.type === 'bold')) text = `<strong>${text}</strong>`;
      if (marks.some((mark) => mark.type === 'italic')) text = `<em>${text}</em>`;
      return text;
    })
    .join('');
}

export function programBodyJsonToHtml(bodyJson: unknown) {
  if (!bodyJson || typeof bodyJson !== 'object') return '';
  const doc = bodyJson as { type?: string; content?: unknown[] };
  if (doc.type !== 'doc' || !Array.isArray(doc.content)) return '';
  return doc.content
    .map((block) => {
      if (!block || typeof block !== 'object') return '';
      const b = block as { type?: string; content?: unknown[] };
      const inner = renderInlineNodes((b.content as unknown[]) ?? []);
      if (b.type === 'heading' && inner) return `<h2>${inner}</h2>`;
      if (b.type === 'paragraph' && inner) return `<p>${inner}</p>`;
      return '';
    })
    .filter(Boolean)
    .join('');
}

function inlineNodesFromElement(el: Element) {
  const content: { type: string; text: string; marks?: { type: string }[] }[] = [];
  el.childNodes.forEach((node) => {
    if (node.nodeType === Node.TEXT_NODE) {
      const text = node.textContent?.trim();
      if (text) content.push({ type: 'text', text });
      return;
    }
    if (!(node instanceof HTMLElement)) return;
    const text = node.textContent?.trim();
    if (!text) return;
    const marks: { type: string }[] = [];
    if (node.tagName === 'STRONG' || node.tagName === 'B') marks.push({ type: 'bold' });
    if (node.tagName === 'EM' || node.tagName === 'I') marks.push({ type: 'italic' });
    content.push({ type: 'text', text, ...(marks.length ? { marks } : {}) });
  });
  return content;
}

export function programHtmlToBodyJson(html: string) {
  const container = document.createElement('div');
  container.innerHTML = html;
  const content: { type: string; content?: unknown[] }[] = [];
  container.childNodes.forEach((child) => {
    if (!(child instanceof HTMLElement)) return;
    const tag = child.tagName.toLowerCase();
    if (tag === 'h2' || tag === 'h3') {
      const inlineContent = inlineNodesFromElement(child);
      if (inlineContent.length) content.push({ type: 'heading', content: inlineContent });
      return;
    }
    if (tag === 'p' || tag === 'div') {
      const inlineContent = inlineNodesFromElement(child);
      if (inlineContent.length) content.push({ type: 'paragraph', content: inlineContent });
    }
  });
  return { type: 'doc', content };
}
