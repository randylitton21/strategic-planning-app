"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/authContext";

export default function LoginPage() {
  const { signIn, signUp, user, signOut } = useAuth();
  const router = useRouter();
  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isBusy, setIsBusy] = useState(false);

  async function handleSubmit() {
    setError(null);
    setIsBusy(true);
    try {
      if (mode === "signin") {
        await signIn(email, password);
      } else {
        await signUp(email, password);
      }
      router.push("/app");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not sign in.");
    } finally {
      setIsBusy(false);
    }
  }

  return (
    <div className="container">
      <div className="card">
        <h1 style={{ marginBottom: 10 }}>Sign In</h1>
        {user ? (
          <>
            <p className="muted" style={{ marginBottom: 12 }}>
              You’re signed in as <strong>{user.email}</strong>.
            </p>
            <div className="buttonRow">
              <button
                className="btnSecondary"
                type="button"
                onClick={() => router.push("/app")}
              >
                Go to Dashboard
              </button>
              <button className="btnPrimary" type="button" onClick={signOut}>
                Sign Out
              </button>
            </div>
          </>
        ) : (
          <>
            <p className="muted" style={{ marginBottom: 12 }}>
              Use your email and a password. This will save your work and sync
              it across devices during beta.
            </p>

            <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
              <button
                type="button"
                className={mode === "signin" ? "btnPrimary" : "btnSecondary"}
                onClick={() => setMode("signin")}
              >
                Sign In
              </button>
              <button
                type="button"
                className={mode === "signup" ? "btnPrimary" : "btnSecondary"}
                onClick={() => setMode("signup")}
              >
                Create Account
              </button>
            </div>

            <div style={{ marginTop: 14, display: "grid", gap: 10 }}>
              <label style={{ display: "grid", gap: 6 }}>
                <span className="muted">Email</span>
                <input
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="card"
                  style={{ padding: 12 }}
                  type="email"
                  placeholder="you@example.com"
                />
              </label>

              <label style={{ display: "grid", gap: 6 }}>
                <span className="muted">Password</span>
                <input
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="card"
                  style={{ padding: 12 }}
                  type="password"
                  placeholder="At least 6 characters"
                />
              </label>

              {error ? (
                <div className="card" style={{ borderColor: "rgba(244,67,54,.4)" }}>
                  <strong>Login problem:</strong> {error}
                </div>
              ) : null}

              <button
                className="btnPrimary"
                type="button"
                disabled={isBusy || !email || !password}
                onClick={handleSubmit}
              >
                {isBusy
                  ? "Working..."
                  : mode === "signin"
                    ? "Sign In"
                    : "Create Account"}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

