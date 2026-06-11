"use client";
import { useMemo } from "react";
import { useIncomeStore } from "@/stores/income.store";
import { useExpenseStore } from "@/stores/expense.store";
import { useSpentByStore } from "@/stores/spent-by.store";
import { useTagStore } from "@/stores/tag.store";
import { useExpenseTypeStore } from "@/stores/expense-type.store";
import { useUIStore } from "@/stores/ui.store";
import { useSettingsStore } from "@/stores/settings.store";
import { CategoryBreakdown, MonthlyTrend, TagAnalytics } from "@/types";
import { getLast12Months } from "@/lib/utils/date";
import { format } from "date-fns";

export function useAnalytics() {
  const { incomes } = useIncomeStore();
  const { expenses } = useExpenseStore();
  const { spentBys } = useSpentByStore();
  const { tags } = useTagStore();
  const { expenseTypes } = useExpenseTypeStore();
  const { dashboardCurrencyFilter } = useUIStore();
  const { settings } = useSettingsStore();

  const defaultCurrency = settings?.currencyCode ?? "KWD";

  // Apply currency filter — records without a currencyCode inherit the default
  const filteredIncomes = useMemo(() => {
    if (!dashboardCurrencyFilter) return incomes;
    return incomes.filter((i) => (i.currencyCode || defaultCurrency) === dashboardCurrencyFilter);
  }, [incomes, dashboardCurrencyFilter, defaultCurrency]);

  const filteredExpenses = useMemo(() => {
    if (!dashboardCurrencyFilter) return expenses;
    return expenses.filter((e) => (e.currencyCode || defaultCurrency) === dashboardCurrencyFilter);
  }, [expenses, dashboardCurrencyFilter, defaultCurrency]);

  const totalIncome = useMemo(() => filteredIncomes.reduce((a, i) => a + i.amount, 0), [filteredIncomes]);
  const totalExpenses = useMemo(() => filteredExpenses.reduce((a, e) => a + e.amount, 0), [filteredExpenses]);
  const totalBalance = useMemo(() => totalIncome - totalExpenses, [totalIncome, totalExpenses]);

  const categoryBreakdown = useMemo((): CategoryBreakdown[] => {
    const map = new Map<string, { amount: number; count: number }>();
    for (const e of filteredExpenses) {
      const curr = map.get(e.expenseTypeId) || { amount: 0, count: 0 };
      map.set(e.expenseTypeId, { amount: curr.amount + e.amount, count: curr.count + 1 });
    }
    return Array.from(map.entries()).map(([id, data]) => {
      const et = expenseTypes.find((t) => t.id === id);
      return {
        categoryId: id,
        categoryName: et?.name ?? "Unknown",
        color: et?.color ?? "#6b7280",
        amount: data.amount,
        percentage: totalExpenses > 0 ? (data.amount / totalExpenses) * 100 : 0,
        count: data.count,
      };
    }).sort((a, b) => b.amount - a.amount);
  }, [filteredExpenses, expenseTypes, totalExpenses]);

  const spendingByPerson = useMemo(() => {
    const map = new Map<string, number>();
    for (const e of filteredExpenses) {
      map.set(e.spentById, (map.get(e.spentById) ?? 0) + e.amount);
    }
    return Array.from(map.entries()).map(([id, amount]) => {
      const sb = spentBys.find((s) => s.id === id);
      return { id, name: sb?.name ?? "Unknown", amount, color: sb?.avatarColor ?? "#6b7280" };
    }).sort((a, b) => b.amount - a.amount);
  }, [filteredExpenses, spentBys]);

  const monthlyTrend = useMemo((): MonthlyTrend[] => {
    return getLast12Months().map(({ start, end, label }) => {
      const monthIncome = filteredIncomes
        .filter((i) => { const d = i.createdAt.toDate(); return d >= start && d <= end; })
        .reduce((a, i) => a + i.amount, 0);
      const monthExpenses = filteredExpenses
        .filter((e) => { const d = e.createdAt.toDate(); return d >= start && d <= end; })
        .reduce((a, e) => a + e.amount, 0);
      return { month: label, income: monthIncome, expenses: monthExpenses, balance: monthIncome - monthExpenses };
    });
  }, [filteredIncomes, filteredExpenses]);

  const tagAnalytics = useMemo((): TagAnalytics[] => {
    return tags.map((tag) => {
      const incomeCount = filteredIncomes.filter((i) => i.tagIds.includes(tag.id)).length;
      const tagExpenses = filteredExpenses.filter((e) => e.tagIds.includes(tag.id));
      const expenseCount = tagExpenses.length;
      const totalAmount = tagExpenses.reduce((a, e) => a + e.amount, 0);
      return {
        tagId: tag.id,
        tagName: tag.name,
        color: tag.color,
        incomeCount,
        expenseCount,
        totalAmount,
        usageCount: incomeCount + expenseCount,
      };
    }).sort((a, b) => b.usageCount - a.usageCount);
  }, [tags, filteredIncomes, filteredExpenses]);

  const topSpender = useMemo(() => spendingByPerson[0] ?? null, [spendingByPerson]);
  const topCategory = useMemo(() => categoryBreakdown[0] ?? null, [categoryBreakdown]);

  return {
    totalIncome, totalExpenses, totalBalance,
    categoryBreakdown, spendingByPerson, monthlyTrend, tagAnalytics,
    topSpender, topCategory,
    incomeCount: filteredIncomes.length,
    expenseCount: filteredExpenses.length,
    spentByCount: spentBys.length,
    tagCount: tags.length,
  };
}
