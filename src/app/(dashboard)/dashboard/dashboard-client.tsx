"use client";
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
import { StatsCards } from "@/components/dashboard/stats-cards";
import { IncomeOverview } from "@/components/dashboard/income-overview";
import { RecentTransactions } from "@/components/dashboard/recent-transactions";
import {
  ExpensePieChart,
  MonthlyTrendChart,
  SpendingByPersonChart,
} from "@/components/dashboard/expense-chart";

export function DashboardClient() {
  useIncome();
  useExpenses();
  useSpentBy();
  useTags();
  useTransfers();
  useExpenseTypes();
  useCurrencies();

  const { incomes } = useIncomeStore();
  const { expenses } = useExpenseStore();
  const { currencies } = useCurrencies();
  const { settings } = useSettingsStore();
  const { dashboardCurrencyFilter, setDashboardCurrencyFilter } = useUIStore();

  const defaultCode = settings?.currencyCode ?? "KWD";

  // Build the list of currencies that actually have data, so the filter is useful
  const usedCodes = Array.from(new Set([
    defaultCode,
    ...incomes.map((i) => i.currencyCode || defaultCode),
    ...expenses.map((e) => e.currencyCode || defaultCode),
  ])).filter(Boolean);

  // Merge with user-defined currencies so they show even before data exists
  const definedCodes = [defaultCode, ...currencies.map((c) => c.code)];
  const filterCodes  = Array.from(new Set([...definedCodes, ...usedCodes]));

  return (
    <div className="space-y-3 animate-fade-in">

      {/* ── Header + Currency Filter ─────────────────────────────────── */}
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h2 className="text-lg font-bold text-foreground tracking-tight leading-none">Overview</h2>
          <p className="text-muted-foreground text-[11px] mt-0.5">Your complete financial picture</p>
        </div>

        {/* Currency filter pills */}
        {filterCodes.length > 1 && (
          <div className="flex items-center gap-1.5 flex-wrap">
            <span className="text-[10px] text-muted-foreground mr-0.5">Filter:</span>
            <button
              onClick={() => setDashboardCurrencyFilter("")}
              className={`px-2.5 py-1 rounded-full text-[11px] font-medium border transition-all ${
                !dashboardCurrencyFilter
                  ? "bg-primary text-white border-primary shadow-sm"
                  : "border-border text-muted-foreground hover:bg-muted"
              }`}>
              All
            </button>
            {filterCodes.map((code) => (
              <button key={code}
                onClick={() => setDashboardCurrencyFilter(dashboardCurrencyFilter === code ? "" : code)}
                className={`px-2.5 py-1 rounded-full text-[11px] font-medium border transition-all ${
                  dashboardCurrencyFilter === code
                    ? "bg-primary text-white border-primary shadow-sm"
                    : "border-border text-muted-foreground hover:bg-muted"
                }`}>
                {code}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* ── Stats Cards (compact 4×2 grid) ──────────────────────────── */}
      <StatsCards />

      {/* ── Income + Transactions (side by side) ────────────────────── */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-3">
        <IncomeOverview />
        <RecentTransactions />
      </div>

      {/* ── Charts (3 in a row) ──────────────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-3">
        <MonthlyTrendChart />
        <ExpensePieChart />
        <SpendingByPersonChart />
      </div>
    </div>
  );
}
