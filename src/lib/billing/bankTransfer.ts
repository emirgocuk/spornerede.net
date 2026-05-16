/**
 * Kulüp başvurusu havale/EFT bilgileri (public — /basvuru sayfasında gösterilir).
 * Ortam değişkenleri ile override: PUBLIC_BANK_* (.env / sunucu .env, build öncesi).
 */

export const BANK_TRANSFER_DEFAULTS = {
  iban: 'TR970003200000000151985050',
  accountName: 'Murat Aktaş',
  bankName: 'Türk Ekonomi Bankası (TEB)',
  branch: 'Etimesgut şubesi',
} as const;

/** IBAN gösterimi: TR97 0003 2000 0000 0151 9850 50 */
export function formatIbanForDisplay(iban: string): string {
  const compact = iban.replace(/\s/g, '').toUpperCase();
  if (!/^TR\d{24}$/.test(compact)) return iban.trim();
  const rest = compact.slice(2);
  const groups = rest.match(/.{1,4}/g) ?? [];
  return `TR${groups.length ? ' ' + groups.join(' ') : ''}`.trim();
}

function envOr(key: string, fallback: string): string {
  const v = import.meta.env[key];
  if (typeof v === 'string' && v.trim()) return v.trim();
  return fallback;
}

export function getBankTransferDisplay() {
  return {
    iban: formatIbanForDisplay(envOr('PUBLIC_BANK_IBAN', BANK_TRANSFER_DEFAULTS.iban)),
    accountName: envOr('PUBLIC_BANK_ACCOUNT_NAME', BANK_TRANSFER_DEFAULTS.accountName),
    bankName: envOr('PUBLIC_BANK_NAME', BANK_TRANSFER_DEFAULTS.bankName),
    branch: envOr('PUBLIC_BANK_BRANCH', BANK_TRANSFER_DEFAULTS.branch),
  };
}
