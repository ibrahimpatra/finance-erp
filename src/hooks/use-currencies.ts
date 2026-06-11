"use client";
import { useEffect } from "react";
import { useCurrencyStore } from "@/stores/currency.store";
import { useAuthStore } from "@/stores/auth.store";

export function useCurrencies() {
  const { user } = useAuthStore();
  const store = useCurrencyStore();
  useEffect(() => {
    if (user?.uid) store.fetchCurrencies(user.uid);
  }, [user?.uid]);
  return store;
}
