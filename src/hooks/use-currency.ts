"use client";
import { useSettingsStore } from "@/stores/settings.store";
import { useCurrencyStore } from "@/stores/currency.store";
import { formatCurrency, formatCompact } from "@/lib/utils/currency";
import { PRESET_CURRENCIES } from "@/types";

export function useCurrency() {
  const { settings } = useSettingsStore();
  const { currencies } = useCurrencyStore();

  const symbol = settings?.currencySymbol ?? "KD";
  const code   = settings?.currencyCode   ?? "KWD";
  const name   = settings?.currencyName   ?? "Kuwaiti Dinar";

  /**
   * Format amount using the app's default currency.
   */
  const format = (amount: number) => formatCurrency(amount, symbol, code);

  /**
   * Format amount using an explicit currencyCode.
   * Falls back to default if currencyCode is undefined or matches default.
   * Looks up user-defined currencies first, then PRESET_CURRENCIES, then raw code.
   */
  const formatFor = (amount: number, currencyCode?: string) => {
    if (!currencyCode || currencyCode === code) return formatCurrency(amount, symbol, code);
    const userCur = currencies.find((c) => c.code === currencyCode);
    if (userCur) return formatCurrency(amount, userCur.symbol, userCur.code);
    const preset = PRESET_CURRENCIES.find((c) => c.code === currencyCode);
    if (preset) return formatCurrency(amount, preset.symbol, preset.code);
    const is3Decimal = ["KWD", "BHD", "OMR"].includes(currencyCode);
    return `${currencyCode} ${amount.toFixed(is3Decimal ? 3 : 2)}`;
  };

  /** Return just the symbol for a given currency code */
  const symbolFor = (currencyCode?: string) => {
    if (!currencyCode || currencyCode === code) return symbol;
    const userCur = currencies.find((c) => c.code === currencyCode);
    if (userCur) return userCur.symbol;
    const preset = PRESET_CURRENCIES.find((c) => c.code === currencyCode);
    return preset?.symbol ?? currencyCode;
  };

  const compact = (amount: number) => formatCompact(amount, symbol);

  return { symbol, code, name, format, formatFor, symbolFor, compact };
}
