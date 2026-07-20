import {
  collection, addDoc, updateDoc, deleteDoc, doc, getDocs,
  query, orderBy, serverTimestamp, getDoc,
} from "firebase/firestore";
import { db } from "@/lib/firebase/config";
import { COLLECTIONS } from "@/lib/firebase/db";
import { Expense, ExpenseFormData, ExpenseFilters } from "@/types";
import { createLedgerEntry } from "./ledger.service";
import { logAudit } from "./audit.service";
import { clearAutoAllocationsForExpense } from "./attribution.service";
import { debitIncomeWithShortfall } from "./shortfall.service";
import { getBankAccount } from "./bank-account.service";

export async function getExpenses(userId: string, filters?: ExpenseFilters): Promise<Expense[]> {
  const q = query(collection(db, COLLECTIONS.EXPENSES(userId)), orderBy("createdAt", "desc"));
  const snap = await getDocs(q);
  let expenses = snap.docs.map((d) => ({ id: d.id, ...d.data() } as Expense));

  if (filters?.incomeSourceId) {
    expenses = expenses.filter((e) => e.incomeSourceId === filters.incomeSourceId);
  }
  if (filters?.spentById) {
    expenses = expenses.filter((e) => e.spentById === filters.spentById);
  }
  if (filters?.expenseTypeId) {
    expenses = expenses.filter((e) => e.expenseTypeId === filters.expenseTypeId);
  }
  if (filters?.tagIds?.length) {
    expenses = expenses.filter((e) => filters.tagIds!.some((t) => e.tagIds.includes(t)));
  }
  if (filters?.minAmount !== undefined) {
    expenses = expenses.filter((e) => e.amount >= filters.minAmount!);
  }
  if (filters?.maxAmount !== undefined) {
    expenses = expenses.filter((e) => e.amount <= filters.maxAmount!);
  }
  if (filters?.startDate) {
    expenses = expenses.filter((e) => e.createdAt.toDate() >= filters.startDate!);
  }
  if (filters?.endDate) {
    expenses = expenses.filter((e) => e.createdAt.toDate() <= filters.endDate!);
  }
  if (filters?.search) {
    const s = filters.search.toLowerCase();
    expenses = expenses.filter((e) =>
      e.reason.toLowerCase().includes(s) || e.notes?.toLowerCase().includes(s)
    );
  }
  return expenses;
}

export async function getExpense(userId: string, id: string): Promise<Expense | null> {
  const snap = await getDoc(doc(db, COLLECTIONS.EXPENSES(userId), id));
  if (!snap.exists()) return null;
  return { id: snap.id, ...snap.data() } as Expense;
}

/**
 * Currency safety guard (#2/#10): if an expense specifies BOTH an accountId and a
 * currencyCode, the two must match. This is defense-in-depth — the expense FORM
 * already locks the currency field to the selected account visually, but this
 * guard ensures NO code path (including direct service calls, future UI surfaces,
 * or stale form state) can ever save a cross-currency mismatch.
 * Throws a clear, user-facing error instead of silently saving bad data.
 */
async function assertCurrencyMatchesAccount(
  userId: string, accountId: string | undefined, currencyCode: string | undefined
): Promise<void> {
  if (!accountId || !currencyCode) return; // nothing to check
  const account = await getBankAccount(userId, accountId);
  if (account && account.currencyCode !== currencyCode) {
    await logAudit(userId, "BLOCKED_CURRENCY_MISMATCH", "expense", accountId, undefined, {
      accountCurrency: account.currencyCode,
      attemptedCurrency: currencyCode,
    });
    throw new Error(
      `Currency mismatch: cannot assign this transaction (${currencyCode}) to this account (${account.currencyCode}).`
    );
  }
}

export async function createExpense(userId: string, data: ExpenseFormData): Promise<string> {
  await assertCurrencyMatchesAccount(userId, data.accountId, data.currencyCode);

  const ref = await addDoc(collection(db, COLLECTIONS.EXPENSES(userId)), {
    ...data, userId, createdAt: serverTimestamp(), updatedAt: serverTimestamp(),
  });

  // FIX (#7): capped debit + account-level shortfall instead of an unconditional
  // full-amount debit. Income can never go negative from this path. Legacy
  // expenses with no accountId behave exactly as before (uncapped single debit).
  if (data.incomeSourceId) {
    await debitIncomeWithShortfall({
      userId,
      incomeSourceId:  data.incomeSourceId,
      accountId:       data.accountId,
      amount:          data.amount,
      expenseId:       ref.id,
      spentById:       data.spentById,
      transactionType: "EXPENSE_CREATED",
      description:     `Expense: ${data.reason}`,
      metadata:        { expenseTypeId: data.expenseTypeId },
    });
  }

  await logAudit(userId, "CREATE", "expense", ref.id, undefined, data);
  return ref.id;
}

export async function updateExpense(userId: string, id: string, data: Partial<ExpenseFormData>, oldData?: Expense): Promise<void> {
  await assertCurrencyMatchesAccount(
    userId,
    data.accountId ?? oldData?.accountId,
    data.currencyCode ?? oldData?.currencyCode
  );

  await updateDoc(doc(db, COLLECTIONS.EXPENSES(userId), id), { ...data, updatedAt: serverTimestamp() });

  if (data.amount !== undefined && oldData && data.amount !== oldData.amount) {
    const diff = data.amount - oldData.amount;
    if (diff > 0) {
      // Amount increased — use the same capped+shortfall path as creation
      await debitIncomeWithShortfall({
        userId,
        incomeSourceId:  oldData.incomeSourceId,
        accountId:       oldData.accountId,
        amount:          diff,
        expenseId:       id,
        spentById:       oldData.spentById,
        transactionType: "EXPENSE_UPDATED",
        description:     `Expense updated: ${data.reason || oldData.reason}`,
      });
    } else {
      // Amount decreased — a credit back can never cause a negative balance,
      // so this stays a simple, uncapped ledger entry exactly as before.
      await createLedgerEntry({
        userId,
        transactionType: "EXPENSE_UPDATED",
        incomeSourceId:  oldData.incomeSourceId,
        expenseId:       id,
        accountId:       oldData.accountId,
        amount:          Math.abs(diff),
        direction:       "CREDIT",
        description:     `Expense updated: ${data.reason || oldData.reason}`,
      });
    }

    // Re-run FIFO attribution after amount change — display-only, never blocks
    if (oldData.accountId) {
      try {
        await clearAutoAllocationsForExpense(userId, id);
      } catch {
        // Attribution errors must never block the main operation
      }
    }
  }
  await logAudit(userId, "UPDATE", "expense", id, oldData, data);
}

export async function deleteExpense(userId: string, id: string, expense: Expense): Promise<void> {
  // FIX: system-generated shortfall-adjustment expenses must never be deleted —
  // they represent real financial adjustments. The user can only reassign them
  // to another income in the same account. This mirrors the requirement:
  // "never delete it — they can only reassign to other income in that same bank."
  if (expense.isSystemGenerated) {
    throw new Error(
      "This expense was automatically created by the system to record a shortfall adjustment. " +
      "It cannot be deleted — use \"Reassign\" to move it to a different income source instead."
    );
  }

  await deleteDoc(doc(db, COLLECTIONS.EXPENSES(userId), id));
  // Reversal is always a CREDIT — can never push a balance negative, so this
  // stays a simple uncapped entry exactly as before.
  await createLedgerEntry({
    userId,
    transactionType: "EXPENSE_DELETED",
    incomeSourceId:  expense.incomeSourceId,
    expenseId:       id,
    accountId:       expense.accountId,
    amount:          expense.amount,
    direction:       "CREDIT",
    description:     `Expense deleted: ${expense.reason}`,
  });
  // Clean up attribution records — never block on this
  try {
    await clearAutoAllocationsForExpense(userId, id);
  } catch {
    // Swallow — allocation cleanup is non-critical
  }
  await logAudit(userId, "DELETE", "expense", id, expense);
}

export async function createRefund(userId: string, expense: Expense, amount: number, reason: string): Promise<void> {
  // Refund is always a CREDIT — never causes a negative balance.
  await createLedgerEntry({
    userId,
    transactionType: "REFUND",
    incomeSourceId:  expense.incomeSourceId,
    expenseId:       expense.id,
    accountId:       expense.accountId,
    amount,
    direction:       "CREDIT",
    description:     `Refund: ${reason}`,
    metadata:        { originalExpenseId: expense.id, reason },
  });
  await logAudit(userId, "REFUND", "expense", expense.id, undefined, { amount, reason });
}

export async function reassignExpense(
  userId: string,
  expense: Expense,
  newIncomeSourceId: string
): Promise<void> {
  await updateDoc(doc(db, COLLECTIONS.EXPENSES(userId), expense.id), {
    incomeSourceId: newIncomeSourceId,
    updatedAt: serverTimestamp(),
  });

  // Credit the old income back — always safe, never causes a negative balance.
  await createLedgerEntry({
    userId,
    transactionType: "EXPENSE_REASSIGNED",
    incomeSourceId:  expense.incomeSourceId,
    expenseId:       expense.id,
    accountId:       expense.accountId,
    amount:          expense.amount,
    direction:       "CREDIT",
    description:     `Expense reassigned from source`,
    metadata:        { fromIncomeId: expense.incomeSourceId, toIncomeId: newIncomeSourceId },
  });

  // FIX (#7): debit the new income with the same capped+shortfall protection —
  // reassigning to an income with insufficient balance can no longer push it negative.
  await debitIncomeWithShortfall({
    userId,
    incomeSourceId:  newIncomeSourceId,
    accountId:       expense.accountId,
    amount:          expense.amount,
    expenseId:       expense.id,
    spentById:       expense.spentById,
    transactionType: "EXPENSE_REASSIGNED",
    description:     `Expense reassigned to source`,
    metadata:        { fromIncomeId: expense.incomeSourceId, toIncomeId: newIncomeSourceId },
  });

  await logAudit(userId, "REASSIGN", "expense", expense.id, expense, { newIncomeSourceId });
}
