"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useAuth } from "@/lib/authContext";
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
  const { user, isLoading } = useAuth();
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

  // Load from cloud into localStorage, then reload the iframe.
  useEffect(() => {
    let cancelled = false;

    async function run() {
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

      setStatus("loading");
      try {
        const keys = resolveKeys(user.uid, storageKeys);
        const docData = await loadToolStorage(user.uid, toolId);

        if (!cancelled && docData?.storage) {
          for (const k of keys) {
            const v = docData.storage[k];
            if (typeof v === "string") localStorage.setItem(k, v);
            if (v === null) localStorage.removeItem(k);
          }
        }

        // Seed last pushed so we don't immediately re-save the same payload.
        const snapshot = stableStringify(readStorage(keys));
        lastPushedRef.current = snapshot;

        setStatus("ready");
        setNonce((n) => n + 1);
      } catch (e) {
        setStatus("error");
        setError(e instanceof Error ? e.message : "Cloud load failed.");
      }
    }

    run();
    return () => {
      cancelled = true;
    };
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
    <div className="card">
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          gap: 12,
          flexWrap: "wrap",
          alignItems: "center",
        }}
      >
        <div>
          <h1 style={{ marginBottom: 4 }}>{title}</h1>
          <div className="muted">
            {status === "signed_out"
              ? "You’re in guest mode (local save only)."
              : status === "loading"
                ? "Loading..."
                : status === "saving"
                  ? "Saving..."
                  : status === "error"
                    ? "Sync issue"
                    : "Synced"}
          </div>
          {error ? (
            <div style={{ marginTop: 8 }} className="muted">
              <strong>Note:</strong> {error}
            </div>
          ) : null}
        </div>

        <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
          {!user ? (
            <Link className="btnPrimary" href="/app/login">
              Sign In to Sync
            </Link>
          ) : null}
          <button
            className="btnSecondary"
            type="button"
            onClick={() => setNonce((n) => n + 1)}
          >
            Reload Tool
          </button>
        </div>
      </div>

      <div style={{ marginTop: 14 }}>
        <iframe
          title={title}
          src={src}
          style={{
            width: "100%",
            height: "78vh",
            border: "1px solid var(--border)",
            borderRadius: 12,
            background: "#fff",
          }}
        />
      </div>
    </div>
  );
}

