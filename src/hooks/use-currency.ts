"use client";
import { useSettingsStore } from "@/stores/settings.store";
import { formatCurrency, formatCompact } from "@/lib/utils/currency";

export function useCurrency() {
  const { settings } = useSettingsStore();
  const symbol = settings?.currencySymbol ?? "KD";
  const code = settings?.currencyCode ?? "KWD";
  const name = settings?.currencyName ?? "Kuwaiti Dinar";

  return {
    symbol, code, name,
    format: (amount: number) => formatCurrency(amount, symbol, code),
    compact: (amount: number) => formatCompact(amount, symbol),
  };
}
