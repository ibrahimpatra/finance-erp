"use client";
import { useExpenses } from "@/hooks/use-expenses";
import { useSpentBy } from "@/hooks/use-spent-by";
import { useExpenseTypes } from "@/hooks/use-expense-types";
import { useCurrency } from "@/hooks/use-currency";
import { TableSkeleton } from "@/components/shared/loading-skeleton";
import { EmptyState } from "@/components/shared/empty-state";
import { formatRelative } from "@/lib/utils/date";
import Link from "next/link";
import { Receipt, ExternalLink } from "lucide-react";
import { getInitials } from "@/lib/utils/helpers";

export function RecentTransactions() {
  const { expenses, loading } = useExpenses();
  const { spentBys } = useSpentBy();
  const { expenseTypes } = useExpenseTypes();
  const { format } = useCurrency();

  if (loading) return <TableSkeleton rows={4} />;

  const recent = expenses.slice(0, 8);

  return (
    <div className="bg-white rounded-xl border border-border overflow-hidden shadow-card">
      <div className="flex items-center justify-between px-5 py-4 border-b border-border">
        <h2 className="font-semibold text-foreground">Recent Expenses</h2>
        <Link href="/expenses" className="text-xs text-primary hover:underline flex items-center gap-1">
          View all <ExternalLink className="w-3 h-3" />
        </Link>
      </div>
      {recent.length === 0 ? (
        <EmptyState icon={Receipt} title="No expenses yet" description="Add your first expense to start tracking." />
      ) : (
        <div className="divide-y divide-border">
          {recent.map((expense) => {
            const person = spentBys.find((s) => s.id === expense.spentById);
            const category = expenseTypes.find((t) => t.id === expense.expenseTypeId);
            return (
              <Link key={expense.id} href={`/expenses/${expense.id}`}
                className="flex items-center gap-3 px-5 py-3 hover:bg-muted/40 transition-colors">
                <div className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold text-white shrink-0"
                  style={{ backgroundColor: person?.avatarColor ?? "#6b7280" }}>
                  {person ? getInitials(person.name) : "?"}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium text-foreground truncate">{expense.reason}</div>
                  <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                    <span>{person?.name ?? "Unknown"}</span>
                    {category && (
                      <>
                        <span>·</span>
                        <span style={{ color: category.color ?? "#6b7280" }}>{category.icon} {category.name}</span>
                      </>
                    )}
                  </div>
                </div>
                <div className="text-right shrink-0">
                  <div className="amount-display text-sm font-semibold text-red-500">-{format(expense.amount)}</div>
                  <div className="text-xs text-muted-foreground">{formatRelative(expense.createdAt)}</div>
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
