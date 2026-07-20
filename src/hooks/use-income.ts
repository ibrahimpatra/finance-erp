"use client";
import { useEffect } from "react";
import { useIncomeStore } from "@/stores/income.store";
import { useAuthStore } from "@/stores/auth.store";

export function useIncome() {
  const { user } = useAuthStore();
  const store = useIncomeStore();

  useEffect(() => {
    // Guard: don't fire another fetch if one is already in flight.
    // This prevents duplicate Firestore reads when multiple components
    // mount simultaneously (e.g. dashboard + income-overview both call this).
    if (user?.uid && !store.loading) store.fetchIncomes(user.uid);
  }, [user?.uid]); // eslint-disable-line react-hooks/exhaustive-deps

  return {
    ...store,
    totalIncome: store.incomes.reduce((a, i) => a + i.amount, 0),
    totalBalance: store.incomes.reduce((a, i) => a + i.balance, 0),
    totalExpenses: store.incomes.reduce((a, i) => a + i.totalExpenses, 0),
  };
}
