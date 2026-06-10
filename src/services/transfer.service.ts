import {
  collection, addDoc, getDocs, query, orderBy, serverTimestamp,
} from "firebase/firestore";
import { db } from "@/lib/firebase/config";
import { COLLECTIONS } from "@/lib/firebase/db";
import { Transfer, TransferFormData } from "@/types";
import { createLedgerEntry, calculateBalanceForIncome, getAllLedgerEntries } from "./ledger.service";
import { logAudit } from "./audit.service";

export async function getTransfers(userId: string): Promise<Transfer[]> {
  const q = query(collection(db, COLLECTIONS.TRANSFERS(userId)), orderBy("createdAt", "desc"));
  const snap = await getDocs(q);
  return snap.docs.map((d) => ({ id: d.id, ...d.data() } as Transfer));
}

export async function createTransfer(userId: string, data: TransferFormData): Promise<string> {
  const allEntries = await getAllLedgerEntries(userId);
  const fromBalance = calculateBalanceForIncome(allEntries, data.fromIncomeId);
  if (fromBalance < data.amount) {
    throw new Error(`Insufficient balance. Available: ${fromBalance.toFixed(3)}`);
  }
  const ref = await addDoc(collection(db, COLLECTIONS.TRANSFERS(userId)), {
    ...data, userId, createdAt: serverTimestamp(),
  });
  await createLedgerEntry({
    userId,
    transactionType: "TRANSFER",
    incomeSourceId: data.fromIncomeId,
    transferId: ref.id,
    amount: data.amount,
    direction: "DEBIT",
    description: `Transfer out: ${data.note || ""}`,
    metadata: { toIncomeId: data.toIncomeId },
  });
  await createLedgerEntry({
    userId,
    transactionType: "TRANSFER",
    incomeSourceId: data.toIncomeId,
    transferId: ref.id,
    amount: data.amount,
    direction: "CREDIT",
    description: `Transfer in: ${data.note || ""}`,
    metadata: { fromIncomeId: data.fromIncomeId },
  });
  await logAudit(userId, "CREATE", "transfer", ref.id, undefined, data);
  return ref.id;
}
