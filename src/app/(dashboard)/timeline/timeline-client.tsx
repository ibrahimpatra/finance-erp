"use client";
import { useTimeline } from "@/hooks/use-timeline";
import { useIncome } from "@/hooks/use-income";
import { useExpenses } from "@/hooks/use-expenses";
import { useTransfers } from "@/hooks/use-transfers";
import { useCurrency } from "@/hooks/use-currency";
import { EmptyState } from "@/components/shared/empty-state";
import { formatDateTime } from "@/lib/utils/date";
import Link from "next/link";
import { Clock, TrendingUp, Receipt, ArrowLeftRight } from "lucide-react";
import { format } from "date-fns";

const TYPE_CONFIG = {
  income: { icon: TrendingUp, color: "text-blue-500 bg-blue-50 border-blue-100", label: "Income Added", href: "/income" },
  expense: { icon: Receipt, color: "text-red-500 bg-red-50 border-red-100", label: "Expense", href: "/expenses" },
  transfer: { icon: ArrowLeftRight, color: "text-amber-500 bg-amber-50 border-amber-100", label: "Transfer", href: "/transfers" },
};

export function TimelineClient() {
  useIncome(); useExpenses(); useTransfers();
  const events = useTimeline();
  const { format: formatCurrency } = useCurrency();

  const grouped = events.reduce((acc, event) => {
    const dateKey = format(event.date, "MMMM d, yyyy");
    if (!acc[dateKey]) acc[dateKey] = [];
    acc[dateKey].push(event);
    return acc;
  }, {} as Record<string, typeof events>);

  return (
    <div className="space-y-5 animate-fade-in max-w-3xl">
      <div>
        <h2 className="text-2xl font-bold text-foreground tracking-tight">Timeline</h2>
        <p className="text-muted-foreground text-sm mt-1">Complete activity history — {events.length} events</p>
      </div>

      {events.length === 0 ? (
        <EmptyState icon={Clock} title="No activity yet" description="Your income, expense, and transfer history will appear here." />
      ) : (
        <div className="space-y-8">
          {Object.entries(grouped).map(([date, dayEvents]) => (
            <div key={date}>
              <div className="sticky top-[var(--header-height)] z-10 flex items-center gap-3 py-2 bg-background">
                <div className="h-px flex-1 bg-border" />
                <span className="text-xs font-semibold text-muted-foreground bg-muted px-3 py-1 rounded-full">{date}</span>
                <div className="h-px flex-1 bg-border" />
              </div>
              <div className="space-y-2 mt-3">
                {dayEvents.map((event) => {
                  const config = TYPE_CONFIG[event.type];
                  const Icon = config.icon;
                  const isCredit = event.type === "income";
                  return (
                    <Link key={event.id} href={`${config.href}/${event.id}`}
                      className="flex items-center gap-4 bg-white rounded-xl border border-border px-5 py-3.5 hover:shadow-card transition-all group">
                      <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 border ${config.color}`}>
                        <Icon className="w-4 h-4" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-medium text-foreground truncate">{event.title}</span>
                          <span className="text-xs px-2 py-0.5 rounded-full bg-muted text-muted-foreground shrink-0">{config.label}</span>
                        </div>
                        {event.subtitle && <div className="text-xs text-muted-foreground mt-0.5 truncate">{event.subtitle}</div>}
                        <div className="text-xs text-muted-foreground/70">{formatDateTime(event.date)}</div>
                      </div>
                      <div className={`amount-display text-sm font-bold shrink-0 ${isCredit ? "text-emerald-600" : event.type === "expense" ? "text-red-500" : "text-amber-600"}`}>
                        {isCredit ? "+" : "-"}{formatCurrency(event.amount)}
                      </div>
                    </Link>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
