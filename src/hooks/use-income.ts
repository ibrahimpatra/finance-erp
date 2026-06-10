"use client";
import { useEffect } from "react";
import { useIncomeStore } from "@/stores/income.store";
import { useAuthStore } from "@/stores/auth.store";

export function useIncome() {
  const { user } = useAuthStore();
  const store = useIncomeStore();

  useEffect(() => {
    if (user?.uid) store.fetchIncomes(user.uid);
  }, [user?.uid]);

  return {
    ...store,
    totalIncome: store.incomes.reduce((a, i) => a + i.amount, 0),
    totalBalance: store.incomes.reduce((a, i) => a + i.balance, 0),
    totalExpenses: store.incomes.reduce((a, i) => a + i.totalExpenses, 0),
  };
}
