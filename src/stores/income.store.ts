import { create } from "zustand";
import { Income, IncomeFormData, IncomeWithBalance } from "@/types";
import { getIncomesWithBalances, createIncome, updateIncome, deleteIncome } from "@/services/income.service";

interface IncomeStore {
  incomes: IncomeWithBalance[];
  loading: boolean;
  error: string | null;
  fetchIncomes: (userId: string) => Promise<void>;
  addIncome: (userId: string, data: IncomeFormData) => Promise<string>;
  editIncome: (userId: string, id: string, data: Partial<IncomeFormData>, old?: Income) => Promise<void>;
  removeIncome: (userId: string, id: string) => Promise<void>;
}

export const useIncomeStore = create<IncomeStore>((set, get) => ({
  incomes: [],
  loading: false,
  error: null,
  fetchIncomes: async (userId) => {
    set({ loading: true, error: null });
    try {
      const incomes = await getIncomesWithBalances(userId);
      set({ incomes, loading: false });
    } catch (e: unknown) {
      set({ error: (e as Error).message, loading: false });
    }
  },
  addIncome: async (userId, data) => {
    const id = await createIncome(userId, data);
    await get().fetchIncomes(userId);
    return id;
  },
  editIncome: async (userId, id, data, old) => {
    await updateIncome(userId, id, data, old);
    await get().fetchIncomes(userId);
  },
  removeIncome: async (userId, id) => {
    await deleteIncome(userId, id);
    await get().fetchIncomes(userId);
  },
}));
