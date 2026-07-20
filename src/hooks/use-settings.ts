"use client";
import { useEffect } from "react";
import { useSettingsStore } from "@/stores/settings.store";
import { useAuthStore } from "@/stores/auth.store";

export function useSettings() {
  const { user } = useAuthStore();
  const store = useSettingsStore();
  useEffect(() => {
    // FIX (Phase 2): was fetching on every mount (every page navigation that
    // uses this hook), re-reading the same unchanged settings document
    // repeatedly. Now only fetches once per session — skips if already
    // attempted (using `fetched`, not `settings`, since a brand-new user's
    // settings doc legitimately doesn't exist yet — `settings` stays null
    // by design until they pick a currency, and that must not cause a loop).
    if (user?.uid && !store.fetched && !store.loading) {
      store.fetchSettings(user.uid);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.uid]);
  return store;
}
