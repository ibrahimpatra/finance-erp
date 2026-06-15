"use client";
import { useEffect } from "react";
import { useIncome } from "@/hooks/use-income";
import { useExpenses } from "@/hooks/use-expenses";
import { useSpentBy } from "@/hooks/use-spent-by";
import { useTags } from "@/hooks/use-tags";
import { useTransfers } from "@/hooks/use-transfers";
import { useExpenseTypes } from "@/hooks/use-expense-types";
import { useCurrencies } from "@/hooks/use-currencies";
import { useUIStore } from "@/stores/ui.store";
import { useSettingsStore } from "@/stores/settings.store";
import { useCurrencyStore } from "@/stores/currency.store";
import { useIncomeStore } from "@/stores/income.store";
import { useExpenseStore } from "@/stores/expense.store";
import { StatsCards } from "@/components/dashboard/stats-cards";
import { IncomeOverview } from "@/components/dashboard/income-overview";
import { RecentTransactions } from "@/components/dashboard/recent-transactions";
import { ExpensePieChart, MonthlyTrendChart, SpendingByPersonChart } from "@/components/dashboard/expense-chart";
import { GlobalCurrencyFilter } from "@/components/shared/global-currency-filter";

export function DashboardClient() {
  useIncome();
  useExpenses();
  useSpentBy();
  useTags();
  useTransfers();
  useExpenseTypes();
  useCurrencies();

  const { incomes }    = useIncomeStore();
  const { expenses }   = useExpenseStore();
  const { currencies } = useCurrencyStore();
  const { settings }   = useSettingsStore();
  const {
    globalCurrencies, setGlobalCurrencies,
    dashboardCurrencyFilter, setDashboardCurrencyFilter,
  } = useUIStore();

  const defaultCode = settings?.currencyCode ?? "KWD";

  // On first load, default to the settings currency if nothing selected
  useEffect(() => {
    if (!dashboardCurrencyFilter) {
      setDashboardCurrencyFilter(defaultCode);
    }
  }, [defaultCode]); // eslint-disable-line react-hooks/exhaustive-deps

  // When global filter is "All" or has multiple selections, keep dashboardCurrencyFilter
  // pointing to the first selection (or default) for useAnalytics compat
  useEffect(() => {
    if (globalCurrencies.length === 0) {
      // "All" selected — keep dashboardCurrencyFilter at default
      setDashboardCurrencyFilter(defaultCode);
    } else {
      setDashboardCurrencyFilter(globalCurrencies[0]);
    }
  }, [globalCurrencies, defaultCode]); // eslint-disable-line react-hooks/exhaustive-deps

  const activeCurrency = dashboardCurrencyFilter || defaultCode;

  return (
    <div className="space-y-6 animate-fade-in">

      {/* ── Page header ──────────────────────────────────────── */}
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-bold text-foreground tracking-tight">Overview</h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            {globalCurrencies.length === 1
              ? `Viewing ${activeCurrency}`
              : globalCurrencies.length > 1
              ? `Viewing ${globalCurrencies.join(", ")}`
              : "Viewing all currencies"}
          </p>
        </div>
        {/* Global currency filter chips */}
        <GlobalCurrencyFilter />
      </div>

      {/* ── Stats ────────────────────────────────────────────── */}
      <StatsCards />

      {/* ── Income + Recent ──────────────────────────────────── */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-5">
        <IncomeOverview />
        <RecentTransactions />
      </div>

      {/* ── Charts ───────────────────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        <MonthlyTrendChart />
        <ExpensePieChart />
        <SpendingByPersonChart />
      </div>
    </div>
  );
}
