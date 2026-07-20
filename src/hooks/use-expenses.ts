"use client";
import { useEffect } from "react";
import { useExpenseStore } from "@/stores/expense.store";
import { useAuthStore } from "@/stores/auth.store";
import { ExpenseFilters } from "@/types";

export function useExpenses(filters?: ExpenseFilters) {
  const { user } = useAuthStore();
  const store = useExpenseStore();

  useEffect(() => {
    if (user?.uid && !store.loading) store.fetchExpenses(user.uid, filters);
  }, [user?.uid]); // eslint-disable-line react-hooks/exhaustive-deps

  return store;
}
