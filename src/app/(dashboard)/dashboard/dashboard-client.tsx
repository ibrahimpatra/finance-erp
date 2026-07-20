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
import { CurrencySetupBanner } from "@/components/shared/currency-setup-banner";

export function DashboardClient() {
  useIncome();
  useExpenses();
  useSpentBy();
  useTags();
  useTransfers();
  useExpenseTypes();
  useCurrencies();
  const { accounts } = useBankAccounts();

  const { settings, fetched }   = useSettingsStore();
  const { globalCurrency, setGlobalCurrency, setDashboardCurrencyFilter } = useUIStore();
  const defaultCode    = settings?.currencyCode ?? "";

  // FIX: wait until settings are actually fetched before touching globalCurrency.
  // Previously: defaultCode = settings?.currencyCode ?? "KWD" fired during loading
  // (settings = null) → wrote "KWD" into globalCurrency → when real currency
  // arrived, !globalCurrency was false so it never updated. Now we wait.
  // Also corrects the case where "KWD" was written stale and the real currency
  // is something else — we reset it once fetched.
  useEffect(() => {
    // FIX: wait for BOTH fetched=true AND a real defaultCode.
    // Previously used `defaultCode || "all"` — for new users with no settings
    // yet, defaultCode="" so globalCurrency was set to "all". Then when they
    // picked INR via the banner, the condition `globalCurrency !== "all"`
    // prevented the update. Now we simply wait until we have a real currency.
    if (!fetched || !defaultCode) return;
    if (globalCurrency !== "all") {
      setGlobalCurrency(defaultCode);
    }
  }, [fetched, defaultCode]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (globalCurrency && globalCurrency !== "all") {
      setDashboardCurrencyFilter(globalCurrency);
    }
  }, [globalCurrency, defaultCode]); // eslint-disable-line react-hooks/exhaustive-deps

  const displayLabel = globalCurrency === "all"
    ? "All currencies"
    : (globalCurrency || defaultCode || "…");

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

      {/* New-user currency setup — only ever shown when no settings doc exists yet */}
      <CurrencySetupBanner />

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
