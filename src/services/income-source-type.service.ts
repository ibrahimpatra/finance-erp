import {
  collection, addDoc, updateDoc, deleteDoc, doc, getDocs,
  query, orderBy, serverTimestamp, writeBatch,
} from "firebase/firestore";
import { db } from "@/lib/firebase/config";
import { COLLECTIONS } from "@/lib/firebase/db";
import { IncomeSourceType, IncomeSourceTypeFormData, DEFAULT_INCOME_SOURCE_TYPES } from "@/types";
import { logAudit } from "./audit.service";

export async function getIncomeSourceTypes(userId: string): Promise<IncomeSourceType[]> {
  const q = query(collection(db, COLLECTIONS.INCOME_SOURCE_TYPES(userId)), orderBy("name", "asc"));
  const snap = await getDocs(q);
  return snap.docs.map((d) => ({ id: d.id, ...d.data() } as IncomeSourceType));
}

export async function createIncomeSourceType(userId: string, data: IncomeSourceTypeFormData): Promise<string> {
  const ref = await addDoc(collection(db, COLLECTIONS.INCOME_SOURCE_TYPES(userId)), {
    ...data, userId, createdAt: serverTimestamp(), updatedAt: serverTimestamp(),
  });
  await logAudit(userId, "CREATE", "incomeSourceType", ref.id, undefined, data);
  return ref.id;
}

export async function updateIncomeSourceType(userId: string, id: string, data: Partial<IncomeSourceTypeFormData>): Promise<void> {
  await updateDoc(doc(db, COLLECTIONS.INCOME_SOURCE_TYPES(userId), id), { ...data, updatedAt: serverTimestamp() });
  await logAudit(userId, "UPDATE", "incomeSourceType", id, undefined, data);
}

export async function deleteIncomeSourceType(userId: string, id: string): Promise<void> {
  await deleteDoc(doc(db, COLLECTIONS.INCOME_SOURCE_TYPES(userId), id));
  await logAudit(userId, "DELETE", "incomeSourceType", id);
}

export async function seedDefaultIncomeSourceTypes(userId: string): Promise<void> {
  const existing = await getIncomeSourceTypes(userId);
  if (existing.length > 0) return;
  const batch = writeBatch(db);
  for (const ist of DEFAULT_INCOME_SOURCE_TYPES) {
    const ref = doc(collection(db, COLLECTIONS.INCOME_SOURCE_TYPES(userId)));
    batch.set(ref, { ...ist, userId, isActive: true, createdAt: serverTimestamp(), updatedAt: serverTimestamp() });
  }
  await batch.commit();
}
