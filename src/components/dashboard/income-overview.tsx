"use client";
import { useIncome } from "@/hooks/use-income";
import { useCurrency } from "@/hooks/use-currency";
import { useUIStore } from "@/stores/ui.store";
import { useSettingsStore } from "@/stores/settings.store";
import { TableSkeleton } from "@/components/shared/loading-skeleton";
import Link from "next/link";
import { TrendingUp, ExternalLink, ArrowUpRight } from "lucide-react";

export function IncomeOverview() {
  const { incomes, loading }  = useIncome();
  const { formatFor }         = useCurrency();
  const { dashboardCurrencyFilter } = useUIStore();
  const { settings }          = useSettingsStore();
  const defaultCurrency       = settings?.currencyCode ?? "KWD";

  if (loading) return <TableSkeleton rows={4} />;

  const filtered = dashboardCurrencyFilter
    ? incomes.filter((i) => (i.currencyCode || defaultCurrency) === dashboardCurrencyFilter)
    : incomes;

  return (
    <div className="bg-white rounded-xl border border-border shadow-card overflow-hidden">
      <div className="flex items-center justify-between px-5 py-3.5 border-b border-border">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-blue-50 flex items-center justify-center">
            <TrendingUp className="w-3.5 h-3.5 text-blue-500" />
          </div>
          <span className="text-sm font-semibold text-foreground">Income Sources</span>
          <span className="text-xs text-muted-foreground ml-1">({filtered.length})</span>
        </div>
        <Link href="/income"
          className="flex items-center gap-1 text-xs text-primary hover:text-primary/80 font-medium transition-colors">
          View all <ExternalLink className="w-3 h-3" />
        </Link>
      </div>

      {filtered.length === 0 ? (
        <div className="px-5 py-8 text-center">
          <p className="text-sm text-muted-foreground">
            {dashboardCurrencyFilter ? `No income sources in ${dashboardCurrencyFilter}` : "No income sources yet"}
          </p>
          <Link href="/income" className="mt-2 inline-flex items-center gap-1 text-xs text-primary hover:underline font-medium">
            Add income source <ArrowUpRight className="w-3 h-3" />
          </Link>
        </div>
      ) : (
        <div className="divide-y divide-border">
          {filtered.slice(0, 6).map((income) => {
            const cur = income.currencyCode || defaultCurrency;
            const pct = Math.min(100, income.percentageUsed || 0);
            const isOverBudget = pct >= 100;
            return (
              <Link key={income.id} href={`/income/${income.id}`}
                className="flex items-center gap-3 px-5 py-3.5 hover:bg-muted/30 transition-colors group">
                {/* Icon */}
                <div className="w-8 h-8 rounded-lg bg-blue-50 flex items-center justify-center shrink-0">
                  <TrendingUp className="w-4 h-4 text-blue-500" />
                </div>
                {/* Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium text-foreground truncate">{income.name}</span>
                    <span className="text-[11px] text-muted-foreground shrink-0">{income.source}</span>
                    {cur !== defaultCurrency && (
                      <span className="text-[11px] px-1.5 py-0.5 rounded-full bg-blue-50 text-blue-600 font-semibold shrink-0">{cur}</span>
                    )}
                  </div>
                  {/* Progress bar */}
                  <div className="flex items-center gap-2 mt-1.5">
                    <div className="flex-1 h-1.5 bg-muted rounded-full overflow-hidden max-w-[100px]">
                      <div className="h-full rounded-full transition-all duration-500"
                        style={{
                          width: `${pct}%`,
                          background: isOverBudget ? "#ef4444" : pct > 80 ? "#f59e0b" : "#3b82f6",
                        }} />
                    </div>
                    <span className="text-[11px] text-muted-foreground shrink-0 tabular-nums">{pct.toFixed(0)}%</span>
                  </div>
                </div>
                {/* Balance — uses ledger-computed balance (accounts for transfers) */}
                <div className="text-right shrink-0">
                  <div className="amount-display text-sm font-bold text-foreground">
                    {formatFor(income.balance, cur)}
                  </div>
                  <div className="text-[11px] text-muted-foreground">remaining</div>
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
