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
};

type ApiDeps = {
  apiGet: (path: string) => Promise<unknown>;
  apiPut: (path: string, body: Record<string, unknown>) => Promise<unknown>;
  apiDelete: (path: string, body: Record<string, unknown>) => Promise<unknown>;
  escapeHtml: (value: string) => string;
};

const STATUS_LABEL: Record<string, string> = {
  incelemede: 'İncelemede',
  taslak: 'Taslak',
  yayinda: 'Yayında',
  arsiv: 'Arşiv',
  dusuk_performans: 'Düşük performans',
  yazildi: 'Yazıldı',
  yaziliyor: 'Yazılıyor',
};

const STATUS_CLASS: Record<string, string> = {
  yayinda: 'status-approved',
  incelemede: 'status-pending',
  taslak: 'status-pending',
  arsiv: 'status-rejected',
  dusuk_performans: 'status-rejected',
};

export function mountGuidesAdminTab(deps: ApiDeps) {
  const listEl = document.getElementById('guides-list');
  const detailEl = document.getElementById('guides-detail');
  const loadBtn = document.getElementById('load-guides');
  const badgeEl = document.getElementById('guides-tab-badge');
  if (!listEl || !detailEl) return;

  let cached: GuideRow[] = [];
  let selectedId = '';

  function statusBadge(durum: string) {
    const label = STATUS_LABEL[durum] ?? durum;
    const cls = STATUS_CLASS[durum] ?? 'status-pending';
    return `<span class="status-badge ${cls}">${deps.escapeHtml(label)}</span>`;
  }

  function updateBadge() {
    if (!badgeEl) return;
    const pending = cached.filter((g) => g.durum === 'incelemede' || g.durum === 'taslak').length;
    badgeEl.textContent = String(pending);
    badgeEl.classList.toggle('is-hidden', pending === 0);
  }

  function renderList() {
    if (!cached.length) {
      listEl.innerHTML = '<li class="empty-list">Rehber kaydı yok.</li>';
      return;
    }
    listEl.innerHTML = cached
      .map((g) => {
        const active = g.id === selectedId ? 'is-active' : '';
        return `<li>
          <button type="button" class="list-item ${active}" data-guide-id="${deps.escapeHtml(g.id)}">
            <div class="item-main">
              <span class="item-title">${deps.escapeHtml(g.baslik)}</span>
              <span class="item-meta">${deps.escapeHtml(g.slug)} • ${deps.escapeHtml(g.durum)}</span>
            </div>
            <div class="item-side">${statusBadge(g.durum)}</div>
          </button>
        </li>`;
      })
      .join('');
    updateBadge();
  }

  function renderDetail(guide: GuideRow) {
    const publicUrl = guide.durum === 'yayinda' ? `/rehber/${guide.slug}` : '';
    detailEl.innerHTML = `
      <div class="detail-header">
        <div class="detail-title-area">
          <span class="kicker">SEO REHBER</span>
          <h2>${deps.escapeHtml(guide.baslik)}</h2>
          <p class="text-sm text-muted">${deps.escapeHtml(guide.kaynak || 'manuel')}</p>
        </div>
        <div class="detail-status">${statusBadge(guide.durum)}</div>
      </div>
      <div class="detail-grid detail-grid--single">
        <section class="card-section">
          <div class="form-layout">
            <div class="form-row-2">
              <div class="form-group">
                <label>Başlık</label>
                <input id="guide-baslik" class="modern-input" type="text" value="${deps.escapeHtml(guide.baslik)}" />
              </div>
              <div class="form-group">
                <label>Slug</label>
                <input id="guide-slug" class="modern-input" type="text" value="${deps.escapeHtml(guide.slug)}" />
              </div>
            </div>
            <div class="form-group">
              <label>Meta başlık (≤60)</label>
              <input id="guide-meta-title" class="modern-input" type="text" value="${deps.escapeHtml(guide.metaTitle)}" />
            </div>
            <div class="form-group">
              <label>Meta açıklama (≤155)</label>
              <textarea id="guide-meta-description" class="modern-textarea" rows="2">${deps.escapeHtml(guide.metaDescription)}</textarea>
            </div>
            <div class="form-group">
              <label>İçerik (HTML)</label>
              <textarea id="guide-icerik" class="modern-textarea guide-html-editor" rows="14">${deps.escapeHtml(guide.icerikHtml)}</textarea>
            </div>
            ${
              guide.gscGosterim > 0
                ? `<p class="section-help">GSC: ${guide.gscTiklama} tıklama, ${guide.gscGosterim} gösterim, ort. konum ${guide.gscKonum.toFixed(1)}</p>`
                : ''
            }
            <div class="form-actions-row">
              <button type="button" id="guide-save-btn" class="btn btn-primary">Kaydet</button>
              <button type="button" id="guide-publish-btn" class="btn btn-success">Yayınla</button>
              <button type="button" id="guide-archive-btn" class="btn btn-outline">Arşivle</button>
              ${
                publicUrl
                  ? `<a class="btn btn-outline" href="${publicUrl}" target="_blank" rel="noopener">Sitede gör ↗</a>`
                  : ''
              }
            </div>
            <div class="admin-danger-zone">
              <p class="section-help">Kalıcı silme geri alınamaz.</p>
              <button type="button" id="guide-delete-btn" class="btn btn-danger w-full">🗑️ Rehberi Sil</button>
            </div>
          </div>
        </section>
      </div>
    `;

    const read = (id: string) => document.getElementById(id);

    document.getElementById('guide-save-btn')?.addEventListener('click', () => saveGuide(guide.id, guide.durum));
    document.getElementById('guide-publish-btn')?.addEventListener('click', () => saveGuide(guide.id, 'yayinda'));
    document.getElementById('guide-archive-btn')?.addEventListener('click', () => saveGuide(guide.id, 'arsiv'));
    document.getElementById('guide-delete-btn')?.addEventListener('click', async () => {
      if (!confirm(`"${guide.baslik}" kalıcı olarak silinsin mi?`)) return;
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
    const icerik_html = (document.getElementById('guide-icerik') as HTMLTextAreaElement | null)?.value ?? '';

    if (!baslik || !slug) {
      alert('Başlık ve slug zorunlu.');
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
      alert(e instanceof Error ? e.message : 'Kayıt başarısız');
    }
  }

  function renderEmptyDetail() {
    detailEl.innerHTML = `
      <div class="empty-state">
        <div class="empty-icon">📚</div>
        <h3>Rehber seçin</h3>
        <p>Content Engine taslaklarını inceleyip yayınlayın. Lokal önizleme: /rehber/[slug]</p>
      </div>
    `;
  }

  async function loadGuides() {
    listEl.innerHTML = '<li class="loading-state"><div class="spinner-small"></div> Yükleniyor...</li>';
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
      detailEl.innerHTML = '<div class="error-state">Rehberler yüklenemedi.</div>';
    }
  }

  listEl.addEventListener('click', (event) => {
    const target = event.target;
    if (!(target instanceof HTMLElement)) return;
    const button = target.closest('button[data-guide-id]');
    if (!button) return;
    const id = button.getAttribute('data-guide-id') || '';
    selectedId = id;
    renderList();
    const guide = cached.find((g) => g.id === id);
    if (guide) renderDetail(guide);
  });

  loadBtn?.addEventListener('click', () => loadGuides());

  return { loadGuides };
}
