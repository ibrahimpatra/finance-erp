import { create } from "zustand";
import { Currency, CurrencyFormData } from "@/types";
import { getCurrencies, createCurrency, updateCurrency, deleteCurrency } from "@/services/currency.service";

interface CurrencyStore {
  currencies: Currency[];
  loading: boolean;
  fetchCurrencies: (userId: string) => Promise<void>;
  addCurrency: (userId: string, data: CurrencyFormData) => Promise<string>;
  editCurrency: (userId: string, id: string, data: Partial<CurrencyFormData>) => Promise<void>;
  removeCurrency: (userId: string, id: string) => Promise<void>;
}

export const useCurrencyStore = create<CurrencyStore>((set, get) => ({
  currencies: [],
  loading: false,
  fetchCurrencies: async (userId) => {
    set({ loading: true });
    try {
      const currencies = await getCurrencies(userId);
      set({ currencies, loading: false });
    } catch {
      set({ loading: false });
    }
  },
  addCurrency: async (userId, data) => {
    const id = await createCurrency(userId, data);
    await get().fetchCurrencies(userId);
    return id;
  },
  editCurrency: async (userId, id, data) => {
    await updateCurrency(userId, id, data);
    await get().fetchCurrencies(userId);
  },
  removeCurrency: async (userId, id) => {
    await deleteCurrency(userId, id);
    await get().fetchCurrencies(userId);
  },
}));
