import {
  collection, addDoc, updateDoc, deleteDoc, doc, getDocs,
  query, orderBy, serverTimestamp, where, getDoc,
} from "firebase/firestore";
import { db } from "@/lib/firebase/config";
import { COLLECTIONS } from "@/lib/firebase/db";
import { Income, IncomeFormData, IncomeWithBalance } from "@/types";
import { createLedgerEntry, getLedgerForIncome, calculateBalanceFromLedger,
  calculateTotalCredits, calculateTotalDebits } from "./ledger.service";
import { logAudit } from "./audit.service";

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

export async function createIncome(userId: string, data: IncomeFormData): Promise<string> {
  const ref = await addDoc(collection(db, COLLECTIONS.INCOMES(userId)), {
    ...data, userId, createdAt: serverTimestamp(), updatedAt: serverTimestamp(),
  });
  await createLedgerEntry({
    userId,
    transactionType: "INCOME_CREATED",
    incomeSourceId: ref.id,
    amount: data.amount,
    direction: "CREDIT",
    description: `Income created: ${data.name}`,
    metadata: { source: data.source },
  });
  await logAudit(userId, "CREATE", "income", ref.id, undefined, data);
  return ref.id;
}

export async function updateIncome(userId: string, id: string, data: Partial<IncomeFormData>, oldData?: Income): Promise<void> {
  await updateDoc(doc(db, COLLECTIONS.INCOMES(userId), id), { ...data, updatedAt: serverTimestamp() });
  if (data.amount !== undefined && oldData && data.amount !== oldData.amount) {
    const diff = data.amount - oldData.amount;
    await createLedgerEntry({
      userId,
      transactionType: "INCOME_ADJUSTMENT",
      incomeSourceId: id,
      amount: Math.abs(diff),
      direction: diff > 0 ? "CREDIT" : "DEBIT",
      description: `Income adjusted: ${diff > 0 ? "+" : ""}${diff}`,
    });
  }
  await logAudit(userId, "UPDATE", "income", id, oldData, data);
}

export async function deleteIncome(userId: string, id: string): Promise<void> {
  const expenses = await getDocs(query(
    collection(db, COLLECTIONS.EXPENSES(userId)),
    where("incomeSourceId", "==", id)
  ));
  if (!expenses.empty) {
    throw new Error("Cannot delete income with linked expenses. Reassign expenses first.");
  }
  await deleteDoc(doc(db, COLLECTIONS.INCOMES(userId), id));
  await logAudit(userId, "DELETE", "income", id);
}

export async function getIncomesWithBalances(userId: string): Promise<IncomeWithBalance[]> {
  const incomes = await getIncomes(userId);
  return Promise.all(incomes.map(async (income) => {
    try {
      const ledger = await getLedgerForIncome(userId, income.id);
      const totalCredits = calculateTotalCredits(ledger);
      const totalDebits = calculateTotalDebits(ledger);
      const balance = calculateBalanceFromLedger(ledger);
      const totalExpenses = ledger
        .filter((e) => e.direction === "DEBIT" && e.transactionType === "EXPENSE_CREATED")
        .reduce((a, e) => a + e.amount, 0);
      const percentageUsed = totalCredits > 0 ? Math.min(100, Math.round((totalDebits / totalCredits) * 100)) : 0;
      return { ...income, balance, totalExpenses, totalCredits, totalDebits, percentageUsed };
    } catch {
      // Fallback: if ledger fetch fails, use income amount as balance
      return { ...income, balance: income.amount, totalExpenses: 0, totalCredits: income.amount, totalDebits: 0, percentageUsed: 0 };
    }
  }));
}
