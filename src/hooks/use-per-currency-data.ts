"use client";
import { useMemo }           from "react";
import { useIncomeStore }    from "@/stores/income.store";
import { useExpenseStore }   from "@/stores/expense.store";
import { useCurrencyStore }  from "@/stores/currency.store";
import { useSettingsStore }  from "@/stores/settings.store";
import { useUIStore }        from "@/stores/ui.store";

export interface CurrencyTotals {
  code:          string;
  totalIncome:   number;
  totalExpenses: number;
  totalBalance:  number;
  incomeCount:   number;
  expenseCount:  number;
  spendRate:     number;
  hasData:       boolean;
}

/**
 * Returns per-currency totals driven by globalCurrency.
 * "all"  → returns one row per currency (configured OR present in data).
 * ""     → single row for base currency.
 * "CODE" → single row for that currency.
 *
 * FIX (point 13): Previously used only configuredCodes (settings + currencies store)
 * while useAnalytics.availableChartCurrencies used actual expense data.
 * This caused the "all" mode stats cards and chart selector to show different
 * currency sets — e.g. a currency appearing in charts but missing from stats.
 *
 * Now both use the same merged set: configured codes UNION actual data codes.
 */
export function usePerCurrencyData(): {
  rows:        CurrencyTotals[];
  isMulti:     boolean;
  activeSingle: string;
} {
  const { incomes }    = useIncomeStore();
  const { expenses }   = useExpenseStore();
  const { currencies } = useCurrencyStore();
  const { settings }   = useSettingsStore();
  const { globalCurrency } = useUIStore();

  const defaultCode = settings?.currencyCode ?? "KWD";

  /**
   * allCodes = union of:
   * 1. Base currency from settings
   * 2. Explicitly configured extra currencies
   * 3. Currencies actually present in income data
   * 4. Currencies actually present in expense data
   *
   * This is the SAME set that GlobalCurrencyFilter now uses, ensuring
   * the stats cards and the filter chips always show identical currency lists.
   */
  const allCodes = useMemo(() => {
    const set = new Set<string>();
    set.add(defaultCode);
    currencies.forEach((c) => set.add(c.code));
    incomes.forEach((i)  => { if (i.currencyCode) set.add(i.currencyCode); });
    expenses.forEach((e) => { if (e.currencyCode) set.add(e.currencyCode); });
    return Array.from(set).sort();
  }, [defaultCode, currencies, incomes, expenses]);

  // Which codes to compute rows for
  const targetCodes = useMemo(() => {
    if (globalCurrency === "all") return allCodes; // FIX: was configuredCodes
    const single = (globalCurrency && globalCurrency !== "all") ? globalCurrency : defaultCode;
    return [single];
  }, [globalCurrency, allCodes, defaultCode]);

  const rows = useMemo((): CurrencyTotals[] => {
    return targetCodes
      .map((code) => {
        const fi = incomes.filter((i)  => (i.currencyCode  || defaultCode) === code);
        const fe = expenses.filter((e) => (e.currencyCode  || defaultCode) === code);

        const totalIncome   = fi.reduce((a, i) => a + i.amount,  0);
        const totalExpenses = fe.reduce((a, e) => a + e.amount,  0);
        // Use ledger-derived balance from IncomeWithBalance (totalCredits - totalDebits)
        const totalBalance  = fi.reduce((a, i) => a + i.balance, 0);

        const spendRate = totalIncome > 0
          ? Math.min(100, Math.round((totalExpenses / totalIncome) * 100))
          : 0;

        return {
          code, totalIncome, totalExpenses, totalBalance,
          incomeCount:  fi.length,
          expenseCount: fe.length,
          spendRate,
          hasData: totalIncome > 0 || totalExpenses > 0,
        };
      })
      // In "all" mode, only show currencies that have actual data
      .filter((r) => globalCurrency === "all" ? r.hasData : true);
  }, [targetCodes, incomes, expenses, defaultCode, globalCurrency]);

  const isMulti       = globalCurrency === "all" && rows.length > 1;
  const activeSingle  = !isMulti && rows.length > 0 ? rows[0].code : defaultCode;

  return { rows, isMulti, activeSingle };
}
