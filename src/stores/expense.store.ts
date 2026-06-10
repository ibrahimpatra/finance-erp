import { create } from "zustand";
import { Expense, ExpenseFormData, ExpenseFilters } from "@/types";
import { getExpenses, createExpense, updateExpense, deleteExpense, createRefund, reassignExpense } from "@/services/expense.service";

interface ExpenseStore {
  expenses: Expense[];
  loading: boolean;
  error: string | null;
  filters: ExpenseFilters;
  fetchExpenses: (userId: string, filters?: ExpenseFilters) => Promise<void>;
  addExpense: (userId: string, data: ExpenseFormData) => Promise<string>;
  editExpense: (userId: string, id: string, data: Partial<ExpenseFormData>, old?: Expense) => Promise<void>;
  removeExpense: (userId: string, id: string, expense: Expense) => Promise<void>;
  refundExpense: (userId: string, expense: Expense, amount: number, reason: string) => Promise<void>;
  reassign: (userId: string, expense: Expense, newIncomeId: string) => Promise<void>;
  setFilters: (filters: ExpenseFilters) => void;
}

export const useExpenseStore = create<ExpenseStore>((set, get) => ({
  expenses: [],
  loading: false,
  error: null,
  filters: {},
  fetchExpenses: async (userId, filters) => {
    set({ loading: true, error: null });
    try {
      const f = filters ?? get().filters;
      const expenses = await getExpenses(userId, f);
      set({ expenses, loading: false });
    } catch (e: unknown) {
      set({ error: (e as Error).message, loading: false });
    }
  },
  addExpense: async (userId, data) => {
    const id = await createExpense(userId, data);
    await get().fetchExpenses(userId);
    return id;
  },
  editExpense: async (userId, id, data, old) => {
    await updateExpense(userId, id, data, old);
    await get().fetchExpenses(userId);
  },
  removeExpense: async (userId, id, expense) => {
    await deleteExpense(userId, id, expense);
    await get().fetchExpenses(userId);
  },
  refundExpense: async (userId, expense, amount, reason) => {
    await createRefund(userId, expense, amount, reason);
  },
  reassign: async (userId, expense, newIncomeId) => {
    await reassignExpense(userId, expense, newIncomeId);
    await get().fetchExpenses(userId);
  },
  setFilters: (filters) => set({ filters }),
}));
