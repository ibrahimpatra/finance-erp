/**
 * Bank Account Service
 *
 * Account balance = sum of IncomeWithBalance.balance for all incomes where
 * income.accountId === account.id.
 *
 * This intentionally re-uses the existing ledger-based income balance so that:
 * - No ledger entries need to be modified or migrated
 * - Existing income balance display stays correct
 * - Backward compatibility is 100% guaranteed
 */
import {
  collection, addDoc, updateDoc, deleteDoc, doc,
  getDocs, getDoc, query, orderBy, serverTimestamp, where,
} from "firebase/firestore";
import { db } from "@/lib/firebase/config";
import { COLLECTIONS } from "@/lib/firebase/db";
import {
  BankAccount, BankAccountFormData, BankAccountWithBalance,
  IncomeWithBalance,
} from "@/types";
import { logAudit } from "./audit.service";

// ── CRUD ──────────────────────────────────────────────────────────

export async function getBankAccounts(userId: string): Promise<BankAccount[]> {
  const q = query(
    collection(db, COLLECTIONS.BANK_ACCOUNTS(userId)),
    orderBy("createdAt", "asc")
  );
  const snap = await getDocs(q);
  return snap.docs.map((d) => ({ id: d.id, ...d.data() } as BankAccount));
}

export async function getBankAccount(
  userId: string, id: string
): Promise<BankAccount | null> {
  const snap = await getDoc(doc(db, COLLECTIONS.BANK_ACCOUNTS(userId), id));
  if (!snap.exists()) return null;
  return { id: snap.id, ...snap.data() } as BankAccount;
}

export async function createBankAccount(
  userId: string, data: BankAccountFormData
): Promise<string> {
  const ref = await addDoc(collection(db, COLLECTIONS.BANK_ACCOUNTS(userId)), {
    ...data,
    userId,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });
  await logAudit(userId, "CREATE", "bankAccount", ref.id, undefined, data);
  return ref.id;
}

export async function updateBankAccount(
  userId: string,
  id: string,
  data: Partial<BankAccountFormData>,
  oldData?: BankAccount
): Promise<void> {
  // SAFETY: never allow currency to be changed after creation
  const { currencyCode: _dropped, ...safeData } = data;
  await updateDoc(doc(db, COLLECTIONS.BANK_ACCOUNTS(userId), id), {
    ...safeData,
    updatedAt: serverTimestamp(),
  });
  await logAudit(userId, "UPDATE", "bankAccount", id, oldData, safeData);
}

export async function deleteBankAccount(
  userId: string, id: string
): Promise<void> {
  // Guard: cannot delete if incomes are still linked
  const linkedIncomes = await getDocs(
    query(
      collection(db, COLLECTIONS.INCOMES(userId)),
      where("accountId", "==", id)
    )
  );
  if (!linkedIncomes.empty) {
    throw new Error(
      `Cannot delete: ${linkedIncomes.size} income ${linkedIncomes.size === 1 ? "entry is" : "entries are"} still linked to this account. Reassign them first.`
    );
  }
  const linkedExpenses = await getDocs(
    query(
      collection(db, COLLECTIONS.EXPENSES(userId)),
      where("accountId", "==", id)
    )
  );
  if (!linkedExpenses.empty) {
    throw new Error(
      `Cannot delete: ${linkedExpenses.size} expense${linkedExpenses.size === 1 ? " is" : "s are"} still linked to this account. Reassign them first.`
    );
  }
  await deleteDoc(doc(db, COLLECTIONS.BANK_ACCOUNTS(userId), id));
  await logAudit(userId, "DELETE", "bankAccount", id, undefined, undefined);
}

// ── Balance computation ────────────────────────────────────────────

/**
 * Enrich a BankAccount with computed balance stats derived from its linked incomes.
 *
 * Balance = sum(income.balance) for incomes where income.accountId === account.id
 *
 * income.balance is itself computed from ledger entries (CREDIT - DEBIT per income),
 * so this inherits all ledger accuracy without touching the ledger directly.
 */
export function computeAccountWithBalance(
  account: BankAccount,
  incomesWithBalance: IncomeWithBalance[]
): BankAccountWithBalance {
  const linked = incomesWithBalance.filter((i) => i.accountId === account.id);

  const totalIncome   = linked.reduce((s, i) => s + i.totalCredits, 0);
  // FIX: was i.totalDebits — that includes transfer amounts, inflating "total spent".
  // i.totalExpenses is computed in income.service from EXPENSE_CREATED debits only.
  const totalExpenses = linked.reduce((s, i) => s + i.totalExpenses, 0);
  const balance       = linked.reduce((s, i) => s + i.balance, 0);

  const attributionRate = totalIncome > 0
    ? Math.min(100, Math.round((totalExpenses / totalIncome) * 100))
    : 0;

  return {
    ...account,
    balance,
    totalIncome,
    totalExpenses,
    // FIX: was counting income sources with any debits (wrong metric entirely).
    // Now counts the actual number of income entries linked to this account.
    incomeCount:     linked.length,
    expenseCount:    0,   // not computable here without expense data; not displayed in UI
    attributionRate,
  };
}

export async function getBankAccountsWithBalances(
  userId: string,
  incomesWithBalance: IncomeWithBalance[]
): Promise<BankAccountWithBalance[]> {
  const accounts = await getBankAccounts(userId);
  return accounts.map((a) => computeAccountWithBalance(a, incomesWithBalance));
}
