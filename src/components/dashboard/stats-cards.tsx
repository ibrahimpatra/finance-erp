"use client";
import { usePerCurrencyData } from "@/hooks/use-per-currency-data";
import { useCurrency }        from "@/hooks/use-currency";
import { useIncomeStore }     from "@/stores/income.store";
import { useBankAccounts }    from "@/hooks/use-bank-accounts";
import { StatsGridSkeleton }  from "@/components/shared/loading-skeleton";
import { TrendingUp, Receipt, Wallet, BarChart2, Trophy, Users, Landmark } from "lucide-react";
import { useAnalytics }       from "@/hooks/use-analytics";
import Link from "next/link";
import { cn } from "@/lib/utils/helpers";

export function StatsCards() {
  const { loading }        = useIncomeStore();
  const { rows, isMulti }  = usePerCurrencyData();
  const { formatFor }      = useCurrency();
  const { accountsWithBalance } = useBankAccounts();
  // Still use useAnalytics for topSpender/topCategory (single-currency derived)
  const { topSpender, topCategory, activeCurrency } = useAnalytics();

  if (loading) return <StatsGridSkeleton />;

  // ── Single currency: original compact card layout ─────────────
  if (!isMulti && rows.length <= 1) {
    const r = rows[0];
    if (!r) return <StatsGridSkeleton />;
    const fmt = (n: number) => formatFor(n, r.code);
    const isPositive = r.totalBalance >= 0;

    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Net Balance hero */}
        <div className="sm:col-span-2 bg-white rounded-xl border border-border p-5 shadow-card hover:shadow-card-hover transition-all duration-200">
          <div className="flex items-start justify-between mb-3">
            <div>
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Net Balance</p>
              <p className="text-[11px] text-muted-foreground/70 mt-0.5">{r.code}</p>
            </div>
            <div className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 ${isPositive ? "bg-emerald-50" : "bg-red-50"}`}>
              <Wallet className={`w-4 h-4 ${isPositive ? "text-emerald-500" : "text-red-500"}`} />
            </div>
          </div>
          <p className={`amount-display text-3xl font-bold leading-none mb-3 ${isPositive ? "text-emerald-600" : "text-red-600"}`}>
            {fmt(r.totalBalance)}
          </p>
          <div className="space-y-1.5">
            <div className="flex justify-between text-[11px] text-muted-foreground">
              <span>Income: <span className="font-semibold text-foreground">{fmt(r.totalIncome)}</span></span>
              <span>Spent: <span className="font-semibold text-foreground">{fmt(r.totalExpenses)}</span></span>
            </div>
            <div className="h-1.5 bg-muted rounded-full overflow-hidden">
              <div className="h-full rounded-full transition-all duration-500"
                style={{ width: `${r.spendRate}%`, background: r.spendRate > 80 ? "#ef4444" : r.spendRate > 60 ? "#f59e0b" : "#10b981" }} />
            </div>
            <p className="text-[11px] text-muted-foreground">{r.spendRate}% of income used</p>
          </div>
        </div>

        <div className="bg-white rounded-xl border border-border p-5 shadow-card hover:shadow-card-hover transition-all duration-200">
          <div className="flex items-start justify-between mb-2">
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Total Income</p>
            <div className="w-8 h-8 rounded-lg bg-blue-50 flex items-center justify-center"><TrendingUp className="w-4 h-4 text-blue-500" /></div>
          </div>
          <p className="amount-display text-2xl font-bold text-foreground leading-tight mt-3">{fmt(r.totalIncome)}</p>
          <p className="text-[11px] text-muted-foreground mt-2">{r.incomeCount} source{r.incomeCount !== 1 ? "s" : ""}</p>
        </div>

        <div className="bg-white rounded-xl border border-border p-5 shadow-card hover:shadow-card-hover transition-all duration-200">
          <div className="flex items-start justify-between mb-2">
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Total Expenses</p>
            <div className="w-8 h-8 rounded-lg bg-red-50 flex items-center justify-center"><Receipt className="w-4 h-4 text-red-500" /></div>
          </div>
          <p className="amount-display text-2xl font-bold text-foreground leading-tight mt-3">{fmt(r.totalExpenses)}</p>
          <p className="text-[11px] text-muted-foreground mt-2">{r.expenseCount} transaction{r.expenseCount !== 1 ? "s" : ""}</p>
        </div>

        <div className="bg-white rounded-xl border border-border p-5 shadow-card hover:shadow-card-hover transition-all duration-200">
          <div className="flex items-start justify-between mb-2">
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Spend Rate</p>
            <div className="w-8 h-8 rounded-lg bg-indigo-50 flex items-center justify-center"><BarChart2 className="w-4 h-4 text-indigo-500" /></div>
          </div>
          <p className="amount-display text-2xl font-bold text-foreground leading-tight mt-3">
            {r.totalIncome > 0 ? `${r.spendRate}%` : "—"}
          </p>
          <p className="text-[11px] text-muted-foreground mt-2">of income used</p>
        </div>

        <div className="bg-white rounded-xl border border-border p-5 shadow-card hover:shadow-card-hover transition-all duration-200">
          <div className="flex items-start justify-between mb-2">
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Top Spender</p>
            <div className="w-8 h-8 rounded-lg bg-amber-50 flex items-center justify-center"><Trophy className="w-4 h-4 text-amber-500" /></div>
          </div>
          <p className="text-lg font-bold text-foreground leading-tight mt-3 truncate">{topSpender?.name ?? "—"}</p>
          <p className="text-[11px] text-muted-foreground mt-2 amount-display">
            {topSpender ? formatFor(topSpender.amount, activeCurrency) : "No data"}
          </p>
        </div>

        <div className="bg-white rounded-xl border border-border p-5 shadow-card hover:shadow-card-hover transition-all duration-200">
          <div className="flex items-start justify-between mb-2">
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Top Category</p>
            <div className="w-8 h-8 rounded-lg bg-rose-50 flex items-center justify-center"><Users className="w-4 h-4 text-rose-500" /></div>
          </div>
          <p className="text-lg font-bold text-foreground leading-tight mt-3 truncate">{topCategory?.categoryName ?? "—"}</p>
          <p className="text-[11px] text-muted-foreground mt-2 amount-display">
            {topCategory ? formatFor(topCategory.amount, activeCurrency) : "No data"}
          </p>
        </div>
      </div>
    );
  }

  // ── Multi-currency: per-currency stacked rows inside cards ─────
  return (
    <>
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">

      {/* Balance card — stacked rows */}
      <div className="sm:col-span-2 bg-white rounded-xl border border-border p-5 shadow-card">
        <div className="flex items-center gap-2 mb-4">
          <div className="w-8 h-8 rounded-lg bg-emerald-50 flex items-center justify-center">
            <Wallet className="w-4 h-4 text-emerald-500" />
          </div>
          <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Net Balance</p>
        </div>
        <div className="space-y-2.5 max-h-48 overflow-y-auto scrollbar-thin pr-1">
          {rows.map((r) => {
            const isPos = r.totalBalance >= 0;
            return (
              <div key={r.code} className="flex items-center justify-between py-1.5 border-b border-border/50 last:border-0">
                <div className="flex items-center gap-2">
                  <span className="text-[11px] font-bold px-1.5 py-0.5 rounded bg-muted text-muted-foreground">{r.code}</span>
                  <div className="w-20 h-1 bg-muted rounded-full overflow-hidden">
                    <div className="h-full rounded-full" style={{ width: `${r.spendRate}%`, background: r.spendRate > 80 ? "#ef4444" : "#10b981" }} />
                  </div>
                  <span className="text-[11px] text-muted-foreground">{r.spendRate}%</span>
                </div>
                <span className={`amount-display text-sm font-bold ${isPos ? "text-emerald-600" : "text-red-600"}`}>
                  {formatFor(r.totalBalance, r.code)}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Income card */}
      <div className="bg-white rounded-xl border border-border p-5 shadow-card">
        <div className="flex items-center gap-2 mb-4">
          <div className="w-8 h-8 rounded-lg bg-blue-50 flex items-center justify-center"><TrendingUp className="w-4 h-4 text-blue-500" /></div>
          <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Income</p>
        </div>
        <div className="space-y-2 max-h-48 overflow-y-auto scrollbar-thin pr-1">
          {rows.map((r) => (
            <div key={r.code} className="flex items-center justify-between py-1 border-b border-border/50 last:border-0">
              <span className="text-[11px] font-bold text-muted-foreground">{r.code}</span>
              <span className="amount-display text-sm font-bold text-foreground">{formatFor(r.totalIncome, r.code)}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Expenses card */}
      <div className="bg-white rounded-xl border border-border p-5 shadow-card">
        <div className="flex items-center gap-2 mb-4">
          <div className="w-8 h-8 rounded-lg bg-red-50 flex items-center justify-center"><Receipt className="w-4 h-4 text-red-500" /></div>
          <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Expenses</p>
        </div>
        <div className="space-y-2 max-h-48 overflow-y-auto scrollbar-thin pr-1">
          {rows.map((r) => (
            <div key={r.code} className="flex items-center justify-between py-1 border-b border-border/50 last:border-0">
              <span className="text-[11px] font-bold text-muted-foreground">{r.code}</span>
              <span className="amount-display text-sm font-bold text-red-600">-{formatFor(r.totalExpenses, r.code)}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Spend rate card */}
      <div className="bg-white rounded-xl border border-border p-5 shadow-card">
        <div className="flex items-center gap-2 mb-4">
          <div className="w-8 h-8 rounded-lg bg-indigo-50 flex items-center justify-center"><BarChart2 className="w-4 h-4 text-indigo-500" /></div>
          <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Spend Rate</p>
        </div>
        <div className="space-y-2.5 max-h-48 overflow-y-auto scrollbar-thin pr-1">
          {rows.map((r) => (
            <div key={r.code} className="space-y-1 py-1 border-b border-border/50 last:border-0">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold text-muted-foreground">{r.code}</span>
                <span className="text-sm font-bold text-foreground">{r.totalIncome > 0 ? `${r.spendRate}%` : "—"}</span>
              </div>
              {r.totalIncome > 0 && (
                <div className="h-1 bg-muted rounded-full overflow-hidden">
                  <div className="h-full rounded-full transition-all" style={{ width: `${r.spendRate}%`, background: r.spendRate > 80 ? "#ef4444" : r.spendRate > 60 ? "#f59e0b" : "#10b981" }} />
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      <div className="bg-white rounded-xl border border-border p-5 shadow-card">
        <div className="flex items-start justify-between mb-2">
          <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Top Spender</p>
          <div className="w-8 h-8 rounded-lg bg-amber-50 flex items-center justify-center"><Trophy className="w-4 h-4 text-amber-500" /></div>
        </div>
        <p className="text-lg font-bold text-foreground leading-tight mt-3 truncate">{topSpender?.name ?? "—"}</p>
        <p className="text-[11px] text-muted-foreground mt-2 amount-display">
          {topSpender ? formatFor(topSpender.amount, activeCurrency) : "No data"}
        </p>
      </div>

      <div className="bg-white rounded-xl border border-border p-5 shadow-card">
        <div className="flex items-start justify-between mb-2">
          <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Top Category</p>
          <div className="w-8 h-8 rounded-lg bg-rose-50 flex items-center justify-center"><Users className="w-4 h-4 text-rose-500" /></div>
        </div>
        <p className="text-lg font-bold text-foreground leading-tight mt-3 truncate">{topCategory?.categoryName ?? "—"}</p>
        <p className="text-[11px] text-muted-foreground mt-2 amount-display">
          {topCategory ? formatFor(topCategory.amount, activeCurrency) : "No data"}
        </p>
      </div>
    </div>

    {/* ── Accounts at a glance strip ─────────────────────────── */}
    {accountsWithBalance.length > 0 && (
      <AccountsStrip accounts={accountsWithBalance} formatFor={formatFor} />
    )}
    </>
  );
}

// ── Accounts strip sub-component ─────────────────────────────────
interface AccountsStripProps {
  accounts: import("@/types").BankAccountWithBalance[];
  formatFor: (amount: number, code?: string) => string;
}

function AccountsStrip({ accounts, formatFor }: AccountsStripProps) {
  return (
    <div className="mt-4">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <Landmark className="w-4 h-4 text-muted-foreground" />
          <p className="text-sm font-semibold text-foreground">Accounts</p>
        </div>
        <Link href="/accounts" className="text-xs text-primary hover:underline">
          View all
        </Link>
      </div>
      <div className="flex gap-3 overflow-x-auto pb-1 scrollbar-thin">
        {accounts.map((account) => (
          <Link
            key={account.id}
            href={`/accounts/${account.id}`}
            className="flex-shrink-0 bg-white rounded-xl border border-border p-4 w-44 hover:shadow-card transition-all group"
          >
            <div className="flex items-center gap-2 mb-2.5">
              <span className="text-lg">{account.icon ?? "🏦"}</span>
              <div className="min-w-0">
                <p className="text-xs font-semibold truncate group-hover:text-primary transition-colors">
                  {account.name}
                </p>
                <p className="text-[10px] text-muted-foreground">{account.currencyCode}</p>
              </div>
            </div>
            <p className={cn(
              "amount-display text-base font-bold leading-tight",
              account.balance < 0 ? "text-red-600" : "text-foreground"
            )}>
              {formatFor(account.balance, account.currencyCode)}
            </p>
            <div className="h-1 bg-muted rounded-full mt-2 overflow-hidden">
              <div
                className="h-full rounded-full transition-all"
                style={{ width: `${account.attributionRate}%`, backgroundColor: account.color }}
              />
            </div>
            <p className="text-[10px] text-muted-foreground mt-1">
              {Math.round(account.attributionRate)}% attributed
            </p>
          </Link>
        ))}
      </div>
    </div>
  );
}
