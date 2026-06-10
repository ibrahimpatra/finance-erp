"use client";
import { useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import { useAuthStore } from "@/stores/auth.store";
import { useSettingsStore } from "@/stores/settings.store";
import { useExpenseTypeStore } from "@/stores/expense-type.store";
import { useIncomeSourceTypeStore } from "@/stores/income-source-type.store";
import { onAuthChange } from "@/lib/firebase/auth";

const PUBLIC_ROUTES = ["/login", "/register", "/reset-password"];

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const { setUser, setLoading } = useAuthStore();
  const { fetchSettings } = useSettingsStore();
  const { fetchExpenseTypes, seed: seedExpenseTypes } = useExpenseTypeStore();
  const { fetchSourceTypes, seed: seedSourceTypes } = useIncomeSourceTypeStore();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    const unsub = onAuthChange(async (user) => {
      setUser(user);
      setLoading(false);
      if (user) {
        await Promise.all([
          fetchSettings(user.uid),
          fetchExpenseTypes(user.uid),
          fetchSourceTypes(user.uid),
        ]);
        // Seed defaults if first login
        await Promise.all([
          seedExpenseTypes(user.uid),
          seedSourceTypes(user.uid),
        ]);
        if (PUBLIC_ROUTES.some((r) => pathname.startsWith(r))) {
          router.replace("/dashboard");
        }
      } else {
        if (!PUBLIC_ROUTES.some((r) => pathname.startsWith(r))) {
          router.replace("/login");
        }
      }
    });
    return unsub;
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return <>{children}</>;
}
