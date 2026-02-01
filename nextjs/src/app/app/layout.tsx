"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuth } from "@/lib/authContext";
import { isFirebaseConfigured } from "@/lib/firebaseClient";
import PageTitleCard from "../_components/PageTitleCard";

function isToolRoute(pathname: string | null) {
  if (!pathname || pathname === "/app" || pathname === "/app/login")
    return false;
  return pathname.startsWith("/app/");
}

export default function AppLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const pathname = usePathname();
  const inTool = isToolRoute(pathname);
  const { user, isLoading, signOut } = useAuth();

  if (inTool) {
    return <>{children}</>;
  }

  return (
    <div className="container">
      <PageTitleCard
        title="App Dashboard"
        subtitle={
          isLoading
            ? "Loading..."
            : !isFirebaseConfigured
              ? "Setup needed: add Firebase env vars to enable login + sync."
              : user
                ? `Signed in as ${user.email ?? "your account"}`
                : "Guest mode (local save only)"
        }
        actions={
          <>
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
          </>
        }
      />

      <div style={{ marginTop: 14 }}>{children}</div>
    </div>
  );
}

