"use client";
import { useCurrency } from "@/hooks/use-currency";
import { useSettingsStore } from "@/stores/settings.store";

export interface CurrencyGroup {
  code: string;
  amount: number;
}

interface MultiCurrencyAmountProps {
  groups: CurrencyGroup[];
  /** Optional className on each amount text */
  amountClassName?: string;
  /** Show negative sign before each amount (for expenses) */
  negative?: boolean;
  /** Layout: "stack" = one per line (default), "inline" = "KWD 10 · USD 5" */
  layout?: "stack" | "inline";
}

/**
 * Renders amounts grouped by currency.
 * - 1 group  → single line  e.g.  "KD 1,200.000"
 * - 2+ groups → stacked or inline  e.g.  "KD 10  /  USD 5  /  INR 500"
 */
export function MultiCurrencyAmount({
  groups,
  amountClassName = "",
  negative = false,
  layout = "stack",
}: MultiCurrencyAmountProps) {
  const { formatFor } = useCurrency();

  if (groups.length === 0) {
    return <span className="text-muted-foreground">—</span>;
  }

  if (groups.length === 1) {
    const { code, amount } = groups[0];
    return (
      <span className={amountClassName}>
        {negative ? "-" : ""}{formatFor(amount, code)}
      </span>
    );
  }

  if (layout === "inline") {
    return (
      <span className="flex flex-wrap gap-x-2 gap-y-0.5">
        {groups.map(({ code, amount }) => (
          <span key={code} className={`whitespace-nowrap ${amountClassName}`}>
            {negative ? "-" : ""}{formatFor(amount, code)}
          </span>
        ))}
      </span>
    );
  }

  // Stack layout
  return (
    <div className="space-y-0.5">
      {groups.map(({ code, amount }) => (
        <div key={code} className="flex items-center gap-1.5">
          <span className="text-[10px] font-bold bg-muted text-muted-foreground px-1.5 py-0.5 rounded shrink-0">
            {code}
          </span>
          <span className={`amount-display tabular-nums ${amountClassName}`}>
            {negative ? "-" : ""}{formatFor(amount, code)}
          </span>
        </div>
      ))}
    </div>
  );
}

/**
 * Groups an array of items by their currency and sums amounts.
 * Returns sorted by code alphabetically.
 */
export function groupByCurrency<T>(
  items: T[],
  getAmount: (item: T) => number,
  getCurrency: (item: T) => string | undefined | null,
  defaultCode: string,
  /** If provided, only include these currency codes */
  filterCodes?: string[]
): CurrencyGroup[] {
  const map = new Map<string, number>();
  for (const item of items) {
    const code = getCurrency(item) || defaultCode;
    if (filterCodes && !filterCodes.includes(code)) continue;
    map.set(code, (map.get(code) ?? 0) + getAmount(item));
  }
  return Array.from(map.entries())
    .map(([code, amount]) => ({ code, amount }))
    .sort((a, b) => a.code.localeCompare(b.code));
}
