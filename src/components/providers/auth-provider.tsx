"use client";
import { useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import { useAuthStore } from "@/stores/auth.store";
import { useSettingsStore } from "@/stores/settings.store";
import { useExpenseTypeStore } from "@/stores/expense-type.store";
import { useIncomeSourceTypeStore } from "@/stores/income-source-type.store";
import { onAuthChange } from "@/lib/firebase/auth";

// Redirect authenticated users AWAY from these (login / register pages)
const AUTH_ONLY_ROUTES = ["/login", "/register", "/reset-password"];

// FIX: accessible to EVERYONE regardless of auth state.
// /devhub was previously in PUBLIC_ROUTES which ALSO caused authenticated
// users to be redirected to /dashboard when they visited it — same as
// visiting /login while already logged in. Now it's in a separate list
// that is never subject to the "logged-in → dashboard" redirect.
const ALWAYS_PUBLIC_ROUTES = ["/devhub"];

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
        try {
          await Promise.all([
            fetchSettings(user.uid),
            fetchExpenseTypes(user.uid),
            fetchSourceTypes(user.uid),
          ]);
          await Promise.all([
            seedExpenseTypes(user.uid),
            seedSourceTypes(user.uid),
          ]);
        } catch (err) {
          console.error("Post-login setup error:", err);
        }

        // Only bounce logged-in users away from login/register pages.
        // /devhub (and any other ALWAYS_PUBLIC_ROUTES) stay accessible
        // even when authenticated.
        if (AUTH_ONLY_ROUTES.some((r) => pathname.startsWith(r))) {
          router.replace("/dashboard");
        }
      } else {
        // Unauthenticated: redirect to login unless on a public page
        const isPublic =
          AUTH_ONLY_ROUTES.some((r) => pathname.startsWith(r)) ||
          ALWAYS_PUBLIC_ROUTES.some((r) => pathname.startsWith(r));
        if (!isPublic) {
          router.replace("/login");
        }
      }
    });
    return unsub;
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return <>{children}</>;
}
