import { create } from "zustand";
import { Settings, SettingsFormData } from "@/types";
import { getSettings, upsertSettings } from "@/services/settings.service";

interface SettingsStore {
  settings: Settings | null;
  loading: boolean;
  // NEW — tracks whether a fetch has been attempted at all, distinct from
  // whether it returned data. A brand-new user legitimately has no settings
  // doc yet (until they pick a currency), so "settings === null" alone can't
  // be used to decide whether to refetch — that would loop forever.
  fetched: boolean;
  fetchSettings: (userId: string) => Promise<void>;
  updateSettings: (userId: string, data: SettingsFormData) => Promise<void>;
}

export const useSettingsStore = create<SettingsStore>((set, get) => ({
  settings: null,
  loading: false,
  fetched: false,
  fetchSettings: async (userId) => {
    set({ loading: true });
    try {
      const s = await getSettings(userId);
      set({ settings: s, loading: false, fetched: true });
    } catch {
      set({ loading: false, fetched: true });
    }
  },
  updateSettings: async (userId, data) => {
    await upsertSettings(userId, data);
    const s = await getSettings(userId);
    set({ settings: s, fetched: true });
  },
}));
