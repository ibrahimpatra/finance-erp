import {
  doc, getDoc, setDoc, serverTimestamp,
} from "firebase/firestore";
import { db } from "@/lib/firebase/config";
import { Settings, SettingsFormData } from "@/types";

export async function getSettings(userId: string): Promise<Settings | null> {
  const ref = doc(db, "users", userId, "settings", "preferences");
  const snap = await getDoc(ref);
  if (!snap.exists()) return null;
  return { id: snap.id, ...snap.data() } as Settings;
}

export async function upsertSettings(userId: string, data: SettingsFormData): Promise<void> {
  const ref = doc(db, "users", userId, "settings", "preferences");
  await setDoc(ref, { ...data, userId, updatedAt: serverTimestamp() }, { merge: true });
}
