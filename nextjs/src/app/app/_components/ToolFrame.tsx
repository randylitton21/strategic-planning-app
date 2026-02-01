"use client";

import { useEffect, useMemo, useState } from "react";

type ToolFrameProps = {
  title: string;
  iframeSrc: string;
};

export default function ToolFrame({ title, iframeSrc }: ToolFrameProps) {
  const [nonce, setNonce] = useState(0);
  const src = useMemo(() => `${iframeSrc}${iframeSrc.includes("?") ? "&" : "?"}v=${nonce}`, [iframeSrc, nonce]);

  useEffect(() => {
    // Force a fresh load on first render.
    setNonce((n) => n + 1);
  }, []);

  return (
    <div className="card">
      <div style={{ display: "flex", justifyContent: "space-between", gap: 10, flexWrap: "wrap" }}>
        <div>
          <h1 style={{ marginBottom: 4 }}>{title}</h1>
          <div className="muted">Beta</div>
        </div>
        <button className="btnSecondary" type="button" onClick={() => setNonce((n) => n + 1)}>
          Reload Tool
        </button>
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

