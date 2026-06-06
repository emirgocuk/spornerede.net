const DATE_ONLY = /^\d{4}-\d{2}-\d{2}$/;

export function isDateOnlyTarih(value: string | undefined | null): boolean {
  return DATE_ONLY.test(String(value ?? '').trim());
}

/** Admin listesi / siralama icin anlik deger */
export function parseNewsTarihMs(
  tarih: string | undefined | null,
  created?: string | undefined | null,
): number {
  const t = String(tarih ?? '').trim();
  if (!t) {
    const c = created ? new Date(created).getTime() : NaN;
    return Number.isNaN(c) ? 0 : c;
  }
  if (isDateOnlyTarih(t) && created) {
    const c = new Date(created).getTime();
    if (!Number.isNaN(c)) return c;
  }
  if (isDateOnlyTarih(t)) {
    const [y, m, d] = t.split('-').map(Number);
    return new Date(y, m - 1, d, 12, 0, 0).getTime();
  }
  const ms = new Date(t).getTime();
  return Number.isNaN(ms) ? 0 : ms;
}

/** Admin haber listesinde gosterim (Europe/Istanbul) */
export function formatNewsTarihAdmin(
  tarih: string | undefined | null,
  created?: string | undefined | null,
): string {
  const t = String(tarih ?? '').trim();
  const source = isDateOnlyTarih(t) && created ? created : t || created;
  if (!source) return '-';
  const d = new Date(source);
  if (Number.isNaN(d.getTime())) return '-';
  return new Intl.DateTimeFormat('tr-TR', {
    timeZone: 'Europe/Istanbul',
    dateStyle: 'short',
    timeStyle: 'short',
  }).format(d);
}

/** date input + mevcut kayit → ISO (tarayici yerel saati, TR admin) */
export function dateInputToNewsTarihIso(dateInput: string, existingTarih?: string): string {
  if (!dateInput) return new Date().toISOString();
  const [y, m, d] = dateInput.split('-').map(Number);
  if (!y || !m || !d) return new Date().toISOString();

  let h = new Date().getHours();
  let mi = new Date().getMinutes();
  let s = new Date().getSeconds();
  if (existingTarih?.includes('T')) {
    const ex = new Date(existingTarih);
    if (!Number.isNaN(ex.getTime())) {
      h = ex.getHours();
      mi = ex.getMinutes();
      s = ex.getSeconds();
    }
  }
  return new Date(y, m - 1, d, h, mi, s).toISOString();
}

/** date input → form alani (YYYY-MM-DD) */
export function newsTarihToDateInput(value: string | undefined | null): string {
  const t = String(value ?? '').trim();
  if (!t) return '';
  if (isDateOnlyTarih(t)) return t;
  const d = new Date(t);
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
