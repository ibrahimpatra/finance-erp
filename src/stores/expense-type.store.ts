import { create } from "zustand";
import { ExpenseType, ExpenseTypeFormData } from "@/types";
import { getExpenseTypes, createExpenseType, updateExpenseType, deleteExpenseType, seedDefaultExpenseTypes } from "@/services/expense-type.service";

interface ExpenseTypeStore {
  expenseTypes: ExpenseType[];
  loading: boolean;
  fetchExpenseTypes: (userId: string) => Promise<void>;
  addExpenseType: (userId: string, data: ExpenseTypeFormData) => Promise<string>;
  editExpenseType: (userId: string, id: string, data: Partial<ExpenseTypeFormData>) => Promise<void>;
  removeExpenseType: (userId: string, id: string) => Promise<void>;
  seed: (userId: string) => Promise<void>;
}

export const useExpenseTypeStore = create<ExpenseTypeStore>((set, get) => ({
  expenseTypes: [],
  loading: false,
  fetchExpenseTypes: async (userId) => {
    set({ loading: true });
    const expenseTypes = await getExpenseTypes(userId);
    set({ expenseTypes, loading: false });
  },
  addExpenseType: async (userId, data) => {
    const id = await createExpenseType(userId, data);
    await get().fetchExpenseTypes(userId);
    return id;
  },
  editExpenseType: async (userId, id, data) => {
    await updateExpenseType(userId, id, data);
    await get().fetchExpenseTypes(userId);
  },
  removeExpenseType: async (userId, id) => {
    await deleteExpenseType(userId, id);
    await get().fetchExpenseTypes(userId);
  },
  seed: async (userId) => {
    await seedDefaultExpenseTypes(userId);
    await get().fetchExpenseTypes(userId);
  },
}));
