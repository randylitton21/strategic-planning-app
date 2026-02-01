import Link from "next/link";
import PageTitleCard from "../_components/PageTitleCard";

export default function AboutPage() {
  return (
    <div className="container">
      <PageTitleCard
        title="About"
        subtitle="This suite is built to help you think clearly, plan wisely, and follow through."
        actions={
          <Link className="btnPrimary" href="/app">
            Open the App
          </Link>
        }
      />
      <div className="card" style={{ marginTop: 14 }}>
        <p className="muted" style={{ marginBottom: 12 }}>
          The goal is simple: turn ideas into action.
        </p>
        <p className="muted">
          During beta, the focus is usability and results. If something feels
          confusing or unnecessary, that’s exactly the kind of feedback we want.
        </p>
      </div>
    </div>
  );
}

