"use client";

import { doc, getDoc, serverTimestamp, setDoc } from "firebase/firestore";
import { firestore } from "./firebaseClient";

export type ToolStoragePayload = {
  storage: Record<string, string | null>;
  updatedAt?: unknown;
};

export async function loadToolStorage(uid: string, toolId: string) {
  if (!firestore) {
    throw new Error(
      "Firebase is not configured. Add Firebase env vars to enable cloud sync."
    );
  }
  const ref = doc(firestore, "users", uid, "tools", toolId);
  const snap = await getDoc(ref);
  if (!snap.exists()) return null;
  return snap.data() as ToolStoragePayload;
}

export async function saveToolStorage(
  uid: string,
  toolId: string,
  storage: Record<string, string | null>
) {
  if (!firestore) {
    throw new Error(
      "Firebase is not configured. Add Firebase env vars to enable cloud sync."
    );
  }
  const ref = doc(firestore, "users", uid, "tools", toolId);
  await setDoc(
    ref,
    {
      storage,
      updatedAt: serverTimestamp(),
    },
    { merge: true }
  );
}

