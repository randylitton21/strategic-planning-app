"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { doc, onSnapshot } from "firebase/firestore";
import { useAuth } from "@/lib/authContext";
import { firestore } from "@/lib/firebaseClient";
import { loadToolStorage, saveToolStorage } from "@/lib/cloudStore";

type StorageKeySpec =
  | { kind: "global"; key: string }
  | { kind: "uid"; prefix: string };

type CloudToolFrameProps = {
  toolId: string;
  title: string;
  iframeSrc: string;
  storageKeys: StorageKeySpec[];
};

function resolveKeys(uid: string, specs: StorageKeySpec[]) {
  return specs.map((s) => (s.kind === "global" ? s.key : `${s.prefix}${uid}`));
}

function readStorage(keys: string[]) {
  const out: Record<string, string | null> = {};
  for (const k of keys) out[k] = localStorage.getItem(k);
  return out;
}

function stableStringify(obj: unknown) {
  return JSON.stringify(obj, Object.keys(obj as any).sort());
}

export default function CloudToolFrame({
  toolId,
  title,
  iframeSrc,
  storageKeys,
}: CloudToolFrameProps) {
  const { user, isLoading, signOut } = useAuth();
  const [nonce, setNonce] = useState(0);
  const [status, setStatus] = useState<
    "signed_out" | "loading" | "ready" | "saving" | "error"
  >("loading");
  const [error, setError] = useState<string | null>(null);
  const lastPushedRef = useRef<string>("");
  const saveTimerRef = useRef<number | null>(null);
  const pollTimerRef = useRef<number | null>(null);

  const src = useMemo(
    () => `${iframeSrc}${iframeSrc.includes("?") ? "&" : "?"}v=${nonce}`,
    [iframeSrc, nonce]
  );

  // Give legacy tools a username in the format they expect.
  useEffect(() => {
    if (!user) return;
    try {
      sessionStorage.setItem(
        "prototype_userSession",
        JSON.stringify({
          user: { username: user.uid },
          loginTime: new Date().toISOString(),
        })
      );
    } catch {
      // ignore
    }
  }, [user]);

  // Subscribe to Firestore for real-time sync: load on first snapshot, then update when another device saves.
  useEffect(() => {
    setError(null);

    if (isLoading) {
      setStatus("loading");
      return;
    }

    if (!user) {
      setStatus("signed_out");
      setNonce((n) => n + 1);
      return;
    }

    if (!firestore) {
      setStatus("error");
      setError("Cloud sync not configured.");
      return;
    }

    setStatus("loading");
    const uid = user.uid;
    const keys = resolveKeys(uid, storageKeys);
    const ref = doc(firestore, "users", uid, "tools", toolId);

    const unsub = onSnapshot(
      ref,
      (snap) => {
        const data = snap.data() as { storage?: Record<string, string | null> } | undefined;
        const storage = data && typeof data.storage === "object" ? data.storage : null;
        if (storage !== null) {
          for (const k of keys) {
            const v = storage[k];
            if (typeof v === "string") localStorage.setItem(k, v);
            else localStorage.removeItem(k);
          }
          lastPushedRef.current = stableStringify(readStorage(keys));
          setNonce((n) => n + 1);
        }
        setStatus("ready");
      },
      (e) => {
        setStatus("error");
        setError(e instanceof Error ? e.message : "Cloud load failed.");
      }
    );

    return () => unsub();
  }, [isLoading, user, toolId, storageKeys]);

  // Poll localStorage and push changes to Firestore (debounced).
  useEffect(() => {
    if (!user || status === "signed_out" || status === "loading") return;

    const uid = user.uid;
    const keys = resolveKeys(uid, storageKeys);

    function scheduleSave(payloadString: string) {
      if (saveTimerRef.current) window.clearTimeout(saveTimerRef.current);
      saveTimerRef.current = window.setTimeout(async () => {
        try {
          setStatus("saving");
          const storage = readStorage(keys);
          await saveToolStorage(uid, toolId, storage);
          lastPushedRef.current = payloadString;
          setStatus("ready");
        } catch (e) {
          setStatus("error");
          setError(e instanceof Error ? e.message : "Cloud save failed.");
        }
      }, 900);
    }

    pollTimerRef.current = window.setInterval(() => {
      const snapshot = stableStringify(readStorage(keys));
      if (snapshot !== lastPushedRef.current) {
        scheduleSave(snapshot);
      }
    }, 1500);

    return () => {
      if (pollTimerRef.current) window.clearInterval(pollTimerRef.current);
      if (saveTimerRef.current) window.clearTimeout(saveTimerRef.current);
      pollTimerRef.current = null;
      saveTimerRef.current = null;
    };
  }, [user, status, toolId, storageKeys]);

  return (
    <div className="toolFrameWrap" style={{ minHeight: "calc(100vh - 52px)" }}>
      <div className="toolBar">
        <div className="muted" style={{ fontSize: 13 }}>
            {status === "signed_out"
              ? "You’re in guest mode (local save only)."
              : status === "loading"
                ? "Loading..."
                : status === "saving"
                  ? "Saving..."
                  : status === "error"
                    ? "Sync issue"
                    : "Synced"}
          {error ? ` · ${error}` : null}
        </div>
        <div className="toolBarActions">
          <Link className="btnSecondary" href="/app" style={{ padding: "8px 12px", fontSize: 13 }}>
            Back to App
          </Link>
          {!user ? (
            <Link className="btnPrimary" href="/app/login" style={{ padding: "8px 12px", fontSize: 13 }}>
              Sign In to Sync
            </Link>
          ) : (
            <button
              className="btnSecondary"
              type="button"
              style={{ padding: "8px 12px", fontSize: 13 }}
              onClick={() => signOut()}
            >
              Sign Out
            </button>
          )}
          <button
            className="btnSecondary"
            type="button"
            style={{ padding: "8px 12px", fontSize: 13 }}
            onClick={() => setNonce((n) => n + 1)}
          >
            Reload
          </button>
        </div>
      </div>
      <div style={{ flex: 1, minHeight: 0 }}>
        <iframe title={title} src={src} style={{ width: "100%", height: "100%", minHeight: "calc(100vh - 100px)", border: "none", display: "block" }} />
      </div>
    </div>
  );
}

