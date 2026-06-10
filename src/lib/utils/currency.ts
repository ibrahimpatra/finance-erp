export function formatCurrency(amount: number, symbol: string, code: string): string {
  const isKWD = code === "KWD" || code === "BHD" || code === "OMR";
  const decimals = isKWD ? 3 : 2;
  const formatted = amount.toFixed(decimals).replace(/\B(?=(\d{3})+(?!\d))/g, ",");
  return `${symbol} ${formatted}`;
}

export function parseCurrency(value: string): number {
  const cleaned = value.replace(/[^0-9.]/g, "");
  return parseFloat(cleaned) || 0;
}

export function formatCompact(amount: number, symbol: string): string {
  if (amount >= 1_000_000) return `${symbol} ${(amount / 1_000_000).toFixed(1)}M`;
  if (amount >= 1_000) return `${symbol} ${(amount / 1_000).toFixed(1)}K`;
  return `${symbol} ${amount.toFixed(2)}`;
}

export function calculateBalance(credits: number, debits: number): number {
  return credits - debits;
}

export function calculatePercentage(used: number, total: number): number {
  if (total === 0) return 0;
  return Math.min(100, Math.round((used / total) * 100));
}
