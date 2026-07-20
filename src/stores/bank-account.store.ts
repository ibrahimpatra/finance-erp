"use client";
import { create } from "zustand";
import { BankAccount, BankAccountFormData, BankAccountWithBalance, IncomeWithBalance } from "@/types";
import {
  getBankAccounts, createBankAccount, updateBankAccount,
  deleteBankAccount, computeAccountWithBalance, reconcileAccount,
} from "@/services/bank-account.service";
import {
  getAllShortfallEntries, computeOutstandingShortfallsByAccount,
  computeOpeningBalanceByAccount, getOutstandingShortfalls,
  resolveAccountShortfalls,
} from "@/services/shortfall.service";

interface BankAccountStore {
  accounts:            BankAccount[];
  accountsWithBalance: BankAccountWithBalance[];
  loading:             boolean;
  error:               string | null;

  // accountId -> outstanding shortfall amount (live, computed from ledger)
  shortfallsByAccount:    Map<string, number>;
  openingBalanceByAccount: Map<string, number>;

  fetchAccounts:       (userId: string) => Promise<void>;
  fetchShortfallData:  (userId: string) => Promise<void>;
  refreshBalances:     (incomesWithBalance: IncomeWithBalance[]) => void;
  addAccount:          (userId: string, data: BankAccountFormData) => Promise<string>;
  editAccount:         (userId: string, id: string, data: Partial<BankAccountFormData>, old?: BankAccount) => Promise<void>;
  removeAccount:       (userId: string, id: string) => Promise<void>;

  /** Manual resolve — user picks an income to cover a specific outstanding shortfall. */
  resolveShortfall:    (userId: string, accountId: string, incomeId: string, amount: number, expenseId: string) => Promise<void>;
  /** "Recompute" — safe, additive-only catch-up reconciliation for one account. */
  recomputeAccount:    (userId: string, accountId: string, incomeIds: string[]) => Promise<{ resolvedCount: number; totalResolved: number }>;
}

export const useBankAccountStore = create<BankAccountStore>((set, get) => ({
  accounts:                [],
  accountsWithBalance:     [],
  loading:                 false,
  error:                   null,
  shortfallsByAccount:     new Map(),
  openingBalanceByAccount: new Map(),

  fetchAccounts: async (userId) => {
    set({ loading: true, error: null });
    try {
      const accounts = await getBankAccounts(userId);
      set({ accounts, loading: false });
    } catch (e: unknown) {
      // FIX (Phase 2): always resolve loading to false on failure, so the
      // consuming hook's "accounts.length === 0 && !loading" check doesn't
      // keep re-triggering a fetch that's destined to fail every time.
      set({ loading: false, error: (e as Error).message ?? "Failed to load accounts" });
    }
  },

  fetchShortfallData: async (userId) => {
    try {
      const entries = await getAllShortfallEntries(userId);
      set({
        shortfallsByAccount:     computeOutstandingShortfallsByAccount(entries),
        openingBalanceByAccount: computeOpeningBalanceByAccount(entries),
      });
    } catch {
      // Non-critical — balances simply won't reflect shortfall/opening adjustments
      // until the next successful fetch. Never blocks the rest of the app.
    }
  },

  /** Call this whenever income balances change so account balances stay in sync. */
  refreshBalances: (incomesWithBalance) => {
    const { accounts, shortfallsByAccount, openingBalanceByAccount } = get();
    const accountsWithBalance = accounts.map((a) =>
      computeAccountWithBalance(
        a,
        incomesWithBalance,
        shortfallsByAccount.get(a.id) ?? 0,
        openingBalanceByAccount.get(a.id) ?? 0
      )
    );
    set({ accountsWithBalance });
  },

  addAccount: async (userId, data) => {
    const id = await createBankAccount(userId, data);
    const accounts = await getBankAccounts(userId);
    set({ accounts });
    // Re-fetch shortfall/opening data in case an opening balance was just written
    await get().fetchShortfallData(userId);
    return id;
  },

  editAccount: async (userId, id, data, old) => {
    await updateBankAccount(userId, id, data, old);
    const accounts = await getBankAccounts(userId);
    set({ accounts });
  },

  removeAccount: async (userId, id) => {
    await deleteBankAccount(userId, id);
    set((s) => ({
      accounts:            s.accounts.filter((a) => a.id !== id),
      accountsWithBalance: s.accountsWithBalance.filter((a) => a.id !== id),
    }));
  },

  resolveShortfall: async (userId, accountId, incomeId, amount, expenseId) => {
    await resolveAccountShortfalls(userId, accountId, incomeId, amount, "manual", expenseId);
    await get().fetchShortfallData(userId);
  },

  recomputeAccount: async (userId, accountId, incomeIds) => {
    const result = await reconcileAccount(userId, accountId, incomeIds);
    await get().fetchShortfallData(userId);
    return result;
  },
}));

// Re-exported for direct use by the Shortfalls panel UI without a round-trip
// through the store (keeps the panel's own loading state independent).
export { getOutstandingShortfalls };
