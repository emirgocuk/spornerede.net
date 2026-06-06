type GuideRow = {
  id: string;
  slug: string;
  baslik: string;
  metaTitle: string;
  metaDescription: string;
  icerikHtml: string;
  durum: string;
  kaynak: string;
  yayinlanmaLabel: string;
  gscTiklama: number;
  gscGosterim: number;
  gscKonum: number;
  gscCtr: number;
  anahtarKelimeId: string;
  keywordAnahtar: string;
  performansUyari: '' | 'dusuk_performans' | 'ctr_iyilestir';
};

type ApiDeps = {
  apiGet: (path: string) => Promise<unknown>;
  apiPut: (path: string, body: Record<string, unknown>) => Promise<unknown>;
  apiPost: (path: string, body: Record<string, unknown>) => Promise<unknown>;
  apiDelete: (path: string, body: Record<string, unknown>) => Promise<unknown>;
  escapeHtml: (value: string) => string;
  initGuideEditor: (html: string) => Promise<void>;
  destroyGuideEditor: () => Promise<void>;
  getGuideEditorHtml: () => string;
};

const STATUS_LABEL: Record<string, string> = {
  incelemede: 'İncelemede',
  taslak: 'Taslak',
  yayinda: 'Yayında',
  arsiv: 'Arşiv',
  dusuk_performans: 'Düşük performans',
};

const STATUS_CLASS: Record<string, string> = {
  yayinda: 'status-approved',
  incelemede: 'status-pending',
  taslak: 'status-pending',
  arsiv: 'status-rejected',
  dusuk_performans: 'status-rejected',
};

type DurumFilter = 'all' | 'incelemede' | 'yayinda' | 'dusuk_performans' | 'arsiv';

const FILTER_LABELS: Record<DurumFilter, string> = {
  all: 'Tümü',
  incelemede: 'İncelemede',
  yayinda: 'Yayında',
  dusuk_performans: 'Düşük perf.',
  arsiv: 'Arşiv',
};

export function mountGuidesAdminTab(deps: ApiDeps) {
  const listEl = document.getElementById('guides-list');
  const detailEl = document.getElementById('guides-detail');
  const loadBtn = document.getElementById('load-guides');
  const badgeEl = document.getElementById('guides-tab-badge');
  const filterEl = document.getElementById('guides-filters');
  const countEl = document.getElementById('guides-list-count');
  if (!listEl || !detailEl) return;

  let cached: GuideRow[] = [];
  let selectedId = '';
  let activeFilter: DurumFilter = 'all';

  function statusBadge(durum: string) {
    const label = STATUS_LABEL[durum] ?? durum;
    const cls = STATUS_CLASS[durum] ?? 'status-pending';
    return `<span class="status-badge ${cls}">${deps.escapeHtml(label)}</span>`;
  }

  function perfAlert(guide: GuideRow) {
    if (guide.performansUyari === 'dusuk_performans') {
      return '<span class="guide-perf-pill guide-perf-pill--low" title="GSC: dusuk gosterim">⚠ Dusuk perf.</span>';
    }
    if (guide.performansUyari === 'ctr_iyilestir') {
      return '<span class="guide-perf-pill guide-perf-pill--ctr" title="Yuksek gosterim, dusuk CTR">↗ CTR</span>';
    }
    return '';
  }

  function gscMini(guide: GuideRow) {
    if (guide.gscGosterim <= 0) return '<span class="guide-gsc-mini text-muted">GSC —</span>';
    const ctrPct = (guide.gscCtr * 100).toFixed(1);
    return `<span class="guide-gsc-mini" title="GSC son 28 gun">${guide.gscGosterim} gosterim · ${guide.gscTiklama} tik · %${ctrPct} CTR</span>`;
  }

  function filteredRows() {
    if (activeFilter === 'all') return cached;
    if (activeFilter === 'incelemede') {
      return cached.filter((g) => g.durum === 'incelemede' || g.durum === 'taslak');
    }
    return cached.filter((g) => g.durum === activeFilter);
  }

  function updateBadge() {
    if (!badgeEl) return;
    const pending = cached.filter((g) => g.durum === 'incelemede' || g.durum === 'taslak').length;
    const lowPerf = cached.filter((g) => g.durum === 'dusuk_performans').length;
    const ctr = cached.filter((g) => g.performansUyari === 'ctr_iyilestir').length;
    const total = pending + lowPerf + ctr;
    badgeEl.textContent =
      pending > 0 ? String(pending) : lowPerf > 0 ? `!${lowPerf}` : ctr > 0 ? `↗${ctr}` : '0';
    badgeEl.title =
      pending > 0
        ? `${pending} incelemede`
        : lowPerf > 0
          ? `${lowPerf} dusuk performans`
          : ctr > 0
            ? `${ctr} CTR iyilestir`
            : '';
    badgeEl.classList.toggle('is-hidden', total === 0);
  }

  function renderFilters() {
    if (!filterEl) return;
    filterEl.innerHTML = (Object.keys(FILTER_LABELS) as DurumFilter[])
      .map((key) => {
        const active = key === activeFilter ? 'is-active' : '';
        const count =
          key === 'all'
            ? cached.length
            : key === 'incelemede'
              ? cached.filter((g) => g.durum === 'incelemede' || g.durum === 'taslak').length
              : cached.filter((g) => g.durum === key).length;
        return `<button type="button" class="guide-filter-btn ${active}" data-guide-filter="${key}">${FILTER_LABELS[key]} (${count})</button>`;
      })
      .join('');
  }

  function renderList() {
    const rows = filteredRows();
    if (countEl) countEl.textContent = String(rows.length);
    renderFilters();
    updateBadge();

    if (!rows.length) {
      listEl.innerHTML = '<li class="empty-list">Bu filtrede kayit yok.</li>';
      return;
    }

    listEl.innerHTML = rows
      .map((g) => {
        const active = g.id === selectedId ? 'is-active' : '';
        return `<li>
          <button type="button" class="list-item ${active}" data-guide-id="${deps.escapeHtml(g.id)}">
            <div class="item-main">
              <span class="item-title">${deps.escapeHtml(g.baslik)}</span>
              <span class="item-meta">${deps.escapeHtml(g.slug)}</span>
              ${gscMini(g)}
            </div>
            <div class="item-side">${perfAlert(g)}${statusBadge(g.durum)}</div>
          </button>
        </li>`;
      })
      .join('');
  }

  function perfBanner(guide: GuideRow) {
    if (guide.performansUyari === 'dusuk_performans') {
      return `<div class="guide-alert guide-alert--low">
        <strong>Dusuk performans</strong> — Son 4+ haftada GSC gosterimi cok dusuk. Icerigi guncelleyin veya anahtar kelimeyi yeniden kuyruga alin.
      </div>`;
    }
    if (guide.performansUyari === 'ctr_iyilestir') {
      return `<div class="guide-alert guide-alert--ctr">
        <strong>CTR iyilestir</strong> — Yuksek gosterim (${guide.gscGosterim}) ama dusuk tiklama orani (%${(guide.gscCtr * 100).toFixed(1)}). Meta baslik ve aciklamayi guncelleyin.
      </div>`;
    }
    return '';
  }

  function renderDetail(guide: GuideRow) {
    const publicUrl = guide.durum === 'yayinda' || guide.durum === 'dusuk_performans'
      ? `/haberler?q=${encodeURIComponent(guide.baslik)}`
      : '';
    const canRequeue = Boolean(guide.anahtarKelimeId);

    detailEl.innerHTML = `
      <div class="detail-header">
        <div class="detail-title-area">
          <span class="kicker">SEO ICERIK</span>
          <h2>${deps.escapeHtml(guide.baslik)}</h2>
          <p class="text-sm text-muted">${deps.escapeHtml(guide.kaynak || 'manuel')}${guide.keywordAnahtar ? ` · KW: ${deps.escapeHtml(guide.keywordAnahtar)}` : ''}</p>
        </div>
        <div class="detail-status">${statusBadge(guide.durum)}</div>
      </div>
      ${perfBanner(guide)}
      <div class="detail-grid detail-grid--single">
        <section class="card-section">
          <div class="form-layout">
            <div class="form-row-2">
              <div class="form-group">
                <label>Baslik</label>
                <input id="guide-baslik" class="modern-input" type="text" value="${deps.escapeHtml(guide.baslik)}" />
              </div>
              <div class="form-group">
                <label>Slug</label>
                <input id="guide-slug" class="modern-input" type="text" value="${deps.escapeHtml(guide.slug)}" />
              </div>
            </div>
            <div class="form-group">
              <label>Meta baslik (≤60)</label>
              <input id="guide-meta-title" class="modern-input" type="text" value="${deps.escapeHtml(guide.metaTitle)}" />
            </div>
            <div class="form-group">
              <label>Meta aciklama (≤155)</label>
              <textarea id="guide-meta-description" class="modern-textarea" rows="2">${deps.escapeHtml(guide.metaDescription)}</textarea>
            </div>
            <div class="form-group guide-editor-wrap">
              <label>Metin</label>
              <div id="guide-icerik-mount" class="admin-editor-mount"></div>
              <textarea id="guide-icerik" class="admin-editor-sr-only" aria-hidden="true" tabindex="-1"></textarea>
            </div>
            <p class="section-help guide-gsc-detail">
              GSC (son ~28 gun): <strong>${guide.gscGosterim}</strong> gosterim,
              <strong>${guide.gscTiklama}</strong> tiklama,
              ort. konum <strong>${guide.gscKonum > 0 ? guide.gscKonum.toFixed(1) : '—'}</strong>,
              CTR <strong>${guide.gscGosterim > 0 ? `%${(guide.gscCtr * 100).toFixed(2)}` : '—'}</strong>
            </p>
            <p class="section-help">Yayin: <code>/haberler/[slug]</code> — rehber sayfasi degil.</p>
            <div class="form-actions-row">
              <button type="button" id="guide-save-btn" class="btn btn-primary">Kaydet</button>
              <button type="button" id="guide-publish-news-btn" class="btn btn-success">Habere yayinla</button>
              <button type="button" id="guide-archive-btn" class="btn btn-outline">Arsivle</button>
              ${
                canRequeue
                  ? '<button type="button" id="guide-requeue-btn" class="btn btn-outline">Anahtar kelimeyi kuyruga al</button>'
                  : ''
              }
              ${
                publicUrl
                  ? `<a class="btn btn-outline" href="${publicUrl}" target="_blank" rel="noopener">Sitede gor ↗</a>`
                  : ''
              }
            </div>
            <div class="admin-danger-zone">
              <p class="section-help">Kalici silme geri alinamaz.</p>
              <button type="button" id="guide-delete-btn" class="btn btn-danger w-full">🗑️ Rehberi Sil</button>
            </div>
          </div>
        </section>
      </div>
    `;

    void deps.initGuideEditor(guide.icerikHtml || '');

    document.getElementById('guide-save-btn')?.addEventListener('click', () => saveGuide(guide.id, guide.durum));
    document.getElementById('guide-publish-news-btn')?.addEventListener('click', async () => {
      if (!confirm(`"${guide.baslik}" haber olarak yayinlansin mi?`)) return;
      try {
        await saveGuide(guide.id, guide.durum);
        const res = (await deps.apiPost('/api/admin/content-engine/publish-guide-as-news', {
          guideId: guide.id,
        })) as { previewUrl?: string };
        alert(`Haber yayinda: ${res?.previewUrl ?? '/haberler'}`);
        await loadGuides();
      } catch (e) {
        alert(e instanceof Error ? e.message : 'Haber yayinlanamadi');
      }
    });
    document.getElementById('guide-archive-btn')?.addEventListener('click', () => saveGuide(guide.id, 'arsiv'));
    document.getElementById('guide-requeue-btn')?.addEventListener('click', async () => {
      try {
        await deps.apiPost('/api/admin/guides/requeue-keyword', { id: guide.id });
        alert('Anahtar kelime kuyruga alindi. content-engine job:draft ile yeniden yazilabilir.');
        await loadGuides();
      } catch (e) {
        alert(e instanceof Error ? e.message : 'Kuyruk basarisiz');
      }
    });
    document.getElementById('guide-delete-btn')?.addEventListener('click', async () => {
      if (!confirm(`"${guide.baslik}" kalici olarak silinsin mi?`)) return;
      try {
        await deps.apiDelete('/api/admin/guides', { id: guide.id });
        selectedId = '';
        await loadGuides();
      } catch (e) {
        alert(e instanceof Error ? e.message : 'Silinemedi');
      }
    });
  }

  async function saveGuide(id: string, durum: string) {
    const baslik = (document.getElementById('guide-baslik') as HTMLInputElement | null)?.value?.trim() ?? '';
    const slug = (document.getElementById('guide-slug') as HTMLInputElement | null)?.value?.trim() ?? '';
    const meta_title = (document.getElementById('guide-meta-title') as HTMLInputElement | null)?.value?.trim() ?? '';
    const meta_description =
      (document.getElementById('guide-meta-description') as HTMLTextAreaElement | null)?.value?.trim() ?? '';
    const icerik_html = deps.getGuideEditorHtml();

    if (!baslik || !slug) {
      alert('Baslik ve slug zorunlu.');
      return;
    }

    try {
      await deps.apiPut('/api/admin/guides', {
        id,
        baslik,
        slug,
        meta_title,
        meta_description,
        icerik_html,
        durum,
      });
      await loadGuides();
      selectedId = id;
      const guide = cached.find((g) => g.id === id);
      if (guide) renderDetail(guide);
    } catch (e) {
      alert(e instanceof Error ? e.message : 'Kayit basarisiz');
    }
  }

  function renderEmptyDetail() {
    detailEl.innerHTML = `
      <div class="empty-state">
        <div class="empty-icon">📚</div>
        <h3>Rehber secin</h3>
        <p>SEO taslaklarini duzenleyip <strong>Habere yayinla</strong> ile /haberler altinda paylasin.</p>
      </div>
    `;
  }

  async function loadGuides() {
    await deps.destroyGuideEditor();
    listEl.innerHTML = '<li class="loading-state"><div class="spinner-small"></div> Yukleniyor...</li>';
    try {
      const rows = (await deps.apiGet('/api/admin/guides')) as GuideRow[];
      cached = rows || [];
      if (selectedId && !cached.some((g) => g.id === selectedId)) {
        selectedId = '';
      }
      renderList();
      if (selectedId) {
        const guide = cached.find((g) => g.id === selectedId);
        if (guide) renderDetail(guide);
      } else {
        renderEmptyDetail();
      }
    } catch (e) {
      listEl.innerHTML = `<li class="error-state">${deps.escapeHtml(e instanceof Error ? e.message : 'Hata')}</li>`;
      detailEl.innerHTML = '<div class="error-state">Rehberler yuklenemedi.</div>';
    }
  }

  listEl.addEventListener('click', async (event) => {
    const target = event.target;
    if (!(target instanceof HTMLElement)) return;
    const button = target.closest('button[data-guide-id]');
    if (!button) return;
    const id = button.getAttribute('data-guide-id') || '';
    await deps.destroyGuideEditor();
    selectedId = id;
    renderList();
    const guide = cached.find((g) => g.id === id);
    if (guide) renderDetail(guide);
  });

  filterEl?.addEventListener('click', (event) => {
    const target = event.target;
    if (!(target instanceof HTMLElement)) return;
    const btn = target.closest('button[data-guide-filter]');
    if (!btn) return;
    activeFilter = (btn.getAttribute('data-guide-filter') as DurumFilter) || 'all';
    renderList();
  });

  loadBtn?.addEventListener('click', () => loadGuides());

  const generateLlmBtn = document.getElementById('guide-generate-llm');
  const manualBtn = document.getElementById('guide-manual-draft');
  const statusEl = document.getElementById('guide-generate-status');
  let busy = false;

  function setStatus(text: string, tone: '' | 'busy' | 'ok' | 'warn' = '') {
    if (!statusEl) return;
    statusEl.textContent = text;
    statusEl.classList.remove('is-busy', 'is-ok', 'is-warn');
    if (tone) statusEl.classList.add(`is-${tone}`);
  }

  function setBusy(on: boolean) {
    busy = on;
    generateLlmBtn?.toggleAttribute('disabled', on);
    manualBtn?.toggleAttribute('disabled', on);
    loadBtn?.toggleAttribute('disabled', on);
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
      const payload = await response.json().catch(() => ({}));
      if (!response.ok) {
        const p = payload as { error?: string; message?: string };
        throw new Error(p.error || p.message || `Istek basarisiz (${response.status})`);
      }
      return (payload as { data?: unknown }).data;
    } catch (e) {
      if (e instanceof Error && e.name === 'AbortError') {
        throw new Error('Istek zaman asimi (5 dk). Model kotasi veya yavas API.');
      }
      throw e;
    } finally {
      clearTimeout(timer);
    }
  }

  async function generateGuideLlm() {
    if (busy) return;
    setBusy(true);
    setStatus('Keyword kuyrugundan LLM rehber uretiliyor (1-3 dk)…', 'busy');
    try {
      const data = (await postWithTimeout('/api/admin/content-engine/generate-draft', {})) as {
        id?: string;
        baslik?: string;
        slug?: string;
        modelUsed?: string;
        previewUrl?: string;
      };
      if (!data?.id) throw new Error('Rehber uretilemedi');
      setStatus(
        `Rehber taslak${data.modelUsed ? ` (${data.modelUsed})` : ''} — ${data.baslik ?? ''}`,
        'ok',
      );
      selectedId = data.id;
      await loadGuides();
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'Uretim basarisiz';
      setStatus(msg, msg.includes('429') || msg.includes('limit') ? 'warn' : 'busy');
      if (!msg.includes('429')) alert(msg);
    } finally {
      setBusy(false);
    }
  }

  async function manualGuideDraft() {
    if (busy) return;
    const anahtar = prompt(
      'Rehber konusu / anahtar kelime (bos = sadece sablon):\n\nOrnek: istanbul voleybol kursu rehberi',
    );
    if (anahtar === null) return;

    setBusy(true);
    setStatus('Manuel rehber sablonu…', 'busy');
    try {
      const body = anahtar.trim() ? { anahtar: anahtar.trim() } : { anahtar: 'spor kursu rehberi' };
      const data = (await deps.apiPost('/api/admin/content-engine/manual-draft', body)) as {
        id?: string;
        baslik?: string;
      };
      if (!data?.id) throw new Error('Sablon olusturulamadi');
      setStatus(`Manuel taslak: ${data.baslik ?? anahtar}`, 'ok');
      selectedId = data.id;
      await loadGuides();
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'Hata';
      setStatus(msg, 'warn');
      alert(msg);
    } finally {
      setBusy(false);
    }
  }

  generateLlmBtn?.addEventListener('click', () => generateGuideLlm());
  manualBtn?.addEventListener('click', () => manualGuideDraft());

  return { loadGuides };
}
