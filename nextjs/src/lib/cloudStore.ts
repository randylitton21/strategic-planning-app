"use client";

import { doc, getDoc, getDocFromServer, setDoc, onSnapshot, serverTimestamp } from "firebase/firestore";
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

/** One-time read from Firestore. Uses server when possible so reload gets latest. Retries once on failure. */
export async function loadToolStorage(
  uid: string,
  toolId: string
): Promise<ToolStoragePayload | null> {
  if (!firestore) return null;
  const ref = doc(firestore, "users", uid, "tools", toolId);
  for (let attempt = 0; attempt < 2; attempt++) {
    try {
      const snap = await getDocFromServer(ref);
      return snap.exists() ? (snap.data() as ToolStoragePayload) : null;
    } catch (err) {
      if (attempt === 0) {
        console.warn("[cloudStore] Server read failed, retrying...", err);
        await new Promise((r) => setTimeout(r, 400));
        continue;
      }
      console.warn("[cloudStore] Server read failed, falling back to cache:", err);
      const snap = await getDoc(ref);
      return snap.exists() ? (snap.data() as ToolStoragePayload) : null;
    }
  }
  return null;
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

export type ToolStorageListenerMeta = { fromCache: boolean };

/** Real-time listener. Callback receives (payload, metadata). Use metadata.fromCache to avoid overwriting fresh server load with stale cache. */
export function onToolStorageChange(
  uid: string,
  toolId: string,
  callback: (payload: ToolStoragePayload | null, meta: ToolStorageListenerMeta) => void
): () => void {
  if (!firestore) return () => {};
  const ref = doc(firestore, "users", uid, "tools", toolId);
  return onSnapshot(ref, (snap) => {
    const payload = snap.exists() ? (snap.data() as ToolStoragePayload) : null;
    const meta: ToolStorageListenerMeta = { fromCache: snap.metadata?.fromCache ?? true };
    callback(payload, meta);
  });
}
