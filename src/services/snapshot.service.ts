import {
  collection, addDoc, getDocs, query, where, serverTimestamp, setDoc, doc,
} from "firebase/firestore";
import { db } from "@/lib/firebase/config";
import { COLLECTIONS } from "@/lib/firebase/db";
import { MonthlySnapshot } from "@/types";
import { getAllLedgerEntries } from "./ledger.service";

export async function generateMonthlySnapshot(userId: string, month: number, year: number): Promise<void> {
  const entries = await getAllLedgerEntries(userId);
  const monthEntries = entries.filter((e) => {
    const d = e.createdAt.toDate();
    return d.getMonth() + 1 === month && d.getFullYear() === year;
  });

  let income = 0, expenses = 0, transfers = 0, refunds = 0;
  for (const e of monthEntries) {
    if (e.transactionType === "INCOME_CREATED" && e.direction === "CREDIT") income += e.amount;
    if (e.transactionType === "EXPENSE_CREATED" && e.direction === "DEBIT") expenses += e.amount;
    if (e.transactionType === "TRANSFER") transfers += e.direction === "DEBIT" ? e.amount : 0;
    if (e.transactionType === "REFUND") refunds += e.amount;
  }

  const snapshotId = `${year}-${String(month).padStart(2, "0")}`;
  await setDoc(doc(db, COLLECTIONS.MONTHLY_SNAPSHOTS(userId), snapshotId), {
    userId, month, year, income, expenses, transfers, refunds,
    openingBalance: 0, closingBalance: income - expenses + refunds,
    createdAt: serverTimestamp(), updatedAt: serverTimestamp(),
  });
}

export async function getMonthlySnapshots(userId: string): Promise<MonthlySnapshot[]> {
  const q = query(collection(db, COLLECTIONS.MONTHLY_SNAPSHOTS(userId)));
  const snap = await getDocs(q);
  return snap.docs.map((d) => ({ id: d.id, ...d.data() } as MonthlySnapshot));
}
