import {
  collection, addDoc, updateDoc, deleteDoc, doc, getDocs,
  query, orderBy, serverTimestamp, writeBatch,
} from "firebase/firestore";
import { db } from "@/lib/firebase/config";
import { COLLECTIONS } from "@/lib/firebase/db";
import { ExpenseType, ExpenseTypeFormData, DEFAULT_EXPENSE_TYPES } from "@/types";
import { logAudit } from "./audit.service";

export async function getExpenseTypes(userId: string): Promise<ExpenseType[]> {
  const q = query(collection(db, COLLECTIONS.EXPENSE_TYPES(userId)), orderBy("name", "asc"));
  const snap = await getDocs(q);
  return snap.docs.map((d) => ({ id: d.id, ...d.data() } as ExpenseType));
}

export async function createExpenseType(userId: string, data: ExpenseTypeFormData): Promise<string> {
  const ref = await addDoc(collection(db, COLLECTIONS.EXPENSE_TYPES(userId)), {
    ...data, userId, createdAt: serverTimestamp(), updatedAt: serverTimestamp(),
  });
  await logAudit(userId, "CREATE", "expenseType", ref.id, undefined, data);
  return ref.id;
}

export async function updateExpenseType(userId: string, id: string, data: Partial<ExpenseTypeFormData>): Promise<void> {
  const ref = doc(db, COLLECTIONS.EXPENSE_TYPES(userId), id);
  await updateDoc(ref, { ...data, updatedAt: serverTimestamp() });
  await logAudit(userId, "UPDATE", "expenseType", id, undefined, data);
}

export async function deleteExpenseType(userId: string, id: string): Promise<void> {
  await deleteDoc(doc(db, COLLECTIONS.EXPENSE_TYPES(userId), id));
  await logAudit(userId, "DELETE", "expenseType", id);
}

export async function seedDefaultExpenseTypes(userId: string): Promise<void> {
  const existing = await getExpenseTypes(userId);
  if (existing.length > 0) return;
  const batch = writeBatch(db);
  for (const et of DEFAULT_EXPENSE_TYPES) {
    const ref = doc(collection(db, COLLECTIONS.EXPENSE_TYPES(userId)));
    batch.set(ref, { ...et, userId, isActive: true, createdAt: serverTimestamp(), updatedAt: serverTimestamp() });
  }
  await batch.commit();
}
