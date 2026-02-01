export default function Home() {
  return (
    <div className="container">
      <section className="hero">
        <div className="card">
          <h1>Make a real plan—and actually follow it.</h1>
          <p>
            Here’s the goal: help you think clearly, make smart decisions, and
            turn ideas into action. No fluff. Just tools that guide you step by
            step.
          </p>
          <div className="buttonRow">
            <a className="btnPrimary" href="/app">
              Open the App
            </a>
            <a className="btnSecondary" href="/pricing">
              See Pricing
            </a>
          </div>
        </div>

        <div className="card">
          <h2 style={{ marginBottom: 8 }}>What’s inside</h2>
          <ul style={{ paddingLeft: 18, color: "var(--muted)" }}>
            <li>Strategic planning workflow (vision → execution)</li>
            <li>Templates for goals, action plans, and strategy mapping</li>
            <li>Tools for product and market thinking</li>
            <li>Personal finance tools to help you make smarter decisions</li>
          </ul>
        </div>
      </section>

      <section style={{ marginTop: 18 }} className="grid3">
        <div className="card">
          <h3 style={{ marginBottom: 6 }}>Simple</h3>
          <p className="muted">
            Plain language. Clear steps. You won’t feel lost.
          </p>
        </div>
        <div className="card">
          <h3 style={{ marginBottom: 6 }}>Practical</h3>
          <p className="muted">
            Built to help you decide what to do next—and do it.
          </p>
        </div>
        <div className="card">
          <h3 style={{ marginBottom: 6 }}>All in one place</h3>
          <p className="muted">
            One login, one dashboard, and your work saves as you go.
          </p>
        </div>
      </section>
    </div>
  );
}
