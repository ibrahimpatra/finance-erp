"use client";
import { useEffect } from "react";
import { useTagStore } from "@/stores/tag.store";
import { useAuthStore } from "@/stores/auth.store";

export function useTags() {
  const { user } = useAuthStore();
  const store = useTagStore();
  useEffect(() => {
    if (user?.uid) store.fetchTags(user.uid);
  }, [user?.uid]);
  return store;
}
