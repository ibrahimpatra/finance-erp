import {
  collection, addDoc, query, orderBy, getDocs, limit, serverTimestamp,
} from "firebase/firestore";
import { db } from "@/lib/firebase/config";
import { COLLECTIONS } from "@/lib/firebase/db";
import { AuditLog } from "@/types";

export async function logAudit(
  userId: string,
  action: string,
  entityType: string,
  entityId: string,
  oldData?: unknown,
  newData?: unknown
): Promise<void> {
  await addDoc(collection(db, COLLECTIONS.AUDIT_LOGS(userId)), {
    userId, action, entityType, entityId,
    ...(oldData !== undefined && { oldData }),
    ...(newData !== undefined && { newData }),
    timestamp: serverTimestamp(),
  });
}

export async function getAuditLogs(userId: string, limitCount = 100): Promise<AuditLog[]> {
  const q = query(
    collection(db, COLLECTIONS.AUDIT_LOGS(userId)),
    orderBy("timestamp", "desc"),
    limit(limitCount)
  );
  const snap = await getDocs(q);
  return snap.docs.map((d) => ({ id: d.id, ...d.data() } as AuditLog));
}
