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
  drawerCount: number;

  // ── Single-select for useAnalytics backward compat ─────────
  dashboardCurrencyFilter: string;
  setDashboardCurrencyFilter: (code: string) => void;

  // ── Global currency filter: simple single-select ────────────
  // ""     = not yet set → pages default to base currency
  // "all"  = All currencies
  // "KWD"  = only that currency
  globalCurrency: string;
  setGlobalCurrency: (code: string) => void;  // pass "all" or a currency code

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
  drawerCount: 0,
  dashboardCurrencyFilter: "",
  globalCurrency: "",          // empty = use base currency (set by pages on first mount)

  openQuickAdd:    () => set({ quickAddOpen: true }),
  closeQuickAdd:   () => set({ quickAddOpen: false }),
  toggleCommand:   () => set((s) => ({ commandOpen: !s.commandOpen })),
  toggleSidebar:   () => set((s) => ({ sidebarOpen: !s.sidebarOpen })),
  toggleNavMobile: () => set((s) => ({ navMobileOpen: !s.navMobileOpen })),
  closeNavMobile:  () => set({ navMobileOpen: false }),
  setSmartDefaults: (defaults) =>
    set({ smartDefaults: { ...get().smartDefaults, ...defaults } }),

  setDashboardCurrencyFilter: (code) => set({ dashboardCurrencyFilter: code }),

  // Set global currency + keep dashboardCurrencyFilter in sync for useAnalytics
  setGlobalCurrency: (code) => {
    set({
      globalCurrency: code,
      // When a specific currency is selected: sync the chart filter to match.
      // When "all" or empty is selected: RESET to "" so useAnalytics defaults
      // cleanly to the base currency and never mixes stale single-currency data
      // into cross-currency chart computations.
      dashboardCurrencyFilter: (code && code !== "all") ? code : "",
    });
  },

  openDrawer:  () => set((s) => ({ drawerCount: s.drawerCount + 1 })),
  closeDrawer: () => set((s) => ({ drawerCount: Math.max(0, s.drawerCount - 1) })),
}));
