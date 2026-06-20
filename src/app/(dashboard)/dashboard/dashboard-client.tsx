"use client";
import { useEffect } from "react";
import { useIncome }     from "@/hooks/use-income";
import { useExpenses }   from "@/hooks/use-expenses";
import { useSpentBy }    from "@/hooks/use-spent-by";
import { useTags }       from "@/hooks/use-tags";
import { useTransfers }  from "@/hooks/use-transfers";
import { useExpenseTypes } from "@/hooks/use-expense-types";
import { useCurrencies } from "@/hooks/use-currencies";
import { useBankAccounts } from "@/hooks/use-bank-accounts";
import { useUIStore }    from "@/stores/ui.store";
import { useSettingsStore } from "@/stores/settings.store";
import { StatsCards }    from "@/components/dashboard/stats-cards";
import { IncomeOverview } from "@/components/dashboard/income-overview";
import { RecentTransactions } from "@/components/dashboard/recent-transactions";
import { ExpensePieChart, MonthlyTrendChart, SpendingByPersonChart } from "@/components/dashboard/expense-chart";
import { GlobalCurrencyFilter } from "@/components/shared/global-currency-filter";
import { MigrationBanner } from "@/components/shared/migration-banner";

export function DashboardClient() {
  useIncome();
  useExpenses();
  useSpentBy();
  useTags();
  useTransfers();
  useExpenseTypes();
  useCurrencies();
  const { accounts } = useBankAccounts();

  const { settings }   = useSettingsStore();
  const { globalCurrency, setGlobalCurrency, setDashboardCurrencyFilter } = useUIStore();
  const defaultCode    = settings?.currencyCode ?? "KWD";

  // On first load: default to base currency (not "All")
  useEffect(() => {
    if (!globalCurrency) {
      setGlobalCurrency(defaultCode);
    }
  }, [defaultCode]); // eslint-disable-line react-hooks/exhaustive-deps

  // Keep dashboardCurrencyFilter in sync for single-currency mode.
  // "all" mode: UIStore.setGlobalCurrency already resets dashboardCurrencyFilter
  // to "" on switch, so useAnalytics cleanly defaults to base currency with no
  // stale values causing cross-currency amounts to be added together.
  useEffect(() => {
    if (globalCurrency && globalCurrency !== "all") {
      setDashboardCurrencyFilter(globalCurrency);
    }
    // "all" → UIStore handled the reset; ChartCurrencySelector drives per-chart selection
  }, [globalCurrency, defaultCode]); // eslint-disable-line react-hooks/exhaustive-deps

  const displayLabel = globalCurrency === "all"
    ? "All currencies"
    : (globalCurrency || defaultCode);

  return (
    <div className="space-y-6 animate-fade-in">

      {/* ── Page header ──────────────────────────────────────── */}
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-bold text-foreground tracking-tight">Overview</h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            Viewing <span className="font-semibold text-foreground">{displayLabel}</span>
          </p>
        </div>
        <GlobalCurrencyFilter />
      </div>

      {/* Migration banner — shows once for users with incomes but no accounts yet */}
      <MigrationBanner show={accounts.length === 0} />

      <StatsCards />

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-5">
        <IncomeOverview />
        <RecentTransactions />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        <MonthlyTrendChart />
        <ExpensePieChart />
        <SpendingByPersonChart />
      </div>
    </div>
  );
}
