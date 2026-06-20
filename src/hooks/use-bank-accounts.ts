"use client";
import { useEffect } from "react";
import { useAuthStore }        from "@/stores/auth.store";
import { useBankAccountStore } from "@/stores/bank-account.store";
import { useIncomeStore }      from "@/stores/income.store";

/**
 * Hook for consuming the bank accounts store.
 * - Fetches accounts when user is available (once per session).
 * - Keeps accountsWithBalance in sync whenever income balances change.
 */
export function useBankAccounts() {
  const { user }   = useAuthStore();
  const store      = useBankAccountStore();
  const { incomes } = useIncomeStore();

  // Fetch account list when user loads
  useEffect(() => {
    if (user && store.accounts.length === 0 && !store.loading) {
      store.fetchAccounts(user.uid);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  // Refresh computed balances whenever income balances change
  useEffect(() => {
    if (store.accounts.length > 0 && incomes.length > 0) {
      store.refreshBalances(incomes);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [incomes, store.accounts]);

  return store;
}
