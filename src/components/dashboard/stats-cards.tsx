"use client";
import { useAnalytics } from "@/hooks/use-analytics";
import { useCurrency } from "@/hooks/use-currency";
import { useIncomeStore } from "@/stores/income.store";
import { StatsGridSkeleton } from "@/components/shared/loading-skeleton";
import { TrendingUp, Receipt, Wallet, BarChart2, Trophy, Users } from "lucide-react";

export function StatsCards() {
  const { loading } = useIncomeStore();
  const {
    totalIncome, totalExpenses, totalBalance, activeCurrency,
    incomeCount, expenseCount, topSpender, topCategory,
  } = useAnalytics();

  const { formatFor } = useCurrency();
  const fmt = (n: number) => formatFor(n, activeCurrency);

  if (loading) return <StatsGridSkeleton />;

  const spendRate = totalIncome > 0 ? Math.min(100, Math.round((totalExpenses / totalIncome) * 100)) : 0;
  const isPositive = totalBalance >= 0;

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">

      {/* ── Net Balance — primary hero card ─────────────────── */}
      <div className="sm:col-span-2 bg-white rounded-xl border border-border p-5 shadow-card hover:shadow-card-hover transition-all duration-200">
        <div className="flex items-start justify-between mb-3">
          <div>
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Net Balance</p>
            <p className="text-[11px] text-muted-foreground/70 mt-0.5">{activeCurrency}</p>
          </div>
          <div className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 ${isPositive ? "bg-emerald-50" : "bg-red-50"}`}>
            <Wallet className={`w-4.5 h-4.5 ${isPositive ? "text-emerald-500" : "text-red-500"}`} />
          </div>
        </div>
        <p className={`amount-display text-3xl font-bold leading-none mb-3 ${isPositive ? "text-emerald-600" : "text-red-600"}`}>
          {fmt(totalBalance)}
        </p>
        {/* Progress bar */}
        <div className="space-y-1.5">
          <div className="flex justify-between text-[11px] text-muted-foreground">
            <span>Income: <span className="font-semibold text-foreground">{fmt(totalIncome)}</span></span>
            <span>Spent: <span className="font-semibold text-foreground">{fmt(totalExpenses)}</span></span>
          </div>
          <div className="h-1.5 bg-muted rounded-full overflow-hidden">
            <div
              className="h-full rounded-full transition-all duration-500"
              style={{
                width: `${spendRate}%`,
                background: spendRate > 80 ? "#ef4444" : spendRate > 60 ? "#f59e0b" : "#10b981",
              }}
            />
          </div>
          <p className="text-[11px] text-muted-foreground">
            {spendRate}% of income used
          </p>
        </div>
      </div>

      {/* ── Income ──────────────────────────────────────────── */}
      <div className="bg-white rounded-xl border border-border p-5 shadow-card hover:shadow-card-hover transition-all duration-200">
        <div className="flex items-start justify-between mb-2">
          <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Total Income</p>
          <div className="w-8 h-8 rounded-lg bg-blue-50 flex items-center justify-center">
            <TrendingUp className="w-4 h-4 text-blue-500" />
          </div>
        </div>
        <p className="amount-display text-2xl font-bold text-foreground leading-tight mt-3">{fmt(totalIncome)}</p>
        <p className="text-[11px] text-muted-foreground mt-2">
          {incomeCount} source{incomeCount !== 1 ? "s" : ""}
        </p>
      </div>

      {/* ── Expenses ─────────────────────────────────────────── */}
      <div className="bg-white rounded-xl border border-border p-5 shadow-card hover:shadow-card-hover transition-all duration-200">
        <div className="flex items-start justify-between mb-2">
          <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Total Expenses</p>
          <div className="w-8 h-8 rounded-lg bg-red-50 flex items-center justify-center">
            <Receipt className="w-4 h-4 text-red-500" />
          </div>
        </div>
        <p className="amount-display text-2xl font-bold text-foreground leading-tight mt-3">{fmt(totalExpenses)}</p>
        <p className="text-[11px] text-muted-foreground mt-2">
          {expenseCount} transaction{expenseCount !== 1 ? "s" : ""}
        </p>
      </div>

      {/* ── Spend Rate ───────────────────────────────────────── */}
      <div className="bg-white rounded-xl border border-border p-5 shadow-card hover:shadow-card-hover transition-all duration-200">
        <div className="flex items-start justify-between mb-2">
          <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Spend Rate</p>
          <div className="w-8 h-8 rounded-lg bg-indigo-50 flex items-center justify-center">
            <BarChart2 className="w-4 h-4 text-indigo-500" />
          </div>
        </div>
        <p className="amount-display text-2xl font-bold text-foreground leading-tight mt-3">
          {totalIncome > 0 ? `${spendRate}%` : "—"}
        </p>
        <p className="text-[11px] text-muted-foreground mt-2">of income used</p>
      </div>

      {/* ── Top Spender ──────────────────────────────────────── */}
      <div className="bg-white rounded-xl border border-border p-5 shadow-card hover:shadow-card-hover transition-all duration-200">
        <div className="flex items-start justify-between mb-2">
          <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Top Spender</p>
          <div className="w-8 h-8 rounded-lg bg-amber-50 flex items-center justify-center">
            <Trophy className="w-4 h-4 text-amber-500" />
          </div>
        </div>
        <p className="text-lg font-bold text-foreground leading-tight mt-3 truncate">
          {topSpender?.name ?? "—"}
        </p>
        <p className="text-[11px] text-muted-foreground mt-2 amount-display">
          {topSpender ? fmt(topSpender.amount) : "No data"}
        </p>
      </div>

      {/* ── Top Category ─────────────────────────────────────── */}
      <div className="bg-white rounded-xl border border-border p-5 shadow-card hover:shadow-card-hover transition-all duration-200">
        <div className="flex items-start justify-between mb-2">
          <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Top Category</p>
          <div className="w-8 h-8 rounded-lg bg-rose-50 flex items-center justify-center">
            <Users className="w-4 h-4 text-rose-500" />
          </div>
        </div>
        <p className="text-lg font-bold text-foreground leading-tight mt-3 truncate">
          {topCategory?.categoryName ?? "—"}
        </p>
        <p className="text-[11px] text-muted-foreground mt-2 amount-display">
          {topCategory ? fmt(topCategory.amount) : "No data"}
        </p>
      </div>

    </div>
  );
}
