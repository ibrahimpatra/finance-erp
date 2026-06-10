import {
  collection, addDoc, updateDoc, deleteDoc, doc, getDocs,
  query, orderBy, serverTimestamp,
} from "firebase/firestore";
import { db } from "@/lib/firebase/config";
import { COLLECTIONS } from "@/lib/firebase/db";
import { Tag, TagFormData } from "@/types";
import { logAudit } from "./audit.service";

export async function getTags(userId: string): Promise<Tag[]> {
  const q = query(collection(db, COLLECTIONS.TAGS(userId)), orderBy("name", "asc"));
  const snap = await getDocs(q);
  return snap.docs.map((d) => ({ id: d.id, ...d.data() } as Tag));
}

export async function createTag(userId: string, data: TagFormData): Promise<string> {
  const ref = await addDoc(collection(db, COLLECTIONS.TAGS(userId)), {
    ...data, userId, createdAt: serverTimestamp(),
  });
  await logAudit(userId, "CREATE", "tag", ref.id, undefined, data);
  return ref.id;
}

export async function updateTag(userId: string, id: string, data: Partial<TagFormData>, oldData?: Tag): Promise<void> {
  await updateDoc(doc(db, COLLECTIONS.TAGS(userId), id), data);
  await logAudit(userId, "UPDATE", "tag", id, oldData, data);
}

export async function deleteTag(userId: string, id: string): Promise<void> {
  await deleteDoc(doc(db, COLLECTIONS.TAGS(userId), id));
  await logAudit(userId, "DELETE", "tag", id);
}
