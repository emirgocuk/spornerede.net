import { clubProgramEditorHtml } from './clubProgramFormTemplate';

export type ClubProgram = {
  id: number;
  ad: string;
  yasAraligi?: string;
  ucretBilgisi?: string;
  aidatBilgisi?: string;
  aktif?: boolean;
};

export function buildClubProgramsSectionHtml(programs: ClubProgram[], bransList: string[] = []) {
  const listItems = !programs.length
    ? '<div class="empty-hint">Henüz yayınlanan ilan yok.</div>'
    : programs
        .map((p) => {
          const meta = [p.yasAraligi, p.aidatBilgisi || p.ucretBilgisi].filter(Boolean).join(' · ');
          return `<li class="club-program-list-item">
            <div>
              <strong>${escapeHtml(p.ad || '—')}</strong>
              <span class="text-muted text-sm">${p.aktif ? 'Yayında' : 'Pasif'}${meta ? ` · ${escapeHtml(meta)}` : ''}</span>
            </div>
            <button type="button" class="btn btn-outline-sm" data-club-program-edit="${p.id}">Düzenle</button>
          </li>`;
        })
        .join('');

  const editorHtml = clubProgramEditorHtml(bransList);
  return `<div id="club-program-workspace" class="club-program-workspace">
    <div id="club-program-list-view">
      <div class="club-program-list-head">
        <button id="club-new-program-btn" type="button" class="btn btn-primary">+ Yeni İlan</button>
      </div>
      <ul class="club-program-list">${listItems}</ul>
    </div>
    ${editorHtml}
  </div>`;
}

function escapeHtml(value: unknown) {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

export type ClubProgramEditorApi = {
  post: (url: string, body: Record<string, unknown>) => Promise<unknown>;
  put: (url: string, body: Record<string, unknown>) => Promise<unknown>;
};

export function bindClubProgramEditor(
  root: HTMLElement,
  clubId: number,
  programs: ClubProgram[],
  api: ClubProgramEditorApi,
  onRefresh: () => Promise<void>,
) {
  const listView = root.querySelector('#club-program-list-view');
  const editorPanel = root.querySelector('#club-program-editor-panel');
  const form = root.querySelector('#club-program-form');
  const idEl = root.querySelector('#club-program-id') as HTMLInputElement | null;
  const bransEl = root.querySelector('#club-program-brans') as HTMLSelectElement | null;

  function setBransValue(value: string) {
    if (!bransEl) return;
    if (value) {
      const exists = Array.from(bransEl.options).some((opt) => opt.value === value);
      if (!exists) {
        const extra = document.createElement('option');
        extra.value = value;
        extra.textContent = value;
        bransEl.appendChild(extra);
      }
    }
    bransEl.value = value;
  }
  const yasEl = root.querySelector('#club-program-yas-araligi') as HTMLInputElement | null;
  const aidatEl = root.querySelector('#club-program-aidat') as HTMLInputElement | null;
  const aktifEl = root.querySelector('#club-program-aktif') as HTMLInputElement | null;
  const badgeEl = root.querySelector('#club-program-form-badge');
  const backBtn = root.querySelector('#club-program-back-btn');
  const newBtn = root.querySelector('#club-new-program-btn');

  function showList() {
    listView?.classList.remove('is-hidden');
    editorPanel?.classList.add('is-hidden');
  }

  function showEditor() {
    listView?.classList.add('is-hidden');
    editorPanel?.classList.remove('is-hidden');
  }

  function clearForm() {
    if (idEl) idEl.value = '';
    setBransValue('');
    if (yasEl) yasEl.value = '';
    if (aidatEl) aidatEl.value = '';
    if (aktifEl) aktifEl.checked = true;
    if (badgeEl) badgeEl.textContent = 'Yeni Kayıt';
  }

  function fillForm(program: ClubProgram) {
    if (idEl) idEl.value = String(program.id);
    setBransValue(program.ad || '');
    if (yasEl) yasEl.value = program.yasAraligi || '';
    if (aidatEl) aidatEl.value = program.aidatBilgisi || program.ucretBilgisi || '';
    if (aktifEl) aktifEl.checked = Boolean(program.aktif);
    if (badgeEl) badgeEl.textContent = 'Düzenleniyor';
    showEditor();
  }

  function buildPayload() {
    return {
      ad: bransEl?.value.trim() || '',
      yasAraligi: yasEl?.value.trim() || '',
      ucretBilgisi: aidatEl?.value.trim() || '',
      aciklama: '',
      gunSaat: '',
      seviye: '',
      eventDate: '',
      endDate: '',
      isOngoing: false,
      days: [],
      startTime: '',
      endTime: '',
      locationText: '',
      mapsUrl: '',
      gallery: [],
      bodyJson: null,
      aktif: aktifEl?.checked ?? true,
    };
  }

  newBtn?.addEventListener('click', () => {
    clearForm();
    showEditor();
  });

  backBtn?.addEventListener('click', () => showList());

  root.querySelectorAll('[data-club-program-edit]').forEach((button) => {
    button.addEventListener('click', () => {
      const programId = Number(button.getAttribute('data-club-program-edit'));
      const program = programs.find((item) => item.id === programId);
      if (program) fillForm(program);
    });
  });

  form?.addEventListener('submit', async (event) => {
    event.preventDefault();
    const payload = buildPayload();
    const programId = Number(idEl?.value || '0');
    const submitBtn = form.querySelector('button[type="submit"]');
    if (submitBtn instanceof HTMLButtonElement) {
      submitBtn.disabled = true;
      submitBtn.textContent = 'Kaydediliyor...';
    }
    try {
      if (programId > 0) {
        await api.put('/api/admin/clubs', { clubId, programId, ...payload });
      } else {
        await api.post('/api/admin/clubs', { id: clubId, createProgram: true, ...payload });
      }
      await onRefresh();
      showList();
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Kayıt başarısız.');
    } finally {
      if (submitBtn instanceof HTMLButtonElement) {
        submitBtn.disabled = false;
        submitBtn.textContent = 'İlanı Kaydet';
      }
    }
  });

  showList();
}
