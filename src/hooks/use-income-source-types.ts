"use client";
import { useEffect } from "react";
import { useIncomeSourceTypeStore } from "@/stores/income-source-type.store";
import { useAuthStore } from "@/stores/auth.store";

export function useIncomeSourceTypes() {
  const { user } = useAuthStore();
  const store = useIncomeSourceTypeStore();
  useEffect(() => {
    if (user?.uid) store.fetchSourceTypes(user.uid);
  }, [user?.uid]);
  return store;
}
