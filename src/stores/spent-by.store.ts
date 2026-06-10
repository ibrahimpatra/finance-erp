import { create } from "zustand";
import { SpentBy, SpentByFormData } from "@/types";
import { getSpentBys, createSpentBy, updateSpentBy, deleteSpentBy } from "@/services/spent-by.service";

interface SpentByStore {
  spentBys: SpentBy[];
  loading: boolean;
  fetchSpentBys: (userId: string) => Promise<void>;
  addSpentBy: (userId: string, data: SpentByFormData) => Promise<string>;
  editSpentBy: (userId: string, id: string, data: Partial<SpentByFormData>, old?: SpentBy) => Promise<void>;
  removeSpentBy: (userId: string, id: string) => Promise<void>;
}

export const useSpentByStore = create<SpentByStore>((set, get) => ({
  spentBys: [],
  loading: false,
  fetchSpentBys: async (userId) => {
    set({ loading: true });
    const spentBys = await getSpentBys(userId);
    set({ spentBys, loading: false });
  },
  addSpentBy: async (userId, data) => {
    const id = await createSpentBy(userId, data);
    await get().fetchSpentBys(userId);
    return id;
  },
  editSpentBy: async (userId, id, data, old) => {
    await updateSpentBy(userId, id, data, old);
    await get().fetchSpentBys(userId);
  },
  removeSpentBy: async (userId, id) => {
    await deleteSpentBy(userId, id);
    await get().fetchSpentBys(userId);
  },
}));
