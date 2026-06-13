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
import { useIncomeStore } from "@/stores/income.store";
import { useExpenseStore } from "@/stores/expense.store";
import { useCurrencyStore } from "@/stores/currency.store";
import { StatsCards } from "@/components/dashboard/stats-cards";
import { IncomeOverview } from "@/components/dashboard/income-overview";
import { RecentTransactions } from "@/components/dashboard/recent-transactions";
import { ExpensePieChart, MonthlyTrendChart, SpendingByPersonChart } from "@/components/dashboard/expense-chart";

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
  const { dashboardCurrencyFilter, setDashboardCurrencyFilter } = useUIStore();

  const defaultCode = settings?.currencyCode ?? "KWD";

  useEffect(() => {
    if (!dashboardCurrencyFilter) setDashboardCurrencyFilter(defaultCode);
  }, [defaultCode]); // eslint-disable-line react-hooks/exhaustive-deps

  const usedCodes = Array.from(new Set([
    defaultCode,
    ...incomes.map((i) => i.currencyCode || defaultCode),
    ...expenses.map((e) => e.currencyCode || defaultCode),
  ])).filter(Boolean);

  const filterCodes = Array.from(new Set([
    defaultCode,
    ...currencies.map((c) => c.code),
    ...usedCodes,
  ]));

  const activeCurrency = dashboardCurrencyFilter || defaultCode;

  return (
    <div className="space-y-6 animate-fade-in">

      {/* ── Page header ──────────────────────────────────────── */}
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-bold text-foreground tracking-tight">Overview</h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            Viewing <span className="font-semibold text-foreground">{activeCurrency}</span> · select a currency to switch view
          </p>
        </div>

        {/* Currency pills */}
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-xs text-muted-foreground">Currency:</span>
          {filterCodes.map((code) => (
            <button
              key={code}
              onClick={() => setDashboardCurrencyFilter(code)}
              className={`px-3 py-1.5 rounded-full text-xs font-semibold border transition-all ${
                activeCurrency === code
                  ? "bg-primary text-white border-primary shadow-sm shadow-primary/20"
                  : "border-border text-muted-foreground hover:bg-muted hover:text-foreground"
              }`}
            >
              {code}
            </button>
          ))}
        </div>
      </div>

      {/* ── Stats ────────────────────────────────────────────── */}
      <StatsCards />

      {/* ── Income + Recent side by side ─────────────────────── */}
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
