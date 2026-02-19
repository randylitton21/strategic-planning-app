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

/** Turn key specs into concrete storage key names for a given uid (used for Firestore and iframe payloads) */
function resolveKeys(uid: string, specs: StorageKeySpec[]): string[] {
  return specs.map((s) =>
    s.kind === "global" ? s.key : `${s.prefix}${uid}`
  );
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
  /** Firestore payload to inject when iframe sends IFRAME_READY */
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

  /* ---- Send cloud payload to iframe (no localStorage). Empty storage = clear form. ---- */
  const sendInjectData = useCallback(
    (storage: Record<string, string | null>) => {
      const iframe = iframeRef.current;
      if (!iframe?.contentWindow) return;
      iframe.contentWindow.postMessage(
        { type: "INJECT_DATA", storage: storage ?? {} },
        "*"
      );
    },
    []
  );

  /** Send pending Firestore payload to iframe when iframe is ready (no localStorage). */
  const flushPendingToIframe = useCallback(() => {
    if (!iframeReadyRef.current || !iframeRef.current?.contentWindow) return;
    if (pendingLoadRef.current === undefined) return; // Firestore not loaded yet
    sendSessionToIframe();
    const payload = pendingLoadRef.current ?? {};
    setTimeout(() => sendInjectData(payload), 400);
  }, [sendSessionToIframe, sendInjectData]);

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

  /* ---- Save to Firestore: merge iframe payload with last snapshot and write (no localStorage) ---- */
  const saveFromIframe = useCallback(
    async (storage: Record<string, string | null>) => {
      if (!uid || !storage || typeof storage !== "object") return;
      const merged = { ...lastSavedSnapshotRef.current, ...storage };
      if (toolId === "strategic_planning" && isStrategicPlanBlank(merged)) {
        const last = lastSavedSnapshotRef.current;
        if (last && Object.keys(last).length > 0 && !isStrategicPlanBlank(last)) return;
      }
      try {
        await saveToolStorage(uid, toolId, merged);
        lastSavedSnapshotRef.current = { ...merged };
        setStatus("Saved to cloud ✓");
      } catch (err) {
        console.error("[CloudToolFrame] Save to cloud failed:", err);
        setStatus("Cloud save failed — will retry");
      }
    },
    [uid, toolId, isStrategicPlanBlank]
  );

  /* ---- Load from cloud (button): fetch from Firestore and send to iframe (no localStorage) ---- */
  const loadFromCloud = useCallback(async () => {
    if (!uid || resolvedKeys.length === 0) return;
    setStatus("Loading from cloud...");
    try {
      const payload = await loadToolStorage(uid, toolId);
      const storage = payload?.storage ?? {};
      lastSavedSnapshotRef.current = { ...storage };
      lastServerLoadAtRef.current = Date.now();
      sendInjectData(storage);
      setStatus(Object.keys(storage).length > 0 ? "Loaded from cloud ✓" : "No cloud data");
    } catch (err) {
      console.error("[CloudToolFrame] Load from cloud failed:", err);
      setStatus("Load failed");
    }
  }, [uid, toolId, resolvedKeys.length, sendInjectData]);

  /* ---- Save to cloud (button): ask iframe to send SAVE_TO_CLOUD with current state ---- */
  const saveToCloud = useCallback(() => {
    if (!uid || !iframeRef.current?.contentWindow) return;
    setStatus("Saving...");
    iframeRef.current.contentWindow.postMessage({ type: "SAVE_NOW", forCloud: true }, "*");
  }, [uid]);

  /* ---- Main effect: load from cloud, no localStorage, no poll ---- */
  useEffect(() => {
    if (!uid || resolvedKeys.length === 0) return;

    let cancelled = false;
    let unsubFirestore: (() => void) | null = null;
    iframeReadyRef.current = false;
    pendingLoadRef.current = undefined;

    async function initialize() {
      lastServerLoadAtRef.current = Date.now();
      setStatus("Loading from cloud...");
      isLoadingFromCloudRef.current = true;
      let loadedStorage: Record<string, string | null> = {};

      try {
        const payload = await loadToolStorage(uid!, toolId);
        if (cancelled) return;
        loadedStorage = payload?.storage ?? {};
        lastSavedSnapshotRef.current = { ...loadedStorage };
        lastServerLoadAtRef.current = Date.now();
        setStatus(
          Object.keys(loadedStorage).length > 0 ? "Cloud data loaded ✓" : "No cloud data — starting fresh"
        );
      } catch (err) {
        console.error("[CloudToolFrame] Cloud load failed:", err);
        setStatus("Cloud load failed");
      }

      isLoadingFromCloudRef.current = false;
      pendingLoadRef.current = loadedStorage;
      flushPendingToIframe();

      // Realtime Firestore updates: send to iframe only (no localStorage)
      unsubFirestore = onToolStorageChange(uid!, toolId, (payload, meta) => {
        if (cancelled) return;
        if (!payload?.storage) return;
        if (meta.fromCache && Date.now() - lastServerLoadAtRef.current < 6000) return;
        if (!storageEqual(payload.storage, lastSavedSnapshotRef.current)) {
          isLoadingFromCloudRef.current = true;
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

  /* ---- Handle iframe messages: IFRAME_READY, SAVE_TO_CLOUD, REQUEST_SIGNOUT ---- */
  useEffect(() => {
    const handler = (e: MessageEvent) => {
      if (e.data?.type === "IFRAME_READY") {
        iframeReadyRef.current = true;
        flushPendingToIframe();
        loadFromCloud();
      }
      if (e.data?.type === "SAVE_TO_CLOUD" && e.data?.storage) {
        saveFromIframe(e.data.storage);
      }
      if (e.data?.type === "REQUEST_SIGNOUT") {
        signOut();
      }
    };
    window.addEventListener("message", handler);
    return () => window.removeEventListener("message", handler);
  }, [flushPendingToIframe, loadFromCloud, signOut, saveFromIframe]);

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
              iframeRef.current?.contentWindow?.postMessage({ type: "SAVE_NOW", forCloud: true }, "*");
              setTimeout(() => iframeRef.current?.contentWindow?.location.reload(), 800);
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
