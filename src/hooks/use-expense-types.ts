"use client";
import { useEffect } from "react";
import { useExpenseTypeStore } from "@/stores/expense-type.store";
import { useAuthStore } from "@/stores/auth.store";

export function useExpenseTypes() {
  const { user } = useAuthStore();
  const store = useExpenseTypeStore();
  useEffect(() => {
    if (user?.uid) store.fetchExpenseTypes(user.uid);
  }, [user?.uid]);
  return store;
}
