type ApiDeps = {
  apiGet: (path: string) => Promise<unknown>;
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

type ScheduleData = {
  enabled: boolean;
  runHour: number;
  runMinute: number;
  autoPublish: boolean;
  lastRunAt: string | null;
  lastRunStatus: string | null;
  lastRunMessage: string | null;
  lastKeywordSyncAt: string | null;
  lastKeywordSyncMessage: string | null;
  lastNewsRewriteAt: string | null;
  lastNewsRewriteMessage: string | null;
  nextRunLabel: string;
  nextKeywordSyncLabel?: string;
  nextNewsRewriteLabel?: string;
  schedulerDisabled?: boolean;
};

function pad2(n: number) {
  return String(n).padStart(2, '0');
}

export function mountContentEngineNews(deps: ApiDeps) {
  const generateBtn = document.getElementById('ce-generate-news');
  const manualBtn = document.getElementById('ce-manual-news');
  const statusEl = document.getElementById('ce-news-status');
  const loadNewsBtn = document.getElementById('load-news');

  const schedEnabled = document.getElementById('ce-sched-enabled') as HTMLInputElement | null;
  const schedTime = document.getElementById('ce-sched-time') as HTMLInputElement | null;
  const schedAutoPub = document.getElementById('ce-sched-autopub') as HTMLInputElement | null;
  const schedSave = document.getElementById('ce-sched-save');
  const schedNext = document.getElementById('ce-scheduler-next');
  const schedLast = document.getElementById('ce-sched-last');

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
    schedSave?.toggleAttribute('disabled', on);
  }

  function renderSchedule(data: ScheduleData) {
    if (schedEnabled) schedEnabled.checked = Boolean(data.enabled);
    if (schedTime) schedTime.value = `${pad2(data.runHour)}:${pad2(data.runMinute)}`;
    if (schedAutoPub) schedAutoPub.checked = data.autoPublish !== false;
    if (schedNext) {
      schedNext.textContent = data.enabled ? data.nextRunLabel : 'Kapalı';
      schedNext.classList.toggle('is-on', Boolean(data.enabled));
    }
    if (schedLast) {
      const lines: string[] = [];
      if (data.lastRunAt) {
        const when = new Date(data.lastRunAt).toLocaleString('tr-TR', {
          timeZone: 'Europe/Istanbul',
        });
        const status = data.lastRunStatus ?? '?';
        const msg = data.lastRunMessage ? ` — ${data.lastRunMessage}` : '';
        lines.push(`Son haber: ${when} (${status})${msg}`);
      } else {
        lines.push('Henüz otomatik haber üretimi yok.');
      }
      if (data.lastKeywordSyncAt) {
        const when = new Date(data.lastKeywordSyncAt).toLocaleString('tr-TR', {
          timeZone: 'Europe/Istanbul',
        });
        const msg = data.lastKeywordSyncMessage ? ` — ${data.lastKeywordSyncMessage}` : '';
        lines.push(`Son GSC sync: ${when}${msg}`);
      } else if (data.nextKeywordSyncLabel) {
        lines.push(`GSC sync: ${data.nextKeywordSyncLabel}`);
      }
      if (data.lastNewsRewriteAt) {
        const when = new Date(data.lastNewsRewriteAt).toLocaleString('tr-TR', {
          timeZone: 'Europe/Istanbul',
        });
        const msg = data.lastNewsRewriteMessage ? ` — ${data.lastNewsRewriteMessage}` : '';
        lines.push(`Son CTR rewrite: ${when}${msg}`);
      } else if (data.nextNewsRewriteLabel) {
        lines.push(`CTR rewrite: ${data.nextNewsRewriteLabel}`);
      }
      schedLast.textContent = lines.join(' · ');
      if (data.schedulerDisabled) {
        schedLast.textContent += ' · Sunucuda SEO_NEWS_SCHEDULER_DISABLED=true';
      }
    }
  }

  async function loadSchedule() {
    try {
      const payload = (await deps.apiGet('/api/admin/content-engine/schedule')) as {
        data?: ScheduleData;
      };
      if (payload?.data) renderSchedule(payload.data);
    } catch {
      if (schedLast) schedLast.textContent = 'Zamanlayıcı ayarları yüklenemedi.';
    }
  }

  async function saveSchedule() {
    if (busy || !schedTime) return;
    setBusy(true);
    setStatus('Zamanlayıcı kaydediliyor…', 'busy');
    try {
      const payload = (await fetch('/api/admin/content-engine/schedule', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          enabled: schedEnabled?.checked ?? false,
          runTime: schedTime.value || '07:00',
          autoPublish: schedAutoPub?.checked ?? true,
        }),
      }).then(async (res) => {
        if (!res.ok) {
          const err = await res.json().catch(() => ({}));
          throw new Error((err as { error?: string }).error || 'Kayıt başarısız');
        }
        return res.json();
      })) as { data?: ScheduleData };
      if (payload?.data) renderSchedule(payload.data);
      setStatus(
        payload.data?.enabled
          ? `Zamanlayıcı aktif — ${payload.data.nextRunLabel}`
          : 'Zamanlayıcı kaydedildi (kapalı)',
        'ok',
      );
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'Kayıt hatası';
      setStatus(msg, 'warn');
      alert(msg);
    } finally {
      setBusy(false);
    }
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
      const msg = e instanceof Error ? e.message : 'Üretim başarısız';
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
  schedSave?.addEventListener('click', () => saveSchedule());
  schedEnabled?.addEventListener('change', () => {
    if (schedNext) {
      schedNext.textContent = schedEnabled.checked ? 'Kaydedilmedi' : 'Kapalı';
      schedNext.classList.toggle('is-on', schedEnabled.checked);
    }
  });
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'visible') void loadSchedule();
  });
  void loadSchedule();
}
