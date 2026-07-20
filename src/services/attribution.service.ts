/**
 * Attribution Service
 *
 * IMPORTANT: Attribution records are DISPLAY-ONLY.
 * They track how expenses are "covered" by income entries via FIFO matching.
 * They NEVER affect ledger entries or account/income balances.
 * Deleting or recreating allocation records has zero impact on any balance.
 *
 * Balance source of truth remains: ledger entries (unchanged).
 */
import {
  collection, addDoc, getDocs, query, where,
  doc, serverTimestamp, writeBatch,
} from "firebase/firestore";
import { db } from "@/lib/firebase/config";
import { COLLECTIONS } from "@/lib/firebase/db";
import {
  ExpenseIncomeAllocation, AllocationFormData,
  IncomeWithBalance, UNATTRIBUTED_SENTINEL,
} from "@/types";

// ── Fetch ─────────────────────────────────────────────────────────

export async function getAllocationsForAccount(
  userId: string, accountId: string
): Promise<ExpenseIncomeAllocation[]> {
  const q = query(
    collection(db, COLLECTIONS.ALLOCATIONS(userId)),
    where("accountId", "==", accountId)
  );
  const snap = await getDocs(q);
  return snap.docs.map((d) => ({ id: d.id, ...d.data() } as ExpenseIncomeAllocation));
}

export async function getAllocationsForExpense(
  userId: string, expenseId: string
): Promise<ExpenseIncomeAllocation[]> {
  const q = query(
    collection(db, COLLECTIONS.ALLOCATIONS(userId)),
    where("expenseId", "==", expenseId)
  );
  const snap = await getDocs(q);
  return snap.docs.map((d) => ({ id: d.id, ...d.data() } as ExpenseIncomeAllocation));
}

export async function getAllocationsForIncome(
  userId: string, incomeId: string
): Promise<ExpenseIncomeAllocation[]> {
  const q = query(
    collection(db, COLLECTIONS.ALLOCATIONS(userId)),
    where("incomeId", "==", incomeId)
  );
  const snap = await getDocs(q);
  return snap.docs.map((d) => ({ id: d.id, ...d.data() } as ExpenseIncomeAllocation));
}

// ── Mutation helpers ───────────────────────────────────────────────

/** Remove auto-mapped (FIFO) allocation records for one expense. Manual records survive. */
export async function clearAutoAllocationsForExpense(
  userId: string, expenseId: string
): Promise<void> {
  const existing = await getAllocationsForExpense(userId, expenseId);
  const toDelete = existing.filter((a) => a.isAutoMapped);
  if (toDelete.length === 0) return;
  const batch = writeBatch(db);
  toDelete.forEach((a) =>
    batch.delete(doc(db, COLLECTIONS.ALLOCATIONS(userId), a.id))
  );
  await batch.commit();
}

/** Write a manual override allocation (clears auto records for the same expense first). */
export async function createManualAllocation(
  userId: string, data: AllocationFormData
): Promise<string> {
  await clearAutoAllocationsForExpense(userId, data.expenseId);
  const ref = await addDoc(collection(db, COLLECTIONS.ALLOCATIONS(userId)), {
    ...data, userId, isAutoMapped: false, createdAt: serverTimestamp(),
  });
  return ref.id;
}

// ── FIFO primary-income resolver ───────────────────────────────────
/**
 * Given an account's incomes (already fetched with balances), return the ID of the
 * income that should be the primary debited source for a new expense.
 *
 * Strategy: oldest income with remaining balance first.
 * If ALL incomes are at 0 or negative, still return the oldest one (allows overdraft display).
 * Returns null only if the account has no incomes at all.
 */
export function resolveFIFOPrimaryIncome(
  accountIncomes: IncomeWithBalance[]
): string | null {
  if (accountIncomes.length === 0) return null;
  const sorted = [...accountIncomes].sort((a, b) => {
    const ta = a.createdAt?.toDate?.()?.getTime() ?? 0;
    const tb = b.createdAt?.toDate?.()?.getTime() ?? 0;
    return ta - tb; // oldest first
  });
  return (sorted.find((i) => i.balance > 0) ?? sorted[0]).id;
}

// ── Full FIFO multi-income allocation (for attribution display) ────
export interface FIFOAllocationResult {
  incomeId: string;
  incomeName: string;
  amount: number;
  isFullyAttributed: boolean;
  unattributed: number;
}

/**
 * Run full FIFO attribution and write ExpenseIncomeAllocation records.
 * This is purely for display purposes — the ledger is NOT touched.
 * Safe to re-run: clears previous auto records before writing new ones.
 */
export async function runFIFOAttribution(
  userId: string,
  accountId: string,
  expenseId: string,
  expenseAmount: number,
  incomes: IncomeWithBalance[]
): Promise<FIFOAllocationResult[]> {
  // Filter to this account, sort oldest first
  const sorted = incomes
    .filter((i) => i.accountId === accountId)
    .sort((a, b) => {
      const ta = a.createdAt?.toDate?.()?.getTime() ?? 0;
      const tb = b.createdAt?.toDate?.()?.getTime() ?? 0;
      return ta - tb;
    });

  // Fetch existing allocations for this account to know what's already consumed
  const existing = await getAllocationsForAccount(userId, accountId);

  // Respect manual allocations for this expense — don't overwrite them
  const manualForExpense = existing.filter(
    (a) => a.expenseId === expenseId && !a.isAutoMapped
  );
  if (manualForExpense.length > 0) {
    return manualForExpense.map((a) => ({
      incomeId:           a.incomeId,
      incomeName:         sorted.find((i) => i.id === a.incomeId)?.name ?? "Unknown",
      amount:             a.amount,
      isFullyAttributed:  true,
      unattributed:       0,
    }));
  }

  // Compute how much each income has been consumed by OTHER expenses (not this one)
  const consumedPerIncome = new Map<string, number>();
  existing.forEach((a) => {
    if (a.expenseId === expenseId && a.isAutoMapped) return; // skip old auto for this expense
    if (a.incomeId === UNATTRIBUTED_SENTINEL) return;
    consumedPerIncome.set(a.incomeId, (consumedPerIncome.get(a.incomeId) ?? 0) + a.amount);
  });

  // Clear old auto records for this expense before writing fresh ones
  await clearAutoAllocationsForExpense(userId, expenseId);

  let remaining = expenseAmount;
  const results: FIFOAllocationResult[] = [];

  for (const income of sorted) {
    if (remaining <= 0.0001) break;
    const consumed  = consumedPerIncome.get(income.id) ?? 0;
    const available = Math.max(0, income.amount - consumed);
    if (available <= 0.0001) continue;

    const take = Math.min(remaining, available);
    await addDoc(collection(db, COLLECTIONS.ALLOCATIONS(userId)), {
      userId, accountId, expenseId,
      incomeId:    income.id,
      amount:      take,
      isAutoMapped: true,
      createdAt:   serverTimestamp(),
    });
    results.push({
      incomeId:          income.id,
      incomeName:        income.name,
      amount:            take,
      isFullyAttributed: true,
      unattributed:      0,
    });
    remaining -= take;
  }

  if (remaining > 0.0001) {
    await addDoc(collection(db, COLLECTIONS.ALLOCATIONS(userId)), {
      userId, accountId, expenseId,
      incomeId:    UNATTRIBUTED_SENTINEL,
      amount:      remaining,
      isAutoMapped: true,
      createdAt:   serverTimestamp(),
    });
    results.push({
      incomeId:          UNATTRIBUTED_SENTINEL,
      incomeName:        "Unattributed",
      amount:            remaining,
      isFullyAttributed: false,
      unattributed:      remaining,
    });
  }

  return results;
}

// ── Computed helpers ───────────────────────────────────────────────

export function computeAllocatedPerIncome(
  allocations: ExpenseIncomeAllocation[]
): Map<string, number> {
  const map = new Map<string, number>();
  allocations
    .filter((a) => a.incomeId !== UNATTRIBUTED_SENTINEL)
    .forEach((a) => map.set(a.incomeId, (map.get(a.incomeId) ?? 0) + a.amount));
  return map;
}

export function computeAttributionRate(
  totalIncome: number,
  allocations: ExpenseIncomeAllocation[]
): number {
  const attributed = allocations
    .filter((a) => a.incomeId !== UNATTRIBUTED_SENTINEL)
    .reduce((s, a) => s + a.amount, 0);
  return totalIncome > 0 ? Math.min(100, (attributed / totalIncome) * 100) : 0;
}
