import Link from "next/link";

const tools = [
  { href: "/app/strategic-planning", title: "Strategic Planning Guide" },
  { href: "/app/financial-report", title: "Personal Financial Report" },
  { href: "/app/porters-five-forces", title: "Porter’s Five Forces" },
  { href: "/app/strategic-action-plan", title: "Strategic Action Plan" },
  { href: "/app/goal-setting-template", title: "Goal Setting Template" },
  { href: "/app/strategic-canvas", title: "Strategic Canvas" },
  { href: "/app/contingency-plan", title: "Contingency Plan" },
  { href: "/app/product-canvas", title: "Product Canvas" },
];

export default function AppHome() {
  return (
    <div className="grid2">
      <div className="card">
        <h2 style={{ marginBottom: 8 }}>Pick a tool</h2>
        <p className="muted" style={{ marginBottom: 12 }}>
          Everything is here. If you’re not sure where to start, open the
          Strategic Planning Guide first.
        </p>
        <div style={{ display: "grid", gap: 10 }}>
          {tools.map((t) => (
            <Link key={t.href} className="btnSecondary" href={t.href}>
              {t.title}
            </Link>
          ))}
        </div>
      </div>

      <div className="card">
        <h2 style={{ marginBottom: 8 }}>Beta notes</h2>
        <ul style={{ paddingLeft: 18, color: "var(--muted)" }}>
          <li>Your work auto-saves as you go.</li>
          <li>Sign in if you want your work to sync across devices.</li>
          <li>
            If something feels confusing, that’s not on you. Tell us and we’ll
            fix it.
          </li>
        </ul>
      </div>
    </div>
  );
}

