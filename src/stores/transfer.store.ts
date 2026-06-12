import { create } from "zustand";
import { Transfer, TransferFormData } from "@/types";
import { getTransfers, createTransfer } from "@/services/transfer.service";

interface TransferStore {
  transfers: Transfer[];
  loading: boolean;
  error: string | null;
  fetchTransfers: (userId: string) => Promise<void>;
  addTransfer: (userId: string, data: TransferFormData) => Promise<string>;
}

export const useTransferStore = create<TransferStore>((set) => ({
  transfers: [],
  loading: false,
  error: null,

  fetchTransfers: async (userId) => {
    set({ loading: true, error: null });
    try {
      const transfers = await getTransfers(userId);
      set({ transfers, loading: false });
    } catch (e: unknown) {
      set({ error: (e as Error).message, loading: false });
    }
  },

  addTransfer: async (userId, data) => {
    const id = await createTransfer(userId, data);
    // Refresh both transfers AND incomes so balances update immediately
    const [{ getTransfers: gt }, { getIncomesWithBalances }] = await Promise.all([
      import("@/services/transfer.service"),
      import("@/services/income.service"),
    ]);
    const [transfers, incomes] = await Promise.all([
      gt(userId),
      getIncomesWithBalances(userId),
    ]);
    // Dynamically get income store to avoid circular import at module level
    const { useIncomeStore } = await import("@/stores/income.store");
    useIncomeStore.setState({ incomes });
    set({ transfers });
    return id;
  },
}));
