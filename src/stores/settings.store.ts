import { create } from "zustand";
import { Settings, SettingsFormData } from "@/types";
import { getSettings, upsertSettings } from "@/services/settings.service";

interface SettingsStore {
  settings: Settings | null;
  loading: boolean;
  fetchSettings: (userId: string) => Promise<void>;
  updateSettings: (userId: string, data: SettingsFormData) => Promise<void>;
}

export const useSettingsStore = create<SettingsStore>((set, get) => ({
  settings: null,
  loading: false,
  fetchSettings: async (userId) => {
    set({ loading: true });
    const s = await getSettings(userId);
    set({ settings: s, loading: false });
  },
  updateSettings: async (userId, data) => {
    await upsertSettings(userId, data);
    const s = await getSettings(userId);
    set({ settings: s });
  },
}));
