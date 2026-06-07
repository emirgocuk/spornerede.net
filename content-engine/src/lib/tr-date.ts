const TZ = 'Europe/Istanbul';

/** Bugünün tarihi YYYY-MM-DD (Türkiye). */
export function todayTrIso(): string {
  return new Intl.DateTimeFormat('en-CA', { timeZone: TZ }).format(new Date());
}

/** Tarihe n gün ekle (YYYY-MM-DD). */
export function addDaysIso(iso: string, days: number): string {
  const [y, m, d] = iso.split('-').map(Number);
  const dt = new Date(Date.UTC(y!, m! - 1, d! + days));
  return dt.toISOString().slice(0, 10);
}

/** TR ay numarası 1–12 (Türkiye). */
export function currentMonthTr(): number {
  const parts = new Intl.DateTimeFormat('en-US', { timeZone: TZ, month: 'numeric' }).formatToParts(
    new Date(),
  );
  return Number(parts.find((p) => p.type === 'month')?.value ?? 1);
}
