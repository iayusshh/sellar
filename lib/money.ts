export function formatMoney(cents: number, currency: string) {
  const amount = cents / 100;
  return new Intl.NumberFormat(undefined, {
    style: "currency",
    currency,
    maximumFractionDigits: 2,
  }).format(amount);
}

export function clampCommissionRate(raw: string | undefined) {
  const num = Number(raw ?? "0.18");
  if (!Number.isFinite(num)) return 0.18;
  return Math.min(0.2, Math.max(0.15, num));
}
