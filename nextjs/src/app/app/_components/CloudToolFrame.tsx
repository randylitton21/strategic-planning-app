"use client";

import { useEffect, useRef } from "react";
import Link from "next/link";
import { useAuth } from "@/lib/authContext";

type StorageKeySpec =
  | { kind: "global"; key: string }
  | { kind: "uid"; prefix: string };

type CloudToolFrameProps = {
  toolId: string;
  title: string;
  iframeSrc: string;
  storageKeys: StorageKeySpec[];
};

function resolveKeys(uid: string | undefined, specs: StorageKeySpec[]) {
  return specs.map((s) => (s.kind === "global" ? s.key : `local_${s.key}`));
}

export default function CloudToolFrame({
  toolId,
  title,
  iframeSrc,
  storageKeys,
}: CloudToolFrameProps) {
  const { user } = useAuth();
  const iframeRef = useRef<HTMLIFrameElement>(null);

  // Simple iframe wrapper - just send user session for local storage
  useEffect(() => {
    const iframe = iframeRef.current;
    if (!iframe) return;

    // Send user session info
    const session = user ? {
      user: { username: user.uid },
      loginTime: new Date().toISOString(),
    } : {
      user: { username: 'guest' },
      loginTime: new Date().toISOString(),
    };

    const sendSession = () => {
      iframe.contentWindow?.postMessage(
        {
          type: "SET_USER_SESSION",
          session: session,
        },
        "*"
      );
    };

    // Send on load and when user changes
    iframe.addEventListener("load", sendSession);
    sendSession();

    return () => iframe.removeEventListener("load", sendSession);
  }, [user]);

  return (
    <div className="toolFrameWrap" style={{ minHeight: "calc(100vh - 52px)" }}>
      <div className="toolBar">
        <div className="muted" style={{ fontSize: 13 }}>
          {user ? "Signed in - data saves locally" : "Guest mode - local storage only"}
        </div>
        <div className="toolBarActions">
          <Link className="btnSecondary" href="/app">
            ← Back to Dashboard
          </Link>
          <button
            className="btnSecondary"
            type="button"
            onClick={() => {
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