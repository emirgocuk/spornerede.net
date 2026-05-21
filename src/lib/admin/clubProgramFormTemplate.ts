function escapeHtml(value: string) {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function renderBransSelectOptions(bransList: string[]) {
  const options = ['<option value="">Branş seçin...</option>'];
  for (const name of bransList) {
    options.push(`<option value="${escapeHtml(name)}">${escapeHtml(name)}</option>`);
  }
  return options.join('');
}

export function clubProgramEditorHtml(bransList: string[] = []) {
  return `<div id="club-program-editor-panel" class="club-program-editor-panel is-hidden">
    <button id="club-program-back-btn" class="back-link editor-back" type="button">← İlan listesine dön</button>
    <form id="club-program-form" class="program-form admin-program-full-form">
      <input id="club-program-id" type="hidden" />
      <div class="form-header">
        <h4 class="form-title">Branş İlanı</h4>
        <span id="club-program-form-badge" class="badge-modern">Yeni Kayıt</span>
      </div>
      <section class="form-section">
        <div class="form-group">
          <label for="club-program-brans">Branş</label>
          <select id="club-program-brans" class="modern-select" required>
            ${renderBransSelectOptions(bransList)}
          </select>
          <p class="section-help text-sm">İlan, seçtiğiniz branş adıyla yayınlanır.</p>
        </div>
        <div class="form-row-2">
          <div class="form-group">
            <label for="club-program-yas-araligi">Yaş Aralığı</label>
            <input id="club-program-yas-araligi" class="modern-input" placeholder="Örn: 6-14 yaş" />
          </div>
          <div class="form-group">
            <label for="club-program-aidat">Aidat Bilgisi</label>
            <input id="club-program-aidat" class="modern-input" placeholder="Örn: Aylık 1500 TL" />
          </div>
        </div>
      </section>
      <label class="toggle-label program-active-toggle">
        <input id="club-program-aktif" type="checkbox" checked class="toggle-input" />
        <span class="toggle-text">İlanı Yayına Al (Aktif)</span>
      </label>
      <div class="form-actions mt-4">
        <button type="submit" class="btn btn-primary w-full">İlanı Kaydet</button>
      </div>
    </form>
  </div>`;
}
