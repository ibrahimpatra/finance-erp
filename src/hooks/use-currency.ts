"use client";
import { useSettingsStore } from "@/stores/settings.store";
import { useCurrencyStore } from "@/stores/currency.store";
import { formatCurrency, formatCompact } from "@/lib/utils/currency";
import { PRESET_CURRENCIES } from "@/types";

export function useCurrency() {
  const { settings } = useSettingsStore();
  const { currencies } = useCurrencyStore();

  // FIX: removed ?? "KWD" / ?? "KD" / ?? "Kuwaiti Dinar" hardcoded fallbacks.
  // These fired while settings was null (loading) and caused every format()
  // call to display KWD amounts until settings arrived. Now we use empty
  // strings — callers using formatFor() with an explicit code are unaffected.
  // The format() (base currency) function returns a neutral placeholder ("…")
  // during the brief loading window rather than showing the wrong currency.
  const symbol = settings?.currencySymbol ?? "";
  const code   = settings?.currencyCode   ?? "";
  const name   = settings?.currencyName   ?? "";

  const format = (amount: number) =>
    code ? formatCurrency(amount, symbol, code) : `… ${amount}`;

  const formatFor = (amount: number, currencyCode?: string) => {
    if (!currencyCode || currencyCode === code) {
      return code ? formatCurrency(amount, symbol, code) : `… ${amount}`;
    }
    const userCur = currencies.find((c) => c.code === currencyCode);
    if (userCur) return formatCurrency(amount, userCur.symbol, userCur.code);
    const preset = PRESET_CURRENCIES.find((c) => c.code === currencyCode);
    if (preset) return formatCurrency(amount, preset.symbol, preset.code);
    const is3Decimal = ["KWD", "BHD", "OMR"].includes(currencyCode);
    return `${currencyCode} ${amount.toFixed(is3Decimal ? 3 : 2)}`;
  };

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
