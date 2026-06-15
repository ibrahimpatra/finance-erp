"use client";
import { useMemo } from "react";
import { useIncomeStore } from "@/stores/income.store";
import { useExpenseStore } from "@/stores/expense.store";
import { useCurrencyStore } from "@/stores/currency.store";
import { useSettingsStore } from "@/stores/settings.store";
import { useUIStore } from "@/stores/ui.store";

export interface CurrencyTotals {
  code: string;
  totalIncome: number;
  totalExpenses: number;
  totalBalance: number;
  incomeCount: number;
  expenseCount: number;
  spendRate: number;
  hasData: boolean;
}

/**
 * Returns per-currency financial totals.
 * When globalCurrencies is empty ("All"), returns ALL configured currencies.
 * When globalCurrencies has entries, returns only those currencies.
 * When exactly one currency is selected, returns a single-element array (same single-currency path).
 */
export function usePerCurrencyData(): {
  rows: CurrencyTotals[];
  isMulti: boolean;        // true when showing >1 currency
  activeSingle: string;    // set when exactly 1 currency selected
} {
  const { incomes }      = useIncomeStore();
  const { expenses }     = useExpenseStore();
  const { currencies }   = useCurrencyStore();
  const { settings }     = useSettingsStore();
  const { globalCurrencies } = useUIStore();

  const defaultCode = settings?.currencyCode ?? "KWD";

  // All user-configured codes (default first)
  const configuredCodes = useMemo(() => {
    return Array.from(new Set([defaultCode, ...currencies.map((c) => c.code)]));
  }, [defaultCode, currencies]);

  // Which codes to display
  const targetCodes = useMemo(() => {
    if (globalCurrencies.length === 0) return configuredCodes;   // All
    return globalCurrencies;
  }, [globalCurrencies, configuredCodes]);

  const rows = useMemo((): CurrencyTotals[] => {
    return targetCodes.map((code) => {
      const fi = incomes.filter((i) => (i.currencyCode || defaultCode) === code);
      const fe = expenses.filter((e) => (e.currencyCode || defaultCode) === code);
      const totalIncome   = fi.reduce((a, i) => a + i.amount, 0);
      const totalExpenses = fe.reduce((a, e) => a + e.amount, 0);
      const totalBalance  = fi.reduce((a, i) => a + i.balance, 0);
      const spendRate = totalIncome > 0 ? Math.min(100, Math.round((totalExpenses / totalIncome) * 100)) : 0;
      return {
        code,
        totalIncome,
        totalExpenses,
        totalBalance,
        incomeCount:  fi.length,
        expenseCount: fe.length,
        spendRate,
        hasData: totalIncome > 0 || totalExpenses > 0,
      };
    }).filter((r) => r.hasData || targetCodes.length === 1);
  }, [targetCodes, incomes, expenses, defaultCode]);

  const isMulti      = rows.length > 1;
  const activeSingle = !isMulti && rows.length === 1 ? rows[0].code : (targetCodes[0] ?? defaultCode);

  return { rows, isMulti, activeSingle };
}
