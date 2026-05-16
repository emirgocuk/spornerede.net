/** Üyelik: 1. branş paket fiyatı, ek her branş %50 indirimli. */
export function calculateMembershipTotal(basePrice: number, branchCount: number) {
  const count = Number.isFinite(branchCount) ? Math.max(1, Math.floor(branchCount)) : 1;
  const base = Number.isFinite(basePrice) ? Math.max(0, basePrice) : 0;
  const extraCount = Math.max(0, count - 1);
  return base + extraCount * base * 0.5;
}

export function formatTryAmount(amount: number) {
  return `${new Intl.NumberFormat('tr-TR').format(amount)} TL`;
}
