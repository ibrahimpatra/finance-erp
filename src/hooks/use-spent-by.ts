"use client";
import { useEffect } from "react";
import { useSpentByStore } from "@/stores/spent-by.store";
import { useAuthStore } from "@/stores/auth.store";

export function useSpentBy() {
  const { user } = useAuthStore();
  const store = useSpentByStore();
  useEffect(() => {
    if (user?.uid) store.fetchSpentBys(user.uid);
  }, [user?.uid]);
  return store;
}
