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
  // ── Single-select (kept for useAnalytics backward compat) ──
  dashboardCurrencyFilter: string;
  setDashboardCurrencyFilter: (code: string) => void;
  // ── Global multi-select currency filter ────────────────────
  // empty array = "All currencies"
  globalCurrencies: string[];
  setGlobalCurrencies: (codes: string[]) => void;
  toggleGlobalCurrency: (code: string) => void;
  clearGlobalCurrencies: () => void;
  // ── Drawer tracking (FAB hide) ─────────────────────────────
  drawerCount: number;
  openQuickAdd: () => void;
  closeQuickAdd: () => void;
  toggleCommand: () => void;
  toggleSidebar: () => void;
  toggleNavMobile: () => void;
  closeNavMobile: () => void;
  setSmartDefaults: (defaults: SmartDefaults) => void;
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
  globalCurrencies: [],
  drawerCount: 0,

  openQuickAdd:    () => set({ quickAddOpen: true }),
  closeQuickAdd:   () => set({ quickAddOpen: false }),
  toggleCommand:   () => set((s) => ({ commandOpen: !s.commandOpen })),
  toggleSidebar:   () => set((s) => ({ sidebarOpen: !s.sidebarOpen })),
  toggleNavMobile: () => set((s) => ({ navMobileOpen: !s.navMobileOpen })),
  closeNavMobile:  () => set({ navMobileOpen: false }),
  setSmartDefaults: (defaults) =>
    set({ smartDefaults: { ...get().smartDefaults, ...defaults } }),

  // Single-select setter (backward compat for useAnalytics)
  setDashboardCurrencyFilter: (code) => set({ dashboardCurrencyFilter: code }),

  // Multi-select: set exact list; also sync dashboardCurrencyFilter to first item
  setGlobalCurrencies: (codes) => {
    set({
      globalCurrencies: codes,
      dashboardCurrencyFilter: codes.length === 1 ? codes[0] : (codes[0] ?? get().dashboardCurrencyFilter),
    });
  },

  // Toggle one currency on/off in the multi-select list
  toggleGlobalCurrency: (code) => {
    const current = get().globalCurrencies;
    const next = current.includes(code)
      ? current.filter((c) => c !== code)
      : [...current, code];
    set({
      globalCurrencies: next,
      // sync single-select for useAnalytics when exactly one is selected
      dashboardCurrencyFilter: next.length >= 1 ? next[0] : get().dashboardCurrencyFilter,
    });
  },

  // "All currencies" — clear selection
  clearGlobalCurrencies: () => set({ globalCurrencies: [] }),

  openDrawer:  () => set((s) => ({ drawerCount: s.drawerCount + 1 })),
  closeDrawer: () => set((s) => ({ drawerCount: Math.max(0, s.drawerCount - 1) })),
}));
