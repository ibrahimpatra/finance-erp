import {
  collection, addDoc, updateDoc, deleteDoc, doc, getDocs,
  query, orderBy, serverTimestamp, where,
} from "firebase/firestore";
import { db } from "@/lib/firebase/config";
import { COLLECTIONS } from "@/lib/firebase/db";
import { SpentBy, SpentByFormData } from "@/types";
import { logAudit } from "./audit.service";

export async function getSpentBys(userId: string): Promise<SpentBy[]> {
  const q = query(collection(db, COLLECTIONS.SPENT_BY(userId)), orderBy("name", "asc"));
  const snap = await getDocs(q);
  return snap.docs.map((d) => ({ id: d.id, ...d.data() } as SpentBy));
}

export async function createSpentBy(userId: string, data: SpentByFormData): Promise<string> {
  const ref = await addDoc(collection(db, COLLECTIONS.SPENT_BY(userId)), {
    ...data, userId, createdAt: serverTimestamp(), updatedAt: serverTimestamp(),
  });
  await logAudit(userId, "CREATE", "spentBy", ref.id, undefined, data);
  return ref.id;
}

export async function updateSpentBy(userId: string, id: string, data: Partial<SpentByFormData>, oldData?: SpentBy): Promise<void> {
  await updateDoc(doc(db, COLLECTIONS.SPENT_BY(userId), id), { ...data, updatedAt: serverTimestamp() });
  await logAudit(userId, "UPDATE", "spentBy", id, oldData, data);
}

export async function deleteSpentBy(userId: string, id: string): Promise<void> {
  const expenses = await getDocs(query(
    collection(db, COLLECTIONS.EXPENSES(userId)),
    where("spentById", "==", id)
  ));
  if (!expenses.empty) {
    throw new Error("Cannot delete person with linked expenses.");
  }
  await deleteDoc(doc(db, COLLECTIONS.SPENT_BY(userId), id));
  await logAudit(userId, "DELETE", "spentBy", id);
}
