"use client";

import { doc, getDoc, setDoc, onSnapshot, serverTimestamp } from "firebase/firestore";
import { firestore } from "./firebaseClient";

/**
 * Cloud-only storage: all user data lives in Firestore.
 * Path: users/{uid}/tools/{toolId}
 * Shape: { storage: Record<string, string|null>, updatedAt: Timestamp }
 */

export type ToolStoragePayload = {
  storage: Record<string, string | null>;
  updatedAt?: unknown;
};

/** One-time read from Firestore */
export async function loadToolStorage(
  uid: string,
  toolId: string
): Promise<ToolStoragePayload | null> {
  if (!firestore) return null;
  const ref = doc(firestore, "users", uid, "tools", toolId);
  const snap = await getDoc(ref);
  return snap.exists() ? (snap.data() as ToolStoragePayload) : null;
}

/** Write storage map to Firestore */
export async function saveToolStorage(
  uid: string,
  toolId: string,
  storage: Record<string, string | null>
): Promise<void> {
  if (!firestore) return;
  const ref = doc(firestore, "users", uid, "tools", toolId);
  await setDoc(ref, { storage, updatedAt: serverTimestamp() }, { merge: true });
}

/** Real-time listener. Returns unsubscribe function. */
export function onToolStorageChange(
  uid: string,
  toolId: string,
  callback: (payload: ToolStoragePayload | null) => void
): () => void {
  if (!firestore) return () => {};
  const ref = doc(firestore, "users", uid, "tools", toolId);
  return onSnapshot(ref, (snap) => {
    callback(snap.exists() ? (snap.data() as ToolStoragePayload) : null);
  });
}
