const DATE_ONLY = /^\d{4}-\d{2}-\d{2}$/;
const MIDNIGHT_UTC =
  /^(\d{4}-\d{2}-\d{2})(?:[ T]00:00:00(?:\.000)?Z?)?$/i;

export function isDateOnlyTarih(value: string | undefined | null): boolean {
  return DATE_ONLY.test(String(value ?? '').trim());
}

/** PB date alani veya YYYY-MM-DD — saat bilgisi yok */
export function isPlaceholderTarih(value: string | undefined | null): boolean {
  const t = String(value ?? '').trim();
  if (!t) return true;
  if (isDateOnlyTarih(t)) return true;
  if (MIDNIGHT_UTC.test(t)) return true;
  const d = new Date(t.replace(' ', 'T'));
  if (Number.isNaN(d.getTime())) return true;
  return (
    d.getUTCHours() === 0 &&
    d.getUTCMinutes() === 0 &&
    d.getUTCSeconds() === 0 &&
    d.getUTCMilliseconds() === 0
  );
}

function legacyIdToDate(legacyId: number | string | undefined | null): Date | null {
  const ms = Number(legacyId);
  if (!Number.isFinite(ms) || ms < 1_000_000_000_000) return null;
  const d = new Date(ms);
  return Number.isNaN(d.getTime()) ? null : d;
}

/** Gosterim / siralama icin gercek an */
export function resolveNewsInstant(
  tarih: string | undefined | null,
  created?: string | undefined | null,
  legacyId?: number | string | null,
): Date | null {
  if (legacyId) {
    const fromLegacy = legacyIdToDate(legacyId);
    if (fromLegacy) return fromLegacy;
  }
  if (created) {
    const d = new Date(created);
    if (!Number.isNaN(d.getTime())) return d;
  }
  const t = String(tarih ?? '').trim();
  if (!t) return null;
  const d = new Date(t.replace(' ', 'T'));
  return Number.isNaN(d.getTime()) ? null : d;
}

export function parseNewsTarihMs(
  tarih: string | undefined | null,
  created?: string | undefined | null,
  legacyId?: number | string | null,
): number {
  return resolveNewsInstant(tarih, created, legacyId)?.getTime() ?? 0;
}

export function formatNewsTarihAdmin(
  tarih: string | undefined | null,
  created?: string | undefined | null,
  legacyId?: number | string | null,
): string {
  const d = resolveNewsInstant(
    isPlaceholderTarih(tarih) ? '' : tarih,
    created,
    legacyId,
  );
  if (!d) return '-';
  return new Intl.DateTimeFormat('tr-TR', {
    timeZone: 'Europe/Istanbul',
    dateStyle: 'short',
    timeStyle: 'short',
  }).format(d);
}

export function dateInputToNewsTarihIso(
  dateInput: string,
  existingTarih?: string,
  legacyId?: number | string | null,
): string {
  if (!dateInput) return new Date().toISOString();
  const [y, m, d] = dateInput.split('-').map(Number);
  if (!y || !m || !d) return new Date().toISOString();

  const fromLegacy = legacyIdToDate(legacyId);
  if (fromLegacy) {
    return new Date(
      y,
      m - 1,
      d,
      fromLegacy.getHours(),
      fromLegacy.getMinutes(),
      fromLegacy.getSeconds(),
    ).toISOString();
  }

  let h = new Date().getHours();
  let mi = new Date().getMinutes();
  let s = new Date().getSeconds();
  if (existingTarih && !isPlaceholderTarih(existingTarih)) {
    const ex = new Date(existingTarih.replace(' ', 'T'));
    if (!Number.isNaN(ex.getTime())) {
      h = ex.getHours();
      mi = ex.getMinutes();
      s = ex.getSeconds();
    }
  }
  return new Date(y, m - 1, d, h, mi, s).toISOString();
}

export function newsTarihToDateInput(value: string | undefined | null): string {
  const t = String(value ?? '').trim();
  if (!t) return '';
  const m = t.match(/^(\d{4}-\d{2}-\d{2})/);
  if (m) return m[1];
  const d = new Date(t.replace(' ', 'T'));
  if (Number.isNaN(d.getTime())) return '';
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Europe/Istanbul',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).formatToParts(d);
  const pick = (type: string) => parts.find((p) => p.type === type)?.value ?? '';
  return `${pick('year')}-${pick('month')}-${pick('day')}`;
}
