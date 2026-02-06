"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useAuth } from "@/lib/authContext";
import { loadToolStorage, saveToolStorage, onToolStorageChange } from "@/lib/cloudStore";

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

type StorageKeySpec =
  | { kind: "global"; key: string }
  | { kind: "uid"; prefix: string };

type CloudToolFrameProps = {
  toolId: string;
  title: string;
  iframeSrc: string;
  storageKeys: StorageKeySpec[];
};

/* ------------------------------------------------------------------ */
/*  Helpers                                                            */
/* ------------------------------------------------------------------ */

/** Turn key specs into concrete localStorage key names for a given uid */
function resolveKeys(uid: string, specs: StorageKeySpec[]): string[] {
  return specs.map((s) =>
    s.kind === "global" ? s.key : `${s.prefix}${uid}`
  );
}

/** Read a set of localStorage keys into a plain object */
function readLocalStorage(keys: string[]): Record<string, string | null> {
  const result: Record<string, string | null> = {};
  for (const k of keys) {
    result[k] = localStorage.getItem(k);
  }
  return result;
}

/** Write a plain object into localStorage */
function writeLocalStorage(data: Record<string, string | null>) {
  for (const [k, v] of Object.entries(data)) {
    if (v === null || v === undefined) {
      localStorage.removeItem(k);
    } else {
      localStorage.setItem(k, v);
    }
  }
}

/** Shallow compare two storage maps */
function storageEqual(
  a: Record<string, string | null>,
  b: Record<string, string | null>
): boolean {
  const keysA = Object.keys(a);
  const keysB = Object.keys(b);
  if (keysA.length !== keysB.length) return false;
  for (const k of keysA) {
    if (a[k] !== b[k]) return false;
  }
  return true;
}

/* ------------------------------------------------------------------ */
/*  Component                                                          */
/* ------------------------------------------------------------------ */

export default function CloudToolFrame({
  toolId,
  title,
  iframeSrc,
  storageKeys,
}: CloudToolFrameProps) {
  const { user, isLoading } = useAuth();
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const [status, setStatus] = useState("Connecting...");

  // Refs to track state without re-renders
  const lastSavedSnapshotRef = useRef<Record<string, string | null>>({});
  const isLoadingFromCloudRef = useRef(false);
  const iframeReadyRef = useRef(false);
  const pollIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const uid = user?.uid;

  /* ---- Resolve keys for current user ---- */
  const resolvedKeys = uid ? resolveKeys(uid, storageKeys) : [];

  /* ---- Send user session to iframe ---- */
  const sendSessionToIframe = useCallback(() => {
    const iframe = iframeRef.current;
    if (!iframe?.contentWindow) return;

    const session = uid
      ? { user: { username: uid }, loginTime: new Date().toISOString() }
      : null;

    if (session) {
      iframe.contentWindow.postMessage(
        { type: "SET_USER_SESSION", session },
        "*"
      );
    }
  }, [uid]);

  /* ---- Tell iframe to reload its data from localStorage ---- */
  const tellIframeToReload = useCallback(() => {
    const iframe = iframeRef.current;
    if (!iframe?.contentWindow) return;
    // Send DATA_READY so prototype calls loadData()/loadSavedData()
    iframe.contentWindow.postMessage({ type: "DATA_READY" }, "*");
  }, []);

  /* ---- Save current localStorage state to Firestore ---- */
  const pushToCloud = useCallback(async () => {
    if (!uid || resolvedKeys.length === 0) return;
    if (isLoadingFromCloudRef.current) return; // Don't save during cloud load

    const current = readLocalStorage(resolvedKeys);

    // Only save if something actually changed
    if (storageEqual(current, lastSavedSnapshotRef.current)) return;

    try {
      await saveToolStorage(uid, toolId, current);
      lastSavedSnapshotRef.current = { ...current };
      setStatus("Saved to cloud ✓");
    } catch (err) {
      console.error("[CloudToolFrame] Save to cloud failed:", err);
      setStatus("Cloud save failed — will retry");
    }
  }, [uid, toolId, resolvedKeys]);

  /* ---- Main effect: load from cloud, start sync ---- */
  useEffect(() => {
    if (!uid || resolvedKeys.length === 0) return;

    let cancelled = false;
    let unsubFirestore: (() => void) | null = null;

    async function initialize() {
      setStatus("Loading from cloud...");
      isLoadingFromCloudRef.current = true;

      try {
        // 1. Load data from Firestore
        const payload = await loadToolStorage(uid!, toolId);

        if (cancelled) return;

        if (payload?.storage) {
          // Write Firestore data into localStorage
          writeLocalStorage(payload.storage);
          lastSavedSnapshotRef.current = { ...payload.storage };
          setStatus("Cloud data loaded ✓");
        } else {
          // No cloud data yet — read whatever is in localStorage as initial state
          const current = readLocalStorage(resolvedKeys);
          lastSavedSnapshotRef.current = { ...current };
          setStatus("No cloud data — starting fresh");
        }
      } catch (err) {
        console.error("[CloudToolFrame] Cloud load failed:", err);
        setStatus("Cloud load failed — using local data");
        const current = readLocalStorage(resolvedKeys);
        lastSavedSnapshotRef.current = { ...current };
      }

      isLoadingFromCloudRef.current = false;

      // 2. Send session + tell iframe to load
      sendSessionToIframe();
      // Small delay to let iframe process the session message
      await new Promise((r) => setTimeout(r, 300));
      tellIframeToReload();

      // 3. Start polling localStorage for changes (every 3s)
      if (pollIntervalRef.current) clearInterval(pollIntervalRef.current);
      pollIntervalRef.current = setInterval(() => {
        if (!isLoadingFromCloudRef.current) {
          pushToCloud();
        }
      }, 3000);

      // 4. Listen for real-time Firestore updates (cross-device sync)
      unsubFirestore = onToolStorageChange(uid!, toolId, (payload) => {
        if (cancelled) return;
        if (!payload?.storage) return;

        // Check if this is different from what we last saved
        const current = readLocalStorage(resolvedKeys);
        if (!storageEqual(payload.storage, current)) {
          isLoadingFromCloudRef.current = true;
          writeLocalStorage(payload.storage);
          lastSavedSnapshotRef.current = { ...payload.storage };

          // Reload iframe with new data
          tellIframeToReload();
          setStatus("Synced from another device ✓");

          setTimeout(() => {
            isLoadingFromCloudRef.current = false;
          }, 2000);
        }
      });
    }

    initialize();

    return () => {
      cancelled = true;
      if (pollIntervalRef.current) {
        clearInterval(pollIntervalRef.current);
        pollIntervalRef.current = null;
      }
      if (unsubFirestore) unsubFirestore();
    };
  }, [uid, toolId, resolvedKeys.join(",")]); // eslint-disable-line react-hooks/exhaustive-deps

  /* ---- Handle iframe load event ---- */
  useEffect(() => {
    const iframe = iframeRef.current;
    if (!iframe) return;

    const onLoad = () => {
      iframeReadyRef.current = true;
      sendSessionToIframe();
    };

    iframe.addEventListener("load", onLoad);
    return () => iframe.removeEventListener("load", onLoad);
  }, [sendSessionToIframe]);

  /* ---- Handle iframe messages ---- */
  useEffect(() => {
    const handler = (e: MessageEvent) => {
      if (e.data?.type === "IFRAME_READY") {
        iframeReadyRef.current = true;
        sendSessionToIframe();
      }
    };
    window.addEventListener("message", handler);
    return () => window.removeEventListener("message", handler);
  }, [sendSessionToIframe]);

  /* ---- Loading / not signed in states ---- */
  const needsAuth = storageKeys.length > 0;

  if (isLoading) {
    return (
      <div className="container" style={{ padding: 40, textAlign: "center" }}>
        <p className="muted">Loading...</p>
      </div>
    );
  }

  if (!user && needsAuth) {
    return (
      <div className="container" style={{ padding: 40, textAlign: "center" }}>
        <div className="card">
          <h2>Sign in required</h2>
          <p className="muted" style={{ margin: "12px 0" }}>
            All your data is stored in the cloud. Please sign in to continue.
          </p>
          <Link className="btnPrimary" href="/app/login">
            Sign In
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="toolFrameWrap" style={{ minHeight: "calc(100vh - 52px)" }}>
      <div className="toolBar">
        <div className="muted" style={{ fontSize: 13 }}>
          ☁️ {status}
        </div>
        <div className="toolBarActions">
          <Link className="btnSecondary" href="/app">
            ← Back to Dashboard
          </Link>
          <button
            className="btnSecondary"
            type="button"
            onClick={() => {
              // Force save before reload
              pushToCloud();
              iframeRef.current?.contentWindow?.location.reload();
            }}
          >
            🔄 Reload Tool
          </button>
        </div>
      </div>

      <iframe
        ref={iframeRef}
        src={iframeSrc}
        style={{
          width: "100%",
          height: "calc(100vh - 100px)",
          border: "none",
        }}
        title={title}
      />
    </div>
  );
}
