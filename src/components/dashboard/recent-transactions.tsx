"use client";
import { useExpenses } from "@/hooks/use-expenses";
import { useSpentBy } from "@/hooks/use-spent-by";
import { useExpenseTypes } from "@/hooks/use-expense-types";
import { useCurrency } from "@/hooks/use-currency";
import { useUIStore } from "@/stores/ui.store";
import { useSettingsStore } from "@/stores/settings.store";
import { TableSkeleton } from "@/components/shared/loading-skeleton";
import { formatRelative } from "@/lib/utils/date";
import Link from "next/link";
import { ExternalLink } from "lucide-react";
import { getInitials } from "@/lib/utils/helpers";

export function RecentTransactions() {
  const { expenses, loading } = useExpenses();
  const { spentBys } = useSpentBy();
  const { expenseTypes } = useExpenseTypes();
  const { formatFor } = useCurrency();
  const { dashboardCurrencyFilter } = useUIStore();
  const { settings } = useSettingsStore();
  const defaultCurrency = settings?.currencyCode ?? "KWD";

  if (loading) return <TableSkeleton rows={5} />;

  const filtered = dashboardCurrencyFilter
    ? expenses.filter((e) => (e.currencyCode || defaultCurrency) === dashboardCurrencyFilter)
    : expenses;

  const recent = filtered.slice(0, 10);

  return (
    <div className="bg-white rounded-lg border border-border overflow-hidden">
      <div className="flex items-center justify-between px-4 py-2.5 border-b border-border">
        <span className="text-xs font-semibold text-foreground">Recent Expenses</span>
        <Link href="/expenses" className="text-[10px] text-primary hover:underline flex items-center gap-1">
          View all <ExternalLink className="w-3 h-3" />
        </Link>
      </div>

      {recent.length === 0 ? (
        <div className="px-4 py-5 text-center text-xs text-muted-foreground">
          {dashboardCurrencyFilter ? `No expenses in ${dashboardCurrencyFilter}` : "No expenses yet"}
        </div>
      ) : (
        <div className="divide-y divide-border">
          {recent.map((expense) => {
            const person   = spentBys.find((s) => s.id === expense.spentById);
            const category = expenseTypes.find((t) => t.id === expense.expenseTypeId);
            const cur      = expense.currencyCode || defaultCurrency;
            return (
              <Link key={expense.id} href={`/expenses/${expense.id}`}
                className="flex items-center gap-2.5 px-4 py-2 hover:bg-muted/40 transition-colors">
                <div className="w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold text-white shrink-0"
                  style={{ backgroundColor: person?.avatarColor ?? "#6b7280" }}>
                  {person ? getInitials(person.name) : "?"}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-xs font-medium text-foreground truncate">{expense.reason}</div>
                  <div className="flex items-center gap-1 text-[10px] text-muted-foreground">
                    <span className="truncate">{person?.name ?? "Unknown"}</span>
                    {category && (
                      <>
                        <span>·</span>
                        <span style={{ color: category.color ?? "#6b7280" }}>{category.icon}</span>
                        <span className="truncate">{category.name}</span>
                      </>
                    )}
                    {cur !== defaultCurrency && (
                      <span className="px-1 rounded bg-blue-50 text-blue-600 font-semibold shrink-0">{cur}</span>
                    )}
                  </div>
                </div>
                <div className="text-right shrink-0">
                  <div className="text-xs font-bold text-red-500 amount-display">-{formatFor(expense.amount, cur)}</div>
                  <div className="text-[10px] text-muted-foreground">{formatRelative(expense.createdAt)}</div>
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
