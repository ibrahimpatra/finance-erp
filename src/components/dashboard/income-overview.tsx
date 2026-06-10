"use client";
import { useIncome } from "@/hooks/use-income";
import { useCurrency } from "@/hooks/use-currency";
import { TableSkeleton } from "@/components/shared/loading-skeleton";
import { EmptyState } from "@/components/shared/empty-state";
import Link from "next/link";
import { TrendingUp, ExternalLink } from "lucide-react";

export function IncomeOverview() {
  const { incomes, loading } = useIncome();
  const { format } = useCurrency();

  if (loading) return <TableSkeleton rows={3} />;

  return (
    <div className="bg-white rounded-xl border border-border overflow-hidden shadow-card">
      <div className="flex items-center justify-between px-5 py-4 border-b border-border">
        <h2 className="font-semibold text-foreground">Income Sources</h2>
        <Link href="/income" className="text-xs text-primary hover:underline flex items-center gap-1">
          View all <ExternalLink className="w-3 h-3" />
        </Link>
      </div>
      {incomes.length === 0 ? (
        <EmptyState icon={TrendingUp} title="No income yet" description="Add your first income source to get started." />
      ) : (
        <div className="divide-y divide-border">
          {incomes.slice(0, 5).map((income) => (
            <Link key={income.id} href={`/income/${income.id}`}
              className="flex items-center gap-4 px-5 py-3.5 hover:bg-muted/40 transition-colors group">
              <div className="w-9 h-9 rounded-lg bg-blue-50 flex items-center justify-center shrink-0">
                <TrendingUp className="w-4 h-4 text-blue-500" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-0.5">
                  <span className="text-sm font-medium text-foreground truncate">{income.name}</span>
                  <span className="text-xs text-muted-foreground shrink-0">{income.source}</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="flex-1 h-1.5 bg-muted rounded-full overflow-hidden">
                    <div className="progress-gradient h-full" style={{ width: `${income.percentageUsed}%` }} />
                  </div>
                  <span className="text-xs text-muted-foreground shrink-0">{income.percentageUsed}% used</span>
                </div>
              </div>
              <div className="text-right shrink-0">
                <div className="amount-display text-sm font-semibold text-foreground">{format(income.balance)}</div>
                <div className="text-xs text-muted-foreground">remaining</div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
