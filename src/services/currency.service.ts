import {
  collection, addDoc, updateDoc, deleteDoc, doc, getDocs,
  query, orderBy, serverTimestamp,
} from "firebase/firestore";
import { db } from "@/lib/firebase/config";
import { COLLECTIONS } from "@/lib/firebase/db";
import { Currency, CurrencyFormData } from "@/types";

export async function getCurrencies(userId: string): Promise<Currency[]> {
  const q = query(collection(db, COLLECTIONS.CURRENCIES(userId)), orderBy("name", "asc"));
  const snap = await getDocs(q);
  return snap.docs.map((d) => ({ id: d.id, ...d.data() } as Currency));
}

export async function createCurrency(userId: string, data: CurrencyFormData): Promise<string> {
  const ref = await addDoc(collection(db, COLLECTIONS.CURRENCIES(userId)), {
    ...data, userId, createdAt: serverTimestamp(),
  });
  return ref.id;
}

export async function updateCurrency(userId: string, id: string, data: Partial<CurrencyFormData>): Promise<void> {
  await updateDoc(doc(db, COLLECTIONS.CURRENCIES(userId), id), { ...data });
}

export async function deleteCurrency(userId: string, id: string): Promise<void> {
  await deleteDoc(doc(db, COLLECTIONS.CURRENCIES(userId), id));
}
