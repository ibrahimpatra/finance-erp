"use client";
import { useAnalytics } from "@/hooks/use-analytics";
import { useCurrency } from "@/hooks/use-currency";
import { CurrencyDisplay } from "@/components/shared/currency-display";
import { StatsGridSkeleton } from "@/components/shared/loading-skeleton";
import { TrendingUp, Receipt, Wallet, BarChart2, Tag, Users, ArrowLeftRight, Trophy } from "lucide-react";
import { useIncomeStore } from "@/stores/income.store";

export function StatsCards() {
  const { loading } = useIncomeStore();
  const {
    totalIncome, totalExpenses, totalBalance,
    incomeCount, expenseCount, spentByCount, tagCount,
    topSpender, topCategory,
  } = useAnalytics();
  const { format } = useCurrency();

  if (loading) return <StatsGridSkeleton />;

  const cards = [
    {
      label: "Total Income",
      value: format(totalIncome),
      icon: TrendingUp,
      color: "text-blue-500 bg-blue-50",
      sub: `${incomeCount} source${incomeCount !== 1 ? "s" : ""}`,
      trend: null,
    },
    {
      label: "Total Expenses",
      value: format(totalExpenses),
      icon: Receipt,
      color: "text-red-500 bg-red-50",
      sub: `${expenseCount} transaction${expenseCount !== 1 ? "s" : ""}`,
      trend: null,
    },
    {
      label: "Net Balance",
      value: format(totalBalance),
      icon: Wallet,
      color: totalBalance >= 0 ? "text-emerald-500 bg-emerald-50" : "text-red-500 bg-red-50",
      sub: totalBalance >= 0 ? "Surplus" : "Deficit",
      trend: null,
    },
    {
      label: "Income Sources",
      value: incomeCount.toString(),
      icon: BarChart2,
      color: "text-indigo-500 bg-indigo-50",
      sub: "Active sources",
      trend: null,
    },
    {
      label: "Spent By",
      value: spentByCount.toString(),
      icon: Users,
      color: "text-purple-500 bg-purple-50",
      sub: "People tracked",
      trend: null,
    },
    {
      label: "Tags",
      value: tagCount.toString(),
      icon: Tag,
      color: "text-teal-500 bg-teal-50",
      sub: "Labels created",
      trend: null,
    },
    {
      label: "Top Spender",
      value: topSpender?.name ?? "—",
      icon: Trophy,
      color: "text-amber-500 bg-amber-50",
      sub: topSpender ? format(topSpender.amount) : "No data",
      trend: null,
    },
    {
      label: "Top Category",
      value: topCategory?.categoryName ?? "—",
      icon: ArrowLeftRight,
      color: "text-rose-500 bg-rose-50",
      sub: topCategory ? format(topCategory.amount) : "No data",
      trend: null,
    },
  ];

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
      {cards.map((card) => (
        <div key={card.label} className="stat-card group">
          <div className="flex items-start justify-between mb-3">
            <div className={`w-9 h-9 rounded-lg flex items-center justify-center ${card.color}`}>
              <card.icon className="w-4 h-4" />
            </div>
          </div>
          <div className="amount-display text-xl font-bold text-foreground leading-none mb-1 truncate">
            {card.value}
          </div>
          <div className="text-xs text-muted-foreground">{card.label}</div>
          <div className="text-xs text-muted-foreground/70 mt-0.5">{card.sub}</div>
        </div>
      ))}
    </div>
  );
}
