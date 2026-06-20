"use client";
import { create } from "zustand";
import { BankAccount, BankAccountFormData, BankAccountWithBalance, IncomeWithBalance } from "@/types";
import {
  getBankAccounts, createBankAccount, updateBankAccount,
  deleteBankAccount, getBankAccountsWithBalances,
  computeAccountWithBalance,
} from "@/services/bank-account.service";

interface BankAccountStore {
  accounts:           BankAccount[];
  accountsWithBalance: BankAccountWithBalance[];
  loading:            boolean;

  fetchAccounts:      (userId: string) => Promise<void>;
  refreshBalances:    (incomesWithBalance: IncomeWithBalance[]) => void;
  addAccount:         (userId: string, data: BankAccountFormData) => Promise<string>;
  editAccount:        (userId: string, id: string, data: Partial<BankAccountFormData>, old?: BankAccount) => Promise<void>;
  removeAccount:      (userId: string, id: string) => Promise<void>;
}

export const useBankAccountStore = create<BankAccountStore>((set, get) => ({
  accounts:            [],
  accountsWithBalance: [],
  loading:             false,

  fetchAccounts: async (userId) => {
    set({ loading: true });
    try {
      const accounts = await getBankAccounts(userId);
      set({ accounts, loading: false });
    } catch {
      set({ loading: false });
    }
  },

  /** Call this whenever income balances change so account balances stay in sync. */
  refreshBalances: (incomesWithBalance) => {
    const { accounts } = get();
    const accountsWithBalance = accounts.map((a) =>
      computeAccountWithBalance(a, incomesWithBalance)
    );
    set({ accountsWithBalance });
  },

  addAccount: async (userId, data) => {
    const id = await createBankAccount(userId, data);
    const accounts = await getBankAccounts(userId);
    set({ accounts });
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
}));
