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
  navMobileOpen: boolean;
  smartDefaults: SmartDefaults;
  dashboardCurrencyFilter: string;
  drawerCount: number;
  openQuickAdd: () => void;
  closeQuickAdd: () => void;
  toggleCommand: () => void;
  toggleSidebar: () => void;
  toggleNavMobile: () => void;
  closeNavMobile: () => void;
  setSmartDefaults: (defaults: SmartDefaults) => void;
  setDashboardCurrencyFilter: (code: string) => void;
  openDrawer: () => void;
  closeDrawer: () => void;
}

export const useUIStore = create<UIStore>((set, get) => ({
  quickAddOpen: false,
  commandOpen: false,
  sidebarOpen: false,
  navMobileOpen: false,
  smartDefaults: {},
  dashboardCurrencyFilter: "",
  drawerCount: 0,
  openQuickAdd: () => set({ quickAddOpen: true }),
  closeQuickAdd: () => set({ quickAddOpen: false }),
  toggleCommand: () => set((s) => ({ commandOpen: !s.commandOpen })),
  toggleSidebar: () => set((s) => ({ sidebarOpen: !s.sidebarOpen })),
  toggleNavMobile: () => set((s) => ({ navMobileOpen: !s.navMobileOpen })),
  closeNavMobile: () => set({ navMobileOpen: false }),
  setSmartDefaults: (defaults) => set({ smartDefaults: { ...get().smartDefaults, ...defaults } }),
  setDashboardCurrencyFilter: (code) => set({ dashboardCurrencyFilter: code }),
  openDrawer: () => set((s) => ({ drawerCount: s.drawerCount + 1 })),
  closeDrawer: () => set((s) => ({ drawerCount: Math.max(0, s.drawerCount - 1) })),
}));
