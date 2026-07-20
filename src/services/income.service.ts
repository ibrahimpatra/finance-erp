import {
  collection, addDoc, updateDoc, deleteDoc, doc, getDocs,
  query, orderBy, serverTimestamp, where, getDoc,
} from "firebase/firestore";
import { db } from "@/lib/firebase/config";
import { COLLECTIONS } from "@/lib/firebase/db";
import { Income, IncomeFormData, IncomeWithBalance } from "@/types";
import {
  createLedgerEntry, getAllLedgerEntries,
  calculateBalanceFromLedger, calculateTotalCredits, calculateTotalDebits,
} from "./ledger.service";
import { logAudit } from "./audit.service";
import { resolveAccountShortfalls } from "./shortfall.service";
import { getBankAccount } from "./bank-account.service";

export async function getIncomes(userId: string): Promise<Income[]> {
  const q = query(collection(db, COLLECTIONS.INCOMES(userId)), orderBy("createdAt", "desc"));
  const snap = await getDocs(q);
  return snap.docs.map((d) => ({ id: d.id, ...d.data() } as Income));
}

export async function getIncome(userId: string, id: string): Promise<Income | null> {
  const snap = await getDoc(doc(db, COLLECTIONS.INCOMES(userId), id));
  if (!snap.exists()) return null;
  return { id: snap.id, ...snap.data() } as Income;
}

/**
 * Currency safety guard (#2/#10): if an income specifies BOTH an accountId and a
 * currencyCode, the two must match. Same defense-in-depth pattern as expenses.
 */
async function assertCurrencyMatchesAccount(
  userId: string, accountId: string | undefined, currencyCode: string | undefined
): Promise<void> {
  if (!accountId || !currencyCode) return;
  const account = await getBankAccount(userId, accountId);
  if (account && account.currencyCode !== currencyCode) {
    await logAudit(userId, "BLOCKED_CURRENCY_MISMATCH", "income", accountId, undefined, {
      accountCurrency: account.currencyCode,
      attemptedCurrency: currencyCode,
    });
    throw new Error(
      `Currency mismatch: cannot assign this transaction (${currencyCode}) to this account (${account.currencyCode}).`
    );
  }
}

export async function createIncome(userId: string, data: IncomeFormData): Promise<string> {
  await assertCurrencyMatchesAccount(userId, data.accountId, data.currencyCode);

  const ref = await addDoc(collection(db, COLLECTIONS.INCOMES(userId)), {
    ...data, userId, createdAt: serverTimestamp(), updatedAt: serverTimestamp(),
  });
  await createLedgerEntry({
    userId,
    transactionType: "INCOME_CREATED",
    incomeSourceId:  ref.id,
    accountId:       data.accountId,
    amount:          data.amount,
    direction:       "CREDIT",
    description:     `Income created: ${data.name}`,
    metadata:        { source: data.source },
  });

  // FIX (#7): if this account has an outstanding shortfall from a prior
  // under-funded expense, automatically apply this new income to cover it
  // (oldest shortfall first, partial coverage if needed). This is what makes
  // "Income 1 → 0, account → -50, Income 2 added → shortfall auto-resolved,
  // Income 2 shows 150" work. Wrapped in try/catch: a shortfall-resolution
  // failure must NEVER block the income itself from being created.
  if (data.accountId) {
    try {
      await resolveAccountShortfalls(userId, data.accountId, ref.id, data.amount, "auto");
    } catch {
      // Non-critical — the income is already saved; reconciliation can catch up later
    }
  }

  await logAudit(userId, "CREATE", "income", ref.id, undefined, data);
  return ref.id;
}

export async function updateIncome(
  userId: string, id: string, data: Partial<IncomeFormData>, oldData?: Income
): Promise<void> {
  // FIX: currency guard was missing from updateIncome. An existing income
  // with no accountId (or a different accountId) could be freely linked to
  // an account with a mismatched currency by simply editing it. The guard
  // now fires on any edit that sets or changes accountId, using the
  // incoming currencyCode (or the existing one as fallback).
  await assertCurrencyMatchesAccount(
    userId,
    data.accountId ?? oldData?.accountId,
    data.currencyCode ?? oldData?.currencyCode
  );

  await updateDoc(doc(db, COLLECTIONS.INCOMES(userId), id), { ...data, updatedAt: serverTimestamp() });

  if (data.amount !== undefined && oldData && data.amount !== oldData.amount) {
    const diff = data.amount - oldData.amount;
    await createLedgerEntry({
      userId,
      transactionType: "INCOME_ADJUSTMENT",
      incomeSourceId:  id,
      accountId:       oldData.accountId, // FIX: carry forward the accountId so account balance stays accurate
      amount:          Math.abs(diff),
      direction:       diff > 0 ? "CREDIT" : "DEBIT",
      description:     `Income adjusted: ${diff > 0 ? "+" : ""}${diff}`,
    });
  }
  await logAudit(userId, "UPDATE", "income", id, oldData, data);
}

export async function deleteIncome(userId: string, id: string): Promise<void> {
  // Guard: linked expenses must be reassigned first
  const linkedExpenses = await getDocs(
    query(collection(db, COLLECTIONS.EXPENSES(userId)), where("incomeSourceId", "==", id))
  );
  if (!linkedExpenses.empty) {
    throw new Error(
      `Cannot delete: ${linkedExpenses.size} expense${linkedExpenses.size !== 1 ? "s are" : " is"} linked to this income source. Reassign them first.`
    );
  }

  // FIX: Guard transfers — previously missing, leaving transfer records orphaned
  const linkedFromTransfers = await getDocs(
    query(collection(db, COLLECTIONS.TRANSFERS(userId)), where("fromIncomeId", "==", id))
  );
  if (!linkedFromTransfers.empty) {
    throw new Error(
      `Cannot delete: ${linkedFromTransfers.size} outgoing transfer${linkedFromTransfers.size !== 1 ? "s reference" : " references"} this income source. Remove or reassign them first.`
    );
  }
  const linkedToTransfers = await getDocs(
    query(collection(db, COLLECTIONS.TRANSFERS(userId)), where("toIncomeId", "==", id))
  );
  if (!linkedToTransfers.empty) {
    throw new Error(
      `Cannot delete: ${linkedToTransfers.size} incoming transfer${linkedToTransfers.size !== 1 ? "s reference" : " references"} this income source. Remove or reassign them first.`
    );
  }

  await deleteDoc(doc(db, COLLECTIONS.INCOMES(userId), id));
  await logAudit(userId, "DELETE", "income", id);
}

/**
 * FIX: Previously made N separate Firestore reads (one per income).
 * Now fetches ALL ledger entries in one read and groups them client-side.
 * For a user with 20 income sources, this reduces 20 reads → 1 read.
 */
export async function getIncomesWithBalances(userId: string): Promise<IncomeWithBalance[]> {
  const [incomes, allLedger] = await Promise.all([
    getIncomes(userId),
    getAllLedgerEntries(userId),
  ]);

  // Group ledger entries by incomeSourceId for O(1) lookups
  const ledgerByIncome = new Map<string, typeof allLedger>();
  for (const entry of allLedger) {
    if (!entry.incomeSourceId) continue;
    const bucket = ledgerByIncome.get(entry.incomeSourceId) ?? [];
    bucket.push(entry);
    ledgerByIncome.set(entry.incomeSourceId, bucket);
  }

  return incomes.map((income) => {
    try {
      const ledger       = ledgerByIncome.get(income.id) ?? [];
      const totalCredits = calculateTotalCredits(ledger);
      const totalDebits  = calculateTotalDebits(ledger);
      const balance      = calculateBalanceFromLedger(ledger);
      const totalExpenses = ledger
        .filter((e) => e.direction === "DEBIT" && e.transactionType === "EXPENSE_CREATED")
        .reduce((a, e) => a + e.amount, 0);
      const percentageUsed = totalCredits > 0
        ? Math.min(100, Math.round((totalDebits / totalCredits) * 100))
        : 0;
      return { ...income, balance, totalExpenses, totalCredits, totalDebits, percentageUsed };
    } catch {
      return { ...income, balance: income.amount, totalExpenses: 0, totalCredits: income.amount, totalDebits: 0, percentageUsed: 0 };
    }
  });
}
