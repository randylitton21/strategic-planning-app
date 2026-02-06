"use client";

import Link from "next/link";
import { useAuth } from "@/lib/authContext";

const allTools = [
  { href: "/app/strategic-planning", title: "Strategic Planning Guide" },
  { href: "/app/financial-report", title: "Personal Financial Report" },
  { href: "/app/porters-five-forces", title: "Porter's Five Forces" },
  { href: "/app/strategic-action-plan", title: "Strategic Action Plan" },
  { href: "/app/goal-setting-template", title: "Goal Setting Template" },
  { href: "/app/strategic-canvas", title: "Strategic Canvas" },
  { href: "/app/contingency-plan", title: "Contingency Plan" },
  { href: "/app/product-canvas", title: "Product Canvas" },
];

const guestTools = [
  { href: "/app/strategic-planning", title: "Strategic Planning Guide" },
];

export default function AppToolList() {
  const { user, isLoading } = useAuth();

  const tools = user ? allTools : guestTools;

  const handleShowOnboarding = () => {
    localStorage.removeItem("sps_onboarding_completed");
    window.location.reload();
  };

  return (
    <div className="grid2">
      <div className="card">
        <h2 style={{ marginBottom: 8 }}>Open Homepage or Pick a tool</h2>
        <p className="muted" style={{ marginBottom: 12 }}>
          {user
            ? "Start at the app homepage for the main planning flow, or jump to any tool below."
            : "Start at the homepage or try the Strategic Planning Guide. Sign in to access all tools and sync your work across devices."}
        </p>
        <Link
          className="btnPrimary"
          href="/app/home"
          style={{ display: "inline-block", marginBottom: 14 }}
        >
          Open Homepage
        </Link>
        <p className="muted" style={{ marginBottom: 8, fontSize: 14 }}>Or pick a tool:</p>
        <div style={{ display: "grid", gap: 10 }}>
          {tools.map((t) => (
            <Link key={t.href} className="btnSecondary" href={t.href}>
              {t.title}
            </Link>
          ))}
        </div>
        {!user && !isLoading && (
          <p className="muted" style={{ marginTop: 12 }}>
            Sign in to unlock: Financial Report, Porter's Five Forces, Action
            Plan, Goal Setting, Strategic Canvas, Contingency Plan, Product
            Canvas.
          </p>
        )}
      </div>

      <div className="card">
        <h2 style={{ marginBottom: 8 }}>Beta notes</h2>
        <ul style={{ paddingLeft: 18, color: "var(--muted)" }}>
          <li>Your work auto-saves as you go.</li>
          <li>Sign in if you want your work to sync across devices.</li>
          <li>
            If something feels confusing, that's not on you. Tell us and we'll
            fix it.
          </li>
        </ul>
        <button
          className="btnSecondary"
          onClick={handleShowOnboarding}
          style={{ marginTop: 12, width: "100%", fontSize: 14 }}
        >
          📖 Take Tour
        </button>
      </div>
    </div>
  );
}
