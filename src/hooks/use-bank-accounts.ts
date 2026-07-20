"use client";
import { useEffect } from "react";
import { useAuthStore }        from "@/stores/auth.store";
import { useBankAccountStore } from "@/stores/bank-account.store";
import { useIncomeStore }      from "@/stores/income.store";

/**
 * Hook for consuming the bank accounts store.
 * - Fetches accounts when user is available (once per session).
 * - Fetches shortfall/opening-balance data alongside accounts.
 * - Keeps accountsWithBalance in sync whenever income balances change.
 */
export function useBankAccounts() {
  const { user }   = useAuthStore();
  const store      = useBankAccountStore();
  const { incomes } = useIncomeStore();

  // Fetch account list when user loads
  useEffect(() => {
    // FIX (Phase 2): added "!store.error" — if a fetch already failed, don't
    // keep retrying on every unrelated re-render. A fresh attempt only
    // happens on a real user-triggered action (page reload, explicit retry).
    if (user && store.accounts.length === 0 && !store.loading && !store.error) {
      store.fetchAccounts(user.uid);
      store.fetchShortfallData(user.uid);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, store.error]);

  // Refresh computed balances whenever income balances OR shortfall data changes.
  // FIX: removed "incomes.length > 0" condition — a user with no incomes yet
  // still has accounts that should render (with 0 balance). The old guard meant
  // a new user who created an account but hadn't added any income would see
  // "No bank accounts yet" even though their account existed in Firestore.
  useEffect(() => {
    if (store.accounts.length > 0) {
      store.refreshBalances(incomes); // handles empty incomes array gracefully
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [incomes, store.accounts, store.shortfallsByAccount, store.openingBalanceByAccount]);

  return store;
}
