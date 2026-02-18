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
  const { user, isLoading, signOut } = useAuth();
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const [status, setStatus] = useState("Connecting...");

  const lastSavedSnapshotRef = useRef<Record<string, string | null>>({});
  const isLoadingFromCloudRef = useRef(false);
  const iframeReadyRef = useRef(false);
  const pollIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  /** Firestore payload to inject; only send when iframe has sent IFRAME_READY (so listener exists) */
  const pendingLoadRef = useRef<Record<string, string | null> | null | undefined>(undefined);
  /** Time of last initial server load; used to ignore cached onSnapshot that would overwrite fresh data */
  const lastServerLoadAtRef = useRef<number>(0);

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

  /* ---- Tell iframe to reload from localStorage (when we have no cloud payload) ---- */
  const tellIframeToReload = useCallback(() => {
    const iframe = iframeRef.current;
    if (!iframe?.contentWindow) return;
    iframe.contentWindow.postMessage({ type: "DATA_READY" }, "*");
  }, []);

  /* ---- Send Firestore data directly to iframe ---- */
  const sendInjectData = useCallback(
    (storage: Record<string, string | null>) => {
      const iframe = iframeRef.current;
      if (!iframe?.contentWindow || !storage || Object.keys(storage).length === 0) return;
      iframe.contentWindow.postMessage({ type: "INJECT_DATA", storage }, "*");
    },
    []
  );

  /** Send pending Firestore payload to iframe only when iframe is ready (has sent IFRAME_READY). */
  const flushPendingToIframe = useCallback(() => {
    if (!iframeReadyRef.current || !iframeRef.current?.contentWindow) return;
    if (pendingLoadRef.current === undefined) return; // Firestore not loaded yet
    sendSessionToIframe();
    const payload = pendingLoadRef.current;
    setTimeout(() => {
      if (payload && Object.keys(payload).length > 0) {
        sendInjectData(payload);
      } else {
        tellIframeToReload();
      }
    }, 400);
  }, [sendSessionToIframe, sendInjectData, tellIframeToReload]);

  /** Return false if this storage would overwrite Firestore with blank/partial strategic plan */
  const isStrategicPlanBlank = useCallback(
    (storage: Record<string, string | null>): boolean => {
      const planKey = Object.keys(storage).find((k) => k.startsWith("prototype_strategicPlan_"));
      if (!planKey) return false;
      const raw = storage[planKey];
      if (!raw || raw.length < 50) return true;
      try {
        const plan = JSON.parse(raw) as Record<string, unknown>;
        const hasContent =
          (plan.vision && String(plan.vision).trim()) ||
          (plan.mission && String(plan.mission).trim()) ||
          (plan.values && String(plan.values).trim()) ||
          (plan.strengths && String(plan.strengths).trim()) ||
          (Array.isArray(plan.goals) && plan.goals.length > 0);
        return !hasContent;
      } catch {
        return true;
      }
    },
    []
  );

  /* ---- Save current localStorage state to Firestore ---- */
  const pushToCloud = useCallback(
    async (force = false) => {
      if (!uid || resolvedKeys.length === 0) return;
      if (isLoadingFromCloudRef.current) return; // Don't save during cloud load

      const current = readLocalStorage(resolvedKeys);

      if (!force) {
        if (storageEqual(current, lastSavedSnapshotRef.current)) return;
        const last = lastSavedSnapshotRef.current;
        if (
          toolId === "strategic_planning" &&
          isStrategicPlanBlank(current) &&
          last &&
          Object.keys(last).length > 0 &&
          !isStrategicPlanBlank(last)
        )
          return;
      }

      try {
        await saveToolStorage(uid, toolId, current);
        lastSavedSnapshotRef.current = { ...current };
        setStatus("Saved to cloud ✓");
      } catch (err) {
        console.error("[CloudToolFrame] Save to cloud failed:", err);
        setStatus("Cloud save failed — will retry");
      }
    },
    [uid, toolId, resolvedKeys, isStrategicPlanBlank]
  );

  /* ---- Load from cloud (button): fetch from Firestore and inject into iframe ---- */
  const loadFromCloud = useCallback(async () => {
    if (!uid || resolvedKeys.length === 0) return;
    setStatus("Loading from cloud...");
    try {
      const payload = await loadToolStorage(uid, toolId);
      if (payload?.storage && Object.keys(payload.storage).length > 0) {
        writeLocalStorage(payload.storage);
        lastSavedSnapshotRef.current = { ...payload.storage };
        lastServerLoadAtRef.current = Date.now();
        sendInjectData(payload.storage);
        setStatus("Loaded from cloud ✓");
      } else {
        setStatus("No cloud data");
      }
    } catch (err) {
      console.error("[CloudToolFrame] Load from cloud failed:", err);
      setStatus("Load failed");
    }
  }, [uid, toolId, sendInjectData]);

  /* ---- Save to cloud (button): tell iframe to flush form, then push ---- */
  const saveToCloud = useCallback(() => {
    if (!uid || !iframeRef.current?.contentWindow) return;
    setStatus("Saving...");
    iframeRef.current.contentWindow.postMessage({ type: "SAVE_NOW" }, "*");
    setTimeout(() => {
      pushToCloud(true);
    }, 400);
  }, [uid, pushToCloud]);

  /* ---- Main effect: load from cloud, start sync ---- */
  useEffect(() => {
    if (!uid || resolvedKeys.length === 0) return;

    let cancelled = false;
    let unsubFirestore: (() => void) | null = null;
    iframeReadyRef.current = false;
    pendingLoadRef.current = undefined;

    async function initialize() {
      setStatus("Loading from cloud...");
      isLoadingFromCloudRef.current = true;
      let loadedStorage: Record<string, string | null> | null = null;

      try {
        const payload = await loadToolStorage(uid!, toolId);
        if (cancelled) return;

        if (payload?.storage && Object.keys(payload.storage).length > 0) {
          loadedStorage = payload.storage;
          writeLocalStorage(payload.storage);
          lastSavedSnapshotRef.current = { ...payload.storage };
          lastServerLoadAtRef.current = Date.now();
          setStatus("Cloud data loaded ✓");
        } else {
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

      pendingLoadRef.current = loadedStorage ?? null;
      flushPendingToIframe();

      // 3. Poll localStorage and push to cloud (first run soon, then every 3s)
      if (pollIntervalRef.current) clearInterval(pollIntervalRef.current);
      const doPoll = () => {
        if (!isLoadingFromCloudRef.current) pushToCloud();
      };
      setTimeout(doPoll, 600);
      pollIntervalRef.current = setInterval(doPoll, 3000);

      // 4. Listen for real-time Firestore updates (cross-device sync)
      unsubFirestore = onToolStorageChange(uid!, toolId, (payload, meta) => {
        if (cancelled) return;
        if (!payload?.storage) return;

        // Don't overwrite fresh server load with stale cache: ignore cache events for 4s after initial load
        if (meta.fromCache && Date.now() - lastServerLoadAtRef.current < 4000) {
          return;
        }

        // Check if this is different from what we last saved
        const current = readLocalStorage(resolvedKeys);
        if (!storageEqual(payload.storage, current)) {
          isLoadingFromCloudRef.current = true;
          writeLocalStorage(payload.storage);
          lastSavedSnapshotRef.current = { ...payload.storage };
          sendInjectData(payload.storage);
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
  }, [uid, toolId, resolvedKeys.join(","), flushPendingToIframe]);

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

  /* ---- Handle iframe messages: IFRAME_READY, PUSH_NOW, REQUEST_SIGNOUT ---- */
  useEffect(() => {
    const handler = (e: MessageEvent) => {
      if (e.data?.type === "IFRAME_READY") {
        iframeReadyRef.current = true;
        flushPendingToIframe();
      }
      if (e.data?.type === "PUSH_NOW") {
        pushToCloud();
      }
      if (e.data?.type === "REQUEST_SIGNOUT") {
        signOut();
      }
    };
    window.addEventListener("message", handler);
    return () => window.removeEventListener("message", handler);
  }, [flushPendingToIframe, signOut, pushToCloud]);

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
        <div className="toolBarActions" style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
          <button
            type="button"
            className="btnPrimary"
            onClick={saveToCloud}
          >
            💾 Save to cloud
          </button>
          <button
            type="button"
            className="btnSecondary"
            onClick={loadFromCloud}
          >
            📥 Load from cloud
          </button>
          <Link className="btnSecondary" href="/app">
            ← Back to Dashboard
          </Link>
          <button
            className="btnSecondary"
            type="button"
            onClick={() => {
              pushToCloud(true);
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
