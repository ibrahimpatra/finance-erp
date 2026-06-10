"use client";
import { useEffect } from "react";
import { useSettingsStore } from "@/stores/settings.store";
import { useAuthStore } from "@/stores/auth.store";

export function useSettings() {
  const { user } = useAuthStore();
  const store = useSettingsStore();
  useEffect(() => {
    if (user?.uid) store.fetchSettings(user.uid);
  }, [user?.uid]);
  return store;
}
