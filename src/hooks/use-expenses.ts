"use client";
import { useEffect } from "react";
import { useExpenseStore } from "@/stores/expense.store";
import { useAuthStore } from "@/stores/auth.store";
import { ExpenseFilters } from "@/types";

export function useExpenses(filters?: ExpenseFilters) {
  const { user } = useAuthStore();
  const store = useExpenseStore();

  useEffect(() => {
    if (user?.uid) store.fetchExpenses(user.uid, filters);
  }, [user?.uid]);

  return store;
}
