"use client";
import { useEffect } from "react";
import { useAuthStore } from "@/stores/auth.store";
import { onAuthChange } from "@/lib/firebase/auth";

export function useAuth() {
  const { user, loading, setUser, setLoading } = useAuthStore();

  useEffect(() => {
    const unsubscribe = onAuthChange((u) => {
      setUser(u);
      setLoading(false);
    });
    return unsubscribe;
  }, [setUser, setLoading]);

  return { user, loading, isAuthenticated: !!user };
}
