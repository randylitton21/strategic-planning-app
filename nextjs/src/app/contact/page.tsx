import Link from "next/link";
import PageTitleCard from "../_components/PageTitleCard";

export default function ContactPage() {
  return (
    <div className="container">
      <PageTitleCard
        title="Contact"
        subtitle="Beta feedback is welcome (and needed). That’s how this gets better."
        actions={
          <Link className="btnPrimary" href="/app">
            Open the App
          </Link>
        }
      />
      <div className="card" style={{ marginTop: 14 }}>
        <p className="muted" style={{ marginBottom: 12 }}>
          If something feels confusing, clunky, or slow, tell us.
        </p>
        <p className="muted">
          We’ll add a simple feedback link inside the dashboard. For now, the
          easiest option is to keep a quick note of what happened (what tool you
          used, what you clicked, and what you expected).
        </p>
      </div>
    </div>
  );
}

