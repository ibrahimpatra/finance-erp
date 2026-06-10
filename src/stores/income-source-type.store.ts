import { create } from "zustand";
import { IncomeSourceType, IncomeSourceTypeFormData } from "@/types";
import {
  getIncomeSourceTypes, createIncomeSourceType, updateIncomeSourceType,
  deleteIncomeSourceType, seedDefaultIncomeSourceTypes,
} from "@/services/income-source-type.service";

interface IncomeSourceTypeStore {
  sourceTypes: IncomeSourceType[];
  loading: boolean;
  fetchSourceTypes: (userId: string) => Promise<void>;
  addSourceType: (userId: string, data: IncomeSourceTypeFormData) => Promise<string>;
  editSourceType: (userId: string, id: string, data: Partial<IncomeSourceTypeFormData>) => Promise<void>;
  removeSourceType: (userId: string, id: string) => Promise<void>;
  seed: (userId: string) => Promise<void>;
}

export const useIncomeSourceTypeStore = create<IncomeSourceTypeStore>((set, get) => ({
  sourceTypes: [],
  loading: false,
  fetchSourceTypes: async (userId) => {
    set({ loading: true });
    const sourceTypes = await getIncomeSourceTypes(userId);
    set({ sourceTypes, loading: false });
  },
  addSourceType: async (userId, data) => {
    const id = await createIncomeSourceType(userId, data);
    await get().fetchSourceTypes(userId);
    return id;
  },
  editSourceType: async (userId, id, data) => {
    await updateIncomeSourceType(userId, id, data);
    await get().fetchSourceTypes(userId);
  },
  removeSourceType: async (userId, id) => {
    await deleteIncomeSourceType(userId, id);
    await get().fetchSourceTypes(userId);
  },
  seed: async (userId) => {
    await seedDefaultIncomeSourceTypes(userId);
    await get().fetchSourceTypes(userId);
  },
}));
