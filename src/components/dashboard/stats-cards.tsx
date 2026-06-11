"use client";
import { useAnalytics } from "@/hooks/use-analytics";
import { useCurrency } from "@/hooks/use-currency";
import { useUIStore } from "@/stores/ui.store";
import { StatsGridSkeleton } from "@/components/shared/loading-skeleton";
import {
  TrendingUp, Receipt, Wallet, BarChart2,
  Tag, Users, ArrowLeftRight, Trophy,
} from "lucide-react";
import { useIncomeStore } from "@/stores/income.store";

export function StatsCards() {
  const { loading } = useIncomeStore();
  const {
    totalIncome, totalExpenses, totalBalance,
    incomeCount, expenseCount, spentByCount, tagCount,
    topSpender, topCategory,
  } = useAnalytics();
  const { format } = useCurrency();
  const { dashboardCurrencyFilter } = useUIStore();

  if (loading) return <StatsGridSkeleton />;

  const cards = [
    {
      label: "Total Income",
      value: format(totalIncome),
      icon: TrendingUp,
      iconCls: "text-blue-500 bg-blue-50",
      bar: "bg-blue-400",
      sub: `${incomeCount} source${incomeCount !== 1 ? "s" : ""}`,
    },
    {
      label: "Total Expenses",
      value: format(totalExpenses),
      icon: Receipt,
      iconCls: "text-red-500 bg-red-50",
      bar: "bg-red-400",
      sub: `${expenseCount} tx`,
    },
    {
      label: "Net Balance",
      value: format(totalBalance),
      icon: Wallet,
      iconCls: totalBalance >= 0 ? "text-emerald-500 bg-emerald-50" : "text-red-500 bg-red-50",
      bar: totalBalance >= 0 ? "bg-emerald-400" : "bg-red-400",
      sub: totalBalance >= 0 ? "Surplus" : "Deficit",
    },
    {
      label: "Spend Rate",
      value: totalIncome > 0
        ? `${Math.min(100, Math.round((totalExpenses / totalIncome) * 100))}%`
        : "—",
      icon: BarChart2,
      iconCls: "text-indigo-500 bg-indigo-50",
      bar: "bg-indigo-400",
      sub: "of income used",
    },
    {
      label: "Top Spender",
      value: topSpender?.name ?? "—",
      icon: Trophy,
      iconCls: "text-amber-500 bg-amber-50",
      bar: "bg-amber-400",
      sub: topSpender ? format(topSpender.amount) : "No data",
    },
    {
      label: "Top Category",
      value: topCategory?.categoryName ?? "—",
      icon: ArrowLeftRight,
      iconCls: "text-rose-500 bg-rose-50",
      bar: "bg-rose-400",
      sub: topCategory ? format(topCategory.amount) : "No data",
    },
    {
      label: "People",
      value: spentByCount.toString(),
      icon: Users,
      iconCls: "text-purple-500 bg-purple-50",
      bar: "bg-purple-400",
      sub: "tracked",
    },
    {
      label: "Tags",
      value: tagCount.toString(),
      icon: Tag,
      iconCls: "text-teal-500 bg-teal-50",
      bar: "bg-teal-400",
      sub: "labels",
    },
  ];

  return (
    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
      {cards.map((card) => (
        <div key={card.label}
          className="bg-white rounded-lg border border-border flex items-center gap-2.5 px-3 py-2.5 hover:shadow-sm transition-shadow">
          {/* Icon */}
          <div className={`w-7 h-7 rounded-md flex items-center justify-center shrink-0 ${card.iconCls}`}>
            <card.icon className="w-3.5 h-3.5" />
          </div>
          {/* Text */}
          <div className="min-w-0 flex-1">
            <div className="text-[11px] font-medium text-muted-foreground leading-none mb-0.5">
              {card.label}
              {dashboardCurrencyFilter && (
                <span className="ml-1 opacity-60">· {dashboardCurrencyFilter}</span>
              )}
            </div>
            <div className="text-sm font-bold text-foreground leading-tight truncate amount-display">
              {card.value}
            </div>
            <div className="text-[10px] text-muted-foreground/70 leading-none mt-0.5 truncate">
              {card.sub}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
