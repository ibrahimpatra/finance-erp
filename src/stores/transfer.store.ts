import { create } from "zustand";
import { Transfer, TransferFormData } from "@/types";
import { getTransfers, createTransfer } from "@/services/transfer.service";

interface TransferStore {
  transfers: Transfer[];
  loading: boolean;
  fetchTransfers: (userId: string) => Promise<void>;
  addTransfer: (userId: string, data: TransferFormData) => Promise<string>;
}

export const useTransferStore = create<TransferStore>((set, get) => ({
  transfers: [],
  loading: false,
  fetchTransfers: async (userId) => {
    set({ loading: true });
    const transfers = await getTransfers(userId);
    set({ transfers, loading: false });
  },
  addTransfer: async (userId, data) => {
    const id = await createTransfer(userId, data);
    await get().fetchTransfers(userId);
    return id;
  },
}));
