import { create } from "zustand";

interface SmartDefaults {
  incomeSourceId?: string;
  spentById?: string;
  expenseTypeId?: string;
  tagIds?: string[];
}

interface UIStore {
  quickAddOpen: boolean;
  commandOpen: boolean;
  sidebarOpen: boolean;
  smartDefaults: SmartDefaults;
  openQuickAdd: () => void;
  closeQuickAdd: () => void;
  toggleCommand: () => void;
  toggleSidebar: () => void;
  setSmartDefaults: (defaults: SmartDefaults) => void;
}

export const useUIStore = create<UIStore>((set, get) => ({
  quickAddOpen: false,
  commandOpen: false,
  sidebarOpen: true,
  smartDefaults: {},
  openQuickAdd: () => set({ quickAddOpen: true }),
  closeQuickAdd: () => set({ quickAddOpen: false }),
  toggleCommand: () => set((s) => ({ commandOpen: !s.commandOpen })),
  toggleSidebar: () => set((s) => ({ sidebarOpen: !s.sidebarOpen })),
  setSmartDefaults: (defaults) => set({ smartDefaults: { ...get().smartDefaults, ...defaults } }),
}));
