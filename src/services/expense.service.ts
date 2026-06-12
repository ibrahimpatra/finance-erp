import {
  collection, addDoc, updateDoc, deleteDoc, doc, getDocs,
  query, orderBy, serverTimestamp, where, getDoc, writeBatch,
} from "firebase/firestore";
import { db } from "@/lib/firebase/config";
import { COLLECTIONS } from "@/lib/firebase/db";
import { Expense, ExpenseFormData, ExpenseFilters } from "@/types";
import { createLedgerEntry } from "./ledger.service";
import { logAudit } from "./audit.service";

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

export async function createExpense(userId: string, data: ExpenseFormData): Promise<string> {
  const ref = await addDoc(collection(db, COLLECTIONS.EXPENSES(userId)), {
    ...data, userId, createdAt: serverTimestamp(), updatedAt: serverTimestamp(),
  });
  await createLedgerEntry({
    userId,
    transactionType: "EXPENSE_CREATED",
    incomeSourceId: data.incomeSourceId,
    expenseId: ref.id,
    spentById: data.spentById,
    amount: data.amount,
    direction: "DEBIT",
    description: `Expense: ${data.reason}`,
    metadata: { expenseTypeId: data.expenseTypeId },
  });
  await logAudit(userId, "CREATE", "expense", ref.id, undefined, data);
  return ref.id;
}

export async function updateExpense(userId: string, id: string, data: Partial<ExpenseFormData>, oldData?: Expense): Promise<void> {
  await updateDoc(doc(db, COLLECTIONS.EXPENSES(userId), id), { ...data, updatedAt: serverTimestamp() });
  if (data.amount !== undefined && oldData && data.amount !== oldData.amount) {
    const diff = data.amount - oldData.amount;
    await createLedgerEntry({
      userId,
      transactionType: "EXPENSE_UPDATED",
      incomeSourceId: oldData.incomeSourceId,
      expenseId: id,
      amount: Math.abs(diff),
      direction: diff > 0 ? "DEBIT" : "CREDIT",
      description: `Expense updated: ${data.reason || oldData.reason}`,
    });
  }
  await logAudit(userId, "UPDATE", "expense", id, oldData, data);
}

export async function deleteExpense(userId: string, id: string, expense: Expense): Promise<void> {
  await deleteDoc(doc(db, COLLECTIONS.EXPENSES(userId), id));
  await createLedgerEntry({
    userId,
    transactionType: "EXPENSE_DELETED",
    incomeSourceId: expense.incomeSourceId,
    expenseId: id,
    amount: expense.amount,
    direction: "CREDIT",
    description: `Expense deleted: ${expense.reason}`,
  });
  await logAudit(userId, "DELETE", "expense", id, expense);
}

export async function createRefund(userId: string, expense: Expense, amount: number, reason: string): Promise<void> {
  await createLedgerEntry({
    userId,
    transactionType: "REFUND",
    incomeSourceId: expense.incomeSourceId,
    expenseId: expense.id,
    amount,
    direction: "CREDIT",
    description: `Refund: ${reason}`,
    metadata: { originalExpenseId: expense.id, reason },
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
  await createLedgerEntry({
    userId,
    transactionType: "EXPENSE_REASSIGNED",
    incomeSourceId: expense.incomeSourceId,
    expenseId: expense.id,
    amount: expense.amount,
    direction: "CREDIT",
    description: `Expense reassigned from source`,
    metadata: { fromIncomeId: expense.incomeSourceId, toIncomeId: newIncomeSourceId },
  });
  await createLedgerEntry({
    userId,
    transactionType: "EXPENSE_REASSIGNED",
    incomeSourceId: newIncomeSourceId,
    expenseId: expense.id,
    amount: expense.amount,
    direction: "DEBIT",
    description: `Expense reassigned to source`,
    metadata: { fromIncomeId: expense.incomeSourceId, toIncomeId: newIncomeSourceId },
  });
  await logAudit(userId, "REASSIGN", "expense", expense.id, expense, { newIncomeSourceId });
}
