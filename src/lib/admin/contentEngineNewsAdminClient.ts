type ApiDeps = {
  apiPost: (path: string, body: Record<string, unknown>) => Promise<unknown>;
  onDraftReady: (legacyId: number) => void | Promise<void>;
};

type DraftCreated = {
  id: number;
  slug: string;
  baslik: string;
  konu?: string;
  modelUsed?: string;
};

export function mountContentEngineNews(deps: ApiDeps) {
  const generateBtn = document.getElementById('ce-generate-news');
  const manualBtn = document.getElementById('ce-manual-news');
  const statusEl = document.getElementById('ce-news-status');
  const loadNewsBtn = document.getElementById('load-news');

  let busy = false;

  function setStatus(text: string, tone: '' | 'busy' | 'ok' | 'warn' = '') {
    if (!statusEl) return;
    statusEl.textContent = text;
    statusEl.classList.remove('is-busy', 'is-ok', 'is-warn');
    if (tone) statusEl.classList.add(`is-${tone}`);
  }

  function setBusy(on: boolean) {
    busy = on;
    generateBtn?.toggleAttribute('disabled', on);
    manualBtn?.toggleAttribute('disabled', on);
    loadNewsBtn?.toggleAttribute('disabled', on);
  }

  async function postWithTimeout(
    path: string,
    body: Record<string, unknown>,
    timeoutMs = 300_000,
  ) {
    const ac = new AbortController();
    const timer = setTimeout(() => ac.abort(), timeoutMs);
    try {
      const response = await fetch(path, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
        signal: ac.signal,
      });
      if (!response.ok) {
        const payload = await response.json().catch(() => ({}));
        const p = payload as { error?: string; message?: string };
        throw new Error(p.error || p.message || `Request failed (${response.status})`);
      }
      const payload = await response.json();
      return (payload as { data?: unknown }).data;
    } catch (e) {
      if (e instanceof Error && e.name === 'AbortError') {
        throw new Error(
          'Istek zaman asimi (5 dk). Model kotasi veya yavas API — biraz sonra tekrar deneyin.',
        );
      }
      throw e;
    } finally {
      clearTimeout(timer);
    }
  }

  async function generateNews() {
    if (busy) return;
    const konu = prompt(
      'Haber konusu (bos = keyword kuyrugu). LLM uretir (1-3 dk surebilir):\n\nOrnek: istanbul voleybol kursu',
    );
    if (konu === null) return;

    setBusy(true);
    setStatus('LLM haber uretiliyor (model deneniyor)…', 'busy');
    try {
      const body = konu.trim() ? { konu: konu.trim() } : {};
      const data = (await postWithTimeout(
        '/api/admin/content-engine/generate-news-draft',
        body,
      )) as DraftCreated;
      if (!data?.id) throw new Error('Haber uretilemedi');
      if (data.konu) {
        sessionStorage.setItem(`ce-konu-${data.id}`, data.konu);
      }
      const modelUsed = (data as { modelUsed?: string }).modelUsed;
      const tpl = (data as { templateId?: string }).templateId;
      const autoPub = (data as { autoPublished?: boolean }).autoPublished;
      setStatus(
        tpl
          ? `Sablon: ${tpl}${autoPub ? ' · yayinda' : ''} — ${data.baslik}`
          : `LLM${modelUsed ? ` (${modelUsed})` : ''}${autoPub ? ' · yayinda' : ''} — ${data.baslik}`,
        'ok',
      );
      await deps.onDraftReady(data.id);
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'Uretim basarisiz';
      setStatus(msg, msg.includes('429') || msg.includes('kota') ? 'warn' : 'busy');
      if (!msg.includes('429')) alert(msg);
    } finally {
      setBusy(false);
    }
  }

  async function manualNews() {
    if (busy) return;
    const baslik = prompt('Haber basligi:\n(ornek: SporNerede yaz kamplari duyurusu)')?.trim();
    if (!baslik) return;

    setBusy(true);
    setStatus('Manuel haber taslagı…', 'busy');
    try {
      const data = (await deps.apiPost('/api/admin/content-engine/manual-news-draft', {
        baslik,
      })) as DraftCreated;
      if (!data?.id) throw new Error('Taslak olusturulamadi');
      sessionStorage.setItem(`ce-konu-${data.id}`, (data as { konu?: string }).konu || baslik);
      setStatus(`Manuel taslak: ${data.baslik}`, 'ok');
      await deps.onDraftReady(data.id);
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'Hata';
      setStatus(msg, 'warn');
      alert(msg);
    } finally {
      setBusy(false);
    }
  }

  generateBtn?.addEventListener('click', () => generateNews());
  manualBtn?.addEventListener('click', () => manualNews());
}
