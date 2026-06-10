import { create } from "zustand";
import { Tag, TagFormData } from "@/types";
import { getTags, createTag, updateTag, deleteTag } from "@/services/tag.service";

interface TagStore {
  tags: Tag[];
  loading: boolean;
  fetchTags: (userId: string) => Promise<void>;
  addTag: (userId: string, data: TagFormData) => Promise<string>;
  editTag: (userId: string, id: string, data: Partial<TagFormData>, old?: Tag) => Promise<void>;
  removeTag: (userId: string, id: string) => Promise<void>;
}

export const useTagStore = create<TagStore>((set, get) => ({
  tags: [],
  loading: false,
  fetchTags: async (userId) => {
    set({ loading: true });
    const tags = await getTags(userId);
    set({ tags, loading: false });
  },
  addTag: async (userId, data) => {
    const id = await createTag(userId, data);
    await get().fetchTags(userId);
    return id;
  },
  editTag: async (userId, id, data, old) => {
    await updateTag(userId, id, data, old);
    await get().fetchTags(userId);
  },
  removeTag: async (userId, id) => {
    await deleteTag(userId, id);
    await get().fetchTags(userId);
  },
}));
