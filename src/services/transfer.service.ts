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

  // For cross-currency: toAmount = what arrives at destination (different from amount sent)
  // For same-currency: toAmount defaults to amount
  const toAmount = data.toAmount ?? data.amount;
  const isCrossCurrency = data.fromCurrencyCode && data.toCurrencyCode &&
    data.fromCurrencyCode !== data.toCurrencyCode;

  const ref = await addDoc(collection(db, COLLECTIONS.TRANSFERS(userId)), {
    ...data,
    toAmount,
    userId,
    createdAt: serverTimestamp(),
  });

  // Debit from source income (in source currency)
  await createLedgerEntry({
    userId,
    transactionType: "TRANSFER",
    incomeSourceId: data.fromIncomeId,
    transferId: ref.id,
    amount: data.amount,
    direction: "DEBIT",
    description: isCrossCurrency
      ? `Cross-currency transfer out (${data.fromCurrencyCode} → ${data.toCurrencyCode}): ${data.note || ""}`
      : `Transfer out: ${data.note || ""}`,
    metadata: { toIncomeId: data.toIncomeId, toAmount, isCrossCurrency },
  });

  // Credit to destination income (in destination currency — may differ from source amount)
  await createLedgerEntry({
    userId,
    transactionType: "TRANSFER",
    incomeSourceId: data.toIncomeId,
    transferId: ref.id,
    amount: toAmount,          // <— destination gets toAmount, not amount
    direction: "CREDIT",
    description: isCrossCurrency
      ? `Cross-currency transfer in (${data.fromCurrencyCode} → ${data.toCurrencyCode}): ${data.note || ""}`
      : `Transfer in: ${data.note || ""}`,
    metadata: { fromIncomeId: data.fromIncomeId, sentAmount: data.amount, isCrossCurrency },
  });

  await logAudit(userId, "CREATE", "transfer", ref.id, undefined, data);
  return ref.id;
}
