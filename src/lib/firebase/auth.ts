import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  sendPasswordResetEmail,
  updateProfile,
  onAuthStateChanged,
  User,
} from "firebase/auth";
import { doc, setDoc, getDoc, serverTimestamp } from "firebase/firestore";
import { auth, db } from "./config";

export async function registerUser(email: string, password: string, displayName: string) {
  const credential = await createUserWithEmailAndPassword(auth, email, password);
  await updateProfile(credential.user, { displayName });

  await setDoc(doc(db, "users", credential.user.uid), {
    id: credential.user.uid,
    email,
    displayName,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });

  // FIX (#3): no longer pre-assigns KWD (or any currency) for new users —
  // the settings doc is intentionally NOT created here. The new-user currency
  // banner (shown only when settings.fetched === true && settings === null)
  // prompts them to pick their own currency on first visit. This ONLY affects
  // brand-new signups going forward — every existing user already has a
  // settings document and this code path never runs for them again.

  return credential.user;
}

export async function loginUser(email: string, password: string) {
  const credential = await signInWithEmailAndPassword(auth, email, password);
  return credential.user;
}

export async function logoutUser() {
  await signOut(auth);
}

export async function resetPassword(email: string) {
  await sendPasswordResetEmail(auth, email);
}

export function onAuthChange(callback: (user: User | null) => void) {
  return onAuthStateChanged(auth, callback);
}

export async function getUserProfile(uid: string) {
  const snap = await getDoc(doc(db, "users", uid));
  return snap.exists() ? snap.data() : null;
}
