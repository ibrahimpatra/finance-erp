"use client";
import { useEffect } from "react";
import { useTransferStore } from "@/stores/transfer.store";
import { useAuthStore } from "@/stores/auth.store";

export function useTransfers() {
  const { user } = useAuthStore();
  const store = useTransferStore();
  useEffect(() => {
    if (user?.uid) store.fetchTransfers(user.uid);
  }, [user?.uid]);
  return store;
}
