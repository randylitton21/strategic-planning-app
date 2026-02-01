"use client";

import Link from "next/link";
import { useAuth } from "@/lib/authContext";
import { isFirebaseConfigured } from "@/lib/firebaseClient";

export default function AppLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const { user, isLoading, signOut } = useAuth();

  return (
    <div className="container">
      <div className="card" style={{ marginTop: 14 }}>
        <div
          style={{
            display: "flex",
            gap: 12,
            justifyContent: "space-between",
            alignItems: "center",
            flexWrap: "wrap",
          }}
        >
          <div>
            <h1 style={{ marginBottom: 2 }}>App Dashboard</h1>
            <div className="muted">
              {isLoading
                ? "Loading..."
                : !isFirebaseConfigured
                  ? "Setup needed: add Firebase env vars to enable login + sync."
                  : user
                    ? `Signed in as ${user.email ?? "your account"}`
                    : "Guest mode (local save only)"}
            </div>
          </div>

          <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
            <Link className="btnSecondary" href="/">
              Back to Site
            </Link>

            {user ? (
              <button className="btnPrimary" type="button" onClick={signOut}>
                Sign Out
              </button>
            ) : (
              <Link className="btnPrimary" href="/app/login">
                Sign In
              </Link>
            )}
          </div>
        </div>
      </div>

      <div style={{ marginTop: 14 }}>{children}</div>
    </div>
  );
}

