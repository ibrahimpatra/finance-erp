"use client";
import { useIncome } from "@/hooks/use-income";
import { useCurrency } from "@/hooks/use-currency";
import { useUIStore } from "@/stores/ui.store";
import { useSettingsStore } from "@/stores/settings.store";
import { TableSkeleton } from "@/components/shared/loading-skeleton";
import Link from "next/link";
import { TrendingUp, ExternalLink } from "lucide-react";

export function IncomeOverview() {
  const { incomes, loading } = useIncome();
  const { formatFor } = useCurrency();
  const { dashboardCurrencyFilter } = useUIStore();
  const { settings } = useSettingsStore();
  const defaultCurrency = settings?.currencyCode ?? "KWD";

  if (loading) return <TableSkeleton rows={4} />;

  const filtered = dashboardCurrencyFilter
    ? incomes.filter((i) => (i.currencyCode || defaultCurrency) === dashboardCurrencyFilter)
    : incomes;

  return (
    <div className="bg-white rounded-lg border border-border overflow-hidden">
      <div className="flex items-center justify-between px-4 py-2.5 border-b border-border">
        <span className="text-xs font-semibold text-foreground">Income Sources</span>
        <Link href="/income" className="text-[10px] text-primary hover:underline flex items-center gap-1">
          View all <ExternalLink className="w-3 h-3" />
        </Link>
      </div>

      {filtered.length === 0 ? (
        <div className="px-4 py-5 text-center text-xs text-muted-foreground">
          {dashboardCurrencyFilter ? `No incomes in ${dashboardCurrencyFilter}` : "No income sources yet"}
        </div>
      ) : (
        <div className="divide-y divide-border">
          {filtered.slice(0, 6).map((income) => {
            const cur = income.currencyCode || defaultCurrency;
            return (
              <Link key={income.id} href={`/income/${income.id}`}
                className="flex items-center gap-2.5 px-4 py-2 hover:bg-muted/40 transition-colors">
                <div className="w-6 h-6 rounded-md bg-blue-50 flex items-center justify-center shrink-0">
                  <TrendingUp className="w-3 h-3 text-blue-500" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5">
                    <span className="text-xs font-medium text-foreground truncate">{income.name}</span>
                    <span className="text-[10px] text-muted-foreground shrink-0">{income.source}</span>
                    {cur !== defaultCurrency && (
                      <span className="text-[10px] px-1 rounded bg-blue-50 text-blue-600 font-semibold shrink-0">{cur}</span>
                    )}
                  </div>
                  <div className="flex items-center gap-1.5 mt-0.5">
                    <div className="flex-1 h-1 bg-muted rounded-full overflow-hidden max-w-[80px]">
                      <div className="h-full bg-gradient-to-r from-blue-400 to-blue-600 rounded-full"
                        style={{ width: `${income.percentageUsed}%` }} />
                    </div>
                    <span className="text-[10px] text-muted-foreground shrink-0">{income.percentageUsed}%</span>
                  </div>
                </div>
                <div className="text-right shrink-0">
                  <div className="text-xs font-bold text-foreground amount-display">
                    {formatFor(income.balance, cur)}
                  </div>
                  <div className="text-[10px] text-muted-foreground">left</div>
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
