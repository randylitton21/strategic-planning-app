import Link from "next/link";
import PageTitleCard from "../_components/PageTitleCard";

export default function PricingPage() {
  return (
    <div className="container">
      <PageTitleCard
        title="Pricing"
        subtitle="Beta is about learning. We’re keeping this simple while we collect feedback and make the tools stronger."
        actions={
          <Link className="btnPrimary" href="/app">
            Open the App
          </Link>
        }
      />
      <div style={{ marginTop: 14 }} className="grid2">
        <div className="card">
          <h2 style={{ marginBottom: 6 }}>Beta Access</h2>
          <p className="muted">
            Free during beta. You get access to the full suite, and when you
            sign in, your work can sync across devices.
          </p>
        </div>
        <div className="card">
          <h2 style={{ marginBottom: 6 }}>Full Launch</h2>
          <p className="muted">
            Pricing comes later. First we figure out what actually helps
            people and what needs improvement.
          </p>
        </div>
      </div>
    </div>
  );
}

