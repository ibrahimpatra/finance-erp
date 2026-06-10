"use client";
import { useIncome } from "@/hooks/use-income";
import { useExpenses } from "@/hooks/use-expenses";
import { useSpentBy } from "@/hooks/use-spent-by";
import { useTags } from "@/hooks/use-tags";
import { useTransfers } from "@/hooks/use-transfers";
import { useExpenseTypes } from "@/hooks/use-expense-types";
import { StatsCards } from "@/components/dashboard/stats-cards";
import { IncomeOverview } from "@/components/dashboard/income-overview";
import { RecentTransactions } from "@/components/dashboard/recent-transactions";
import { ExpensePieChart, MonthlyTrendChart, SpendingByPersonChart } from "@/components/dashboard/expense-chart";

export function DashboardClient() {
  useIncome();
  useExpenses();
  useSpentBy();
  useTags();
  useTransfers();
  useExpenseTypes();

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h2 className="text-2xl font-bold text-foreground tracking-tight">Overview</h2>
        <p className="text-muted-foreground text-sm mt-1">Your complete financial picture at a glance.</p>
      </div>
      <StatsCards />
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        <IncomeOverview />
        <RecentTransactions />
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
        <MonthlyTrendChart />
        <ExpensePieChart />
        <SpendingByPersonChart />
      </div>
    </div>
  );
}
