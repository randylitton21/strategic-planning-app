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
  const [remoteApplied, setRemoteApplied] = useState(false);
  const lastPushedRef = useRef<string>("");
  const saveTimerRef = useRef<number | null>(null);
  const pollTimerRef = useRef<number | null>(null);
  const remoteLoadInProgressRef = useRef(false);
  const lastPollSnapshotRef = useRef<string>("");
  // Stable string so effects don't re-run every render (parent passes new array ref each time).
  const storageKeysSignature = useMemo(
    () => JSON.stringify(storageKeys),
    [storageKeys]
  );

  const src = useMemo(
    () => `${iframeSrc}${iframeSrc.includes("?") ? "&" : "?"}v=${nonce}`,
    [iframeSrc, nonce]
  );

  // Give legacy tools a username in the format they expect via postMessage
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const iframeReadyRef = useRef(false);
  
  useEffect(() => {
    const iframe = iframeRef.current;
    if (!iframe || !user) return;

    const sendUserSession = () => {
      try {
        const session = {
          user: { username: user.uid },
          loginTime: new Date().toISOString(),
        };
        const keys = resolveKeys(user.uid, storageKeys);
        console.log('[CLOUDTOOLFRAME] Sending user session to iframe:', user.uid);
        console.log('[CLOUDTOOLFRAME] Will sync localStorage keys:', keys);
        iframe.contentWindow?.postMessage(
          {
            type: "SET_USER_SESSION",
            session: session,
          },
          "*"
        );
      } catch (e) {
        console.error("Failed to send user session to iframe:", e);
      }
    };

    // Listen for IFRAME_READY message
    const handleMessage = (event: MessageEvent) => {
      if (event.data.type === 'IFRAME_READY') {
        console.log('[CLOUDTOOLFRAME] Received IFRAME_READY signal from:', event.data.source);
        iframeReadyRef.current = true;
        sendUserSession();
      }
    };
    
    window.addEventListener('message', handleMessage);

    // Send immediately if iframe is already loaded
    if (iframe.contentWindow) {
      sendUserSession();
    }

    // Also send when iframe loads (fallback)
    iframe.addEventListener("load", sendUserSession);
    return () => {
      iframe.removeEventListener("load", sendUserSession);
      window.removeEventListener('message', handleMessage);
    };
  }, [user, nonce, storageKeys]);

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
          const incoming = stableStringify(
            keys.reduce((acc, k) => ({ ...acc, [k]: storage[k] ?? null }), {} as Record<string, string | null>)
          );
          // Only write to localStorage when remote data actually changed. Do NOT reload iframe
          // — that caused constant refresh and sent users back. User can click Reload to see remote changes.
          if (incoming !== lastPushedRef.current) {
            console.log('[CLOUDTOOLFRAME] Firestore data changed, updating localStorage:', { uid, toolId, keys });
            remoteLoadInProgressRef.current = true; // Prevent polling from saving during load

            for (const k of keys) {
              const v = storage[k];
              if (typeof v === "string") localStorage.setItem(k, v);
              else localStorage.removeItem(k);
            }
            const updatedSnapshot = stableStringify(readStorage(keys));
            lastPushedRef.current = updatedSnapshot;
            lastPollSnapshotRef.current = updatedSnapshot; // Prevent immediate re-save
            setRemoteApplied(true);
            console.log('[CLOUDTOOLFRAME] localStorage updated from Firestore');

            // Brief delay to let localStorage settle before allowing saves
            setTimeout(() => {
              remoteLoadInProgressRef.current = false;
              console.log('[CLOUDTOOLFRAME] Remote load complete, polling can resume');

              // Notify iframe that data is ready to load
              const iframe = iframeRef.current;
              if (iframe && iframe.contentWindow) {
                iframe.contentWindow.postMessage(
                  { type: "DATA_READY", uid: uid },
                  "*"
                );
                console.log('[CLOUDTOOLFRAME] Sent DATA_READY signal to iframe');
              }
            }, 100);
          }
        } else {
          console.log('[CLOUDTOOLFRAME] No storage data in Firestore yet');
          // Still notify iframe even if no data
          setTimeout(() => {
            const iframe = iframeRef.current;
            if (iframe && iframe.contentWindow) {
              iframe.contentWindow.postMessage(
                { type: "DATA_READY", uid: uid },
                "*"
              );
              console.log('[CLOUDTOOLFRAME] Sent DATA_READY signal (no remote data)');
            }
          }, 100);
        }
        setStatus("ready");
      },
      (e) => {
        setStatus("error");
        setError(e instanceof Error ? e.message : "Cloud load failed.");
        remoteLoadInProgressRef.current = false; // Reset on error
      }
    );

    return () => unsub();
  }, [isLoading, user, toolId, storageKeysSignature]);

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
          console.log('[CLOUDTOOLFRAME] Saving to Firestore:', { uid, toolId, keys, storagePreview: Object.keys(storage) });
          await saveToolStorage(uid, toolId, storage);
          lastPushedRef.current = payloadString;
          lastPollSnapshotRef.current = payloadString; // Prevent duplicate saves
          setStatus("ready");
          setRemoteApplied(false);
          console.log('[CLOUDTOOLFRAME] Save completed successfully');
        } catch (e) {
          console.error('[CLOUDTOOLFRAME] Save failed:', e);
          setStatus("error");
          setError(e instanceof Error ? e.message : "Cloud save failed.");
        }
      }, 900);
    }

    pollTimerRef.current = window.setInterval(() => {
      // Don't poll if we're in the middle of loading remote data
      if (remoteLoadInProgressRef.current) {
        console.log('[CLOUDTOOLFRAME] Skipping poll - remote load in progress');
        return;
      }

      const snapshot = stableStringify(readStorage(keys));
      if (snapshot !== lastPushedRef.current && snapshot !== lastPollSnapshotRef.current) {
        lastPollSnapshotRef.current = snapshot;
        console.log('[CLOUDTOOLFRAME] localStorage changed, scheduling save to Firestore');
        scheduleSave(snapshot);
      }
    }, 1500);

    return () => {
      if (pollTimerRef.current) window.clearInterval(pollTimerRef.current);
      if (saveTimerRef.current) window.clearTimeout(saveTimerRef.current);
      pollTimerRef.current = null;
      saveTimerRef.current = null;
    };
  }, [user, status, toolId, storageKeysSignature]);

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
            onClick={() => {
              setRemoteApplied(false);
              setNonce((n) => n + 1);
            }}
          >
            {remoteApplied ? "Reload to see updates" : "Reload"}
          </button>
        </div>
      </div>
      <div style={{ flex: 1, minHeight: 0 }}>
        <iframe ref={iframeRef} title={title} src={src} style={{ width: "100%", height: "100%", minHeight: "calc(100vh - 100px)", border: "none", display: "block" }} />
      </div>
    </div>
  );
}

