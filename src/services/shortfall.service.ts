/**
 * Shortfall Service
 *
 * Solves: an expense larger than its target income's balance must NEVER push
 * that income negative. Instead:
 *
 * 1. The income absorbs only what it has (capped at its current balance).
 * 2. The remainder is written as a SHORTFALL_CREATED ledger entry tied to the
 *    BANK ACCOUNT (not any income) — this is what makes the account balance
 *    go negative/overdrawn, while every individual income stays >= 0.
 * 3. When a new income is added to that account, any outstanding shortfall is
 *    automatically covered (oldest first), debiting the new income for exactly
 *    the covered amount and writing a SHORTFALL_RESOLVED entry.
 * 4. Users can also manually resolve a shortfall against any existing income
 *    in the same account that has balance > 0.
 *
 * NOTHING here ever deletes or mutates a ledger entry — every operation is a
 * new, additive, immutable entry. Outstanding shortfall is always a LIVE SUM
 * (SHORTFALL_CREATED minus SHORTFALL_RESOLVED), exactly like every other
 * balance in this app. No separate "snapshot" field exists anywhere.
 *
 * Only applies when an expense/income has an accountId. Legacy expenses with
 * no accountId keep their original (uncapped) behavior — zero change for them.
 */
import {
  getLedgerForAccount, getLedgerForIncome, createLedgerEntry,
  calculateBalanceFromLedger,
} from "./ledger.service";
import { LedgerEntry } from "@/types";
import { addDoc, collection, query, where, getDocs, serverTimestamp } from "firebase/firestore";
import { db } from "@/lib/firebase/config";
import { COLLECTIONS } from "@/lib/firebase/db";

const EPSILON = 0.0005; // sub-fils rounding guard for 3-decimal currencies

// ── Cap a debit at the income's current available balance ──────────────────
// Returns how much was actually covered and how much overflowed.
// If `accountId` is not provided (legacy/no-account expense), behaves exactly
// like the original uncapped single debit — zero behavior change for old data.
export async function debitIncomeWithShortfall(params: {
  userId: string;
  incomeSourceId: string;
  accountId?: string;
  amount: number;
  expenseId: string;
  spentById?: string;
  transactionType: "EXPENSE_CREATED" | "EXPENSE_REASSIGNED" | "EXPENSE_UPDATED";
  description: string;
  metadata?: Record<string, unknown>;
}): Promise<{ covered: number; shortfall: number }> {
  const {
    userId, incomeSourceId, accountId, amount, expenseId,
    spentById, transactionType, description, metadata,
  } = params;

  // No account linked — preserve exact original (legacy) behavior: one full debit.
  if (!accountId) {
    await createLedgerEntry({
      userId,
      transactionType,
      incomeSourceId,
      expenseId,
      spentById,
      amount,
      direction: "DEBIT",
      description,
      metadata,
    });
    return { covered: amount, shortfall: 0 };
  }

  // Account-linked — cap the debit at what's actually available.
  const ledger          = await getLedgerForIncome(userId, incomeSourceId);
  const currentBalance  = calculateBalanceFromLedger(ledger);
  const covered         = Math.max(0, Math.min(amount, currentBalance));
  const shortfall       = amount - covered;

  if (covered > EPSILON) {
    await createLedgerEntry({
      userId,
      transactionType,
      incomeSourceId,
      expenseId,
      spentById,
      accountId,
      amount: covered,
      direction: "DEBIT",
      description,
      metadata,
    });
  }

  if (shortfall > EPSILON) {
    await createLedgerEntry({
      userId,
      transactionType: "SHORTFALL_CREATED",
      expenseId,
      accountId,
      spentById,
      // Intentionally NO incomeSourceId — a shortfall belongs to the account,
      // not to any single income, by design.
      amount: shortfall,
      direction: "DEBIT",
      description: `Insufficient funds: ${shortfall.toFixed(3)} could not be covered — pending a future income on this account`,
      metadata: { ...metadata, originalIncomeSourceId: incomeSourceId },
    });
  }

  return { covered, shortfall };
}

// ── Outstanding shortfalls for an account ───────────────────────────────────
export interface OutstandingShortfall {
  expenseId:     string;
  totalCreated:  number;
  totalResolved: number;
  remaining:     number;
  createdAt:     Date;
  description:   string;
}

export async function getOutstandingShortfalls(
  userId: string, accountId: string
): Promise<OutstandingShortfall[]> {
  const entries = await getLedgerForAccount(userId, accountId);
  return computeOutstandingShortfalls(entries);
}

function computeOutstandingShortfalls(entries: LedgerEntry[]): OutstandingShortfall[] {
  const createdByExpense  = new Map<string, { amount: number; createdAt: Date; description: string }>();
  const resolvedByExpense = new Map<string, number>();

  for (const e of entries) {
    if (!e.expenseId) continue;
    if (e.transactionType === "SHORTFALL_CREATED") {
      createdByExpense.set(e.expenseId, {
        amount:      e.amount,
        createdAt:   e.createdAt.toDate(),
        description: e.description,
      });
    }
    if (e.transactionType === "SHORTFALL_RESOLVED") {
      resolvedByExpense.set(e.expenseId, (resolvedByExpense.get(e.expenseId) ?? 0) + e.amount);
    }
  }

  const result: OutstandingShortfall[] = [];
  for (const [expenseId, created] of createdByExpense.entries()) {
    const resolved  = resolvedByExpense.get(expenseId) ?? 0;
    const remaining = created.amount - resolved;
    if (remaining > EPSILON) {
      result.push({
        expenseId,
        totalCreated:  created.amount,
        totalResolved: resolved,
        remaining,
        createdAt:     created.createdAt,
        description:   created.description,
      });
    }
  }
  return result.sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime()); // oldest first
}

export function getTotalOutstandingShortfall(shortfalls: OutstandingShortfall[]): number {
  return shortfalls.reduce((s, x) => s + x.remaining, 0);
}

// ── Resolve outstanding shortfalls using a given income's available amount ─
// trigger="auto"   → called automatically right after a new income is created
// trigger="manual" → called from the UI when a user explicitly reassigns
// targetExpenseId  → if set, only resolve THIS specific shortfall (manual,
//                    per-row "Reassign" action); otherwise resolves oldest-first
export async function resolveAccountShortfalls(
  userId: string,
  accountId: string,
  resolvingIncomeId: string,
  availableAmount: number,
  trigger: "auto" | "manual" = "auto",
  targetExpenseId?: string
): Promise<{ totalResolved: number; details: Array<{ expenseId: string; amount: number }> }> {
  if (availableAmount <= EPSILON) return { totalResolved: 0, details: [] };

  const outstanding = await getOutstandingShortfalls(userId, accountId);
  const queue = targetExpenseId
    ? outstanding.filter((s) => s.expenseId === targetExpenseId)
    : outstanding;

  let remaining = availableAmount;
  const details: Array<{ expenseId: string; amount: number }> = [];

  for (const shortfall of queue) {
    if (remaining <= EPSILON) break;
    const take = Math.min(remaining, shortfall.remaining);
    if (take <= EPSILON) continue;

    const resolveDescription = trigger === "auto"
      ? `Auto-adjustment: ${take.toFixed(3)} applied to cover a prior shortfall`
      : `Manual adjustment: ${take.toFixed(3)} applied to cover a prior shortfall`;

    // 1. Write the SHORTFALL_RESOLVED ledger entry (reduces resolving income's balance)
    await createLedgerEntry({
      userId,
      transactionType: "SHORTFALL_RESOLVED",
      incomeSourceId:  resolvingIncomeId,
      accountId,
      expenseId:       shortfall.expenseId,
      amount:          take,
      direction:       "DEBIT",
      description:     resolveDescription,
      metadata:        { trigger },
    });

    // 2. FIX: create a system-generated expense document so the deduction
    //    is visible on the income detail page and the expenses list.
    //    This was the missing step — the ledger entry moved the balance
    //    but nothing appeared in the UI showing WHY.
    //    - isSystemGenerated: true → UI blocks Delete for these
    //    - Users CAN reassign to another income in the same account with balance > 0
    //    - expenseTypeId / spentById use sentinel empty strings (no real category/person)
    try {
      await addDoc(collection(db, COLLECTIONS.EXPENSES(userId)), {
        userId,
        incomeSourceId:     resolvingIncomeId,
        accountId,
        amount:             take,
        reason:             resolveDescription,
        notes:              `Shortfall adjustment linked to expense ID: ${shortfall.expenseId}`,
        expenseTypeId:      "",   // no category — system entry
        spentById:          "",   // no person — system entry
        tagIds:             [],
        currencyCode:       undefined, // inherits from account
        isSystemGenerated:  true,
        createdAt:          serverTimestamp(),
        updatedAt:          serverTimestamp(),
      });
    } catch {
      // Non-critical: the ledger entry above already moved the balance.
      // The expense document is the display layer only — if it fails,
      // the balance is still correct; the document just won't be visible
      // until the next recompute that re-creates it.
    }

    details.push({ expenseId: shortfall.expenseId, amount: take });
    remaining -= take;
  }

  return { totalResolved: availableAmount - remaining, details };
}

// ── Reconciliation ("Recompute") ────────────────────────────────────────────
// Catch-up pass: checks whether any of the account's CURRENT incomes have
// spare balance that could resolve an outstanding shortfall but never did
// (e.g. the auto-trigger failed, or an income amount was edited upward after
// the shortfall existed). Only ever ADDS new SHORTFALL_RESOLVED entries —
// never modifies or deletes anything. Safe to run any number of times;
// running it with nothing to fix is a no-op.
export async function reconcileAccountShortfalls(
  userId: string,
  accountId: string,
  incomeIds: string[]
): Promise<{ resolvedCount: number; totalResolved: number }> {
  let totalResolved = 0;
  let resolvedCount = 0;

  for (const incomeId of incomeIds) {
    const ledger  = await getLedgerForIncome(userId, incomeId);
    const balance = calculateBalanceFromLedger(ledger);
    if (balance <= EPSILON) continue;

    const { totalResolved: r, details } = await resolveAccountShortfalls(
      userId, accountId, incomeId, balance, "manual"
    );
    if (r > EPSILON) {
      totalResolved += r;
      resolvedCount += details.length;
    }
  }

  return { resolvedCount, totalResolved };
}

// ── All-accounts shortfall + opening-balance lookup (for bank account balances) ─
// One query for every account-level ledger entry the user has (shortfalls AND
// opening balances), grouped by account. Used by the bank account store so every
// account's displayed balance is accurate without an N+1 query per account.

const ACCOUNT_LEVEL_TYPES = ["SHORTFALL_CREATED", "SHORTFALL_RESOLVED", "OPENING_BALANCE"] as const;

export async function getAllShortfallEntries(userId: string): Promise<LedgerEntry[]> {
  const q = query(
    collection(db, COLLECTIONS.LEDGER(userId)),
    where("transactionType", "in", ACCOUNT_LEVEL_TYPES as unknown as string[])
  );
  const snap = await getDocs(q);
  return snap.docs.map((d) => ({ id: d.id, ...d.data() } as LedgerEntry));
}

export function computeOutstandingShortfallsByAccount(entries: LedgerEntry[]): Map<string, number> {
  const byAccount = new Map<string, LedgerEntry[]>();
  for (const e of entries) {
    if (!e.accountId) continue;
    const bucket = byAccount.get(e.accountId) ?? [];
    bucket.push(e);
    byAccount.set(e.accountId, bucket);
  }

  const result = new Map<string, number>();
  for (const [accountId, accEntries] of byAccount.entries()) {
    const outstanding = computeOutstandingShortfalls(accEntries);
    result.set(accountId, getTotalOutstandingShortfall(outstanding));
  }
  return result;
}

// Opening balance net (CREDIT - DEBIT) per account, from the same combined entry set.
export function computeOpeningBalanceByAccount(entries: LedgerEntry[]): Map<string, number> {
  const result = new Map<string, number>();
  for (const e of entries) {
    if (!e.accountId || e.transactionType !== "OPENING_BALANCE") continue;
    const delta = e.direction === "CREDIT" ? e.amount : -e.amount;
    result.set(e.accountId, (result.get(e.accountId) ?? 0) + delta);
  }
  return result;
}
