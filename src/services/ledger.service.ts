import {
  collection, addDoc, query, where, getDocs, orderBy, serverTimestamp,
} from "firebase/firestore";
import { db } from "@/lib/firebase/config";
import { COLLECTIONS } from "@/lib/firebase/db";
import { LedgerEntry, TransactionType, LedgerDirection } from "@/types";

interface CreateLedgerEntryParams {
  userId: string;
  transactionType: TransactionType;
  incomeSourceId?: string;
  expenseId?: string;
  transferId?: string;
  spentById?: string;
  amount: number;
  direction: LedgerDirection;
  description: string;
  metadata?: Record<string, unknown>;
}

export async function createLedgerEntry(params: CreateLedgerEntryParams): Promise<string> {
  const ref = await addDoc(collection(db, COLLECTIONS.LEDGER(params.userId)), {
    ...params,
    createdAt: serverTimestamp(),
  });
  return ref.id;
}

// NOTE: Removed orderBy to avoid composite index requirement.
// Balance calculation doesn't need ordered results.
export async function getLedgerForIncome(userId: string, incomeSourceId: string): Promise<LedgerEntry[]> {
  const q = query(
    collection(db, COLLECTIONS.LEDGER(userId)),
    where("incomeSourceId", "==", incomeSourceId)
  );
  const snap = await getDocs(q);
  return snap.docs.map((d) => ({ id: d.id, ...d.data() } as LedgerEntry));
}

export async function getAllLedgerEntries(userId: string): Promise<LedgerEntry[]> {
  const q = query(
    collection(db, COLLECTIONS.LEDGER(userId)),
    orderBy("createdAt", "desc")
  );
  const snap = await getDocs(q);
  return snap.docs.map((d) => ({ id: d.id, ...d.data() } as LedgerEntry));
}

export function calculateBalanceFromLedger(entries: LedgerEntry[]): number {
  return entries.reduce((acc, entry) => {
    return entry.direction === "CREDIT" ? acc + entry.amount : acc - entry.amount;
  }, 0);
}

export function calculateBalanceForIncome(entries: LedgerEntry[], incomeSourceId: string): number {
  const filtered = entries.filter((e) => e.incomeSourceId === incomeSourceId);
  return calculateBalanceFromLedger(filtered);
}

export function calculateTotalCredits(entries: LedgerEntry[]): number {
  return entries.filter((e) => e.direction === "CREDIT").reduce((a, e) => a + e.amount, 0);
}

export function calculateTotalDebits(entries: LedgerEntry[]): number {
  return entries.filter((e) => e.direction === "DEBIT").reduce((a, e) => a + e.amount, 0);
}
