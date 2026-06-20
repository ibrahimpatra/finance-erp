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
    incomeSourceId:  ref.id,
    accountId:       data.accountId,
    amount:          data.amount,
    direction:       "CREDIT",
    description:     `Income created: ${data.name}`,
    metadata:        { source: data.source },
  });
  await logAudit(userId, "CREATE", "income", ref.id, undefined, data);
  return ref.id;
}

export async function updateIncome(
  userId: string, id: string, data: Partial<IncomeFormData>, oldData?: Income
): Promise<void> {
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
