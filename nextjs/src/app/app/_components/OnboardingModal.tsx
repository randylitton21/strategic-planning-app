"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

const ONBOARDING_KEY = "sps_onboarding_completed";

export default function OnboardingModal() {
  const [isOpen, setIsOpen] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);

  useEffect(() => {
    // Check if user has seen onboarding
    const hasSeenOnboarding = localStorage.getItem(ONBOARDING_KEY);
    if (!hasSeenOnboarding) {
      setIsOpen(true);
    }
  }, []);

  const handleClose = () => {
    localStorage.setItem(ONBOARDING_KEY, "true");
    setIsOpen(false);
  };

  const handleNext = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      handleClose();
    }
  };

  const handlePrev = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const steps = [
    {
      title: "Welcome to Strategic Planning Suite",
      content: (
        <>
          <p style={{ marginBottom: 16, fontSize: 16, lineHeight: 1.6 }}>
            Your complete toolkit for <strong>strategic planning, business development, and personal finance</strong>.
          </p>
          <p style={{ marginBottom: 16, color: "var(--muted)" }}>
            This quick tour will show you everything the app can do. You can revisit this anytime by clicking "Take Tour" in the app.
          </p>
          <div style={{ padding: 16, background: "var(--surface)", borderRadius: 8, border: "1px solid var(--border)" }}>
            <p style={{ fontSize: 14, color: "var(--muted)", marginBottom: 8 }}>
              <strong>Beta Note:</strong>
            </p>
            <ul style={{ paddingLeft: 20, color: "var(--muted)", fontSize: 14 }}>
              <li>Your work auto-saves as you go</li>
              <li>Sign in to sync across devices</li>
              <li>All tools are free during beta</li>
            </ul>
          </div>
        </>
      ),
    },
    {
      title: "🏠 App Homepage",
      content: (
        <>
          <p style={{ marginBottom: 16, fontSize: 16, lineHeight: 1.6 }}>
            The <strong>App Homepage</strong> is your starting point — a welcome screen with an introduction to the planning workflow and links to all tools.
          </p>
          <div style={{ padding: 16, background: "var(--surface)", borderRadius: 8, border: "1px solid var(--border)" }}>
            <p style={{ fontSize: 14, marginBottom: 8 }}>
              <strong>💡 Start Here:</strong>
            </p>
            <p style={{ fontSize: 14, color: "var(--muted)" }}>
              Click <strong>"Open Homepage"</strong> to see the main welcome screen with guidance on how to use the suite.
            </p>
          </div>
        </>
      ),
    },
    {
      title: "📖 Strategic Planning Guide",
      content: (
        <>
          <p style={{ marginBottom: 16, fontSize: 16, lineHeight: 1.6 }}>
            The core of the app: a <strong>7-step guided workflow</strong> that takes you from vision to execution.
          </p>
          <div style={{ padding: 16, background: "var(--surface)", borderRadius: 8, border: "1px solid var(--border)", marginBottom: 16 }}>
            <p style={{ fontSize: 14, fontWeight: 600, marginBottom: 8 }}>The 7 Steps:</p>
            <ol style={{ paddingLeft: 20, fontSize: 14, color: "var(--muted)", lineHeight: 1.8 }}>
              <li>Vision & Mission</li>
              <li>Core Values</li>
              <li>SWOT Analysis</li>
              <li>Strategic Objectives</li>
              <li>Strategic Goals (SMART)</li>
              <li>Action Planning</li>
              <li>Review & Adjust</li>
            </ol>
          </div>
          <p style={{ fontSize: 14, color: "var(--muted)" }}>
            Each step includes guidance, examples, and educational resources to help you build a complete strategic plan.
          </p>
        </>
      ),
    },
    {
      title: "🎯 Specialized Planning Tools",
      content: (
        <>
          <p style={{ marginBottom: 16, fontSize: 16, lineHeight: 1.6 }}>
            Beyond the main guide, the suite includes <strong>specialized tools</strong> for deeper analysis and planning:
          </p>
          <div style={{ display: "grid", gap: 12 }}>
            <div style={{ padding: 12, background: "var(--surface)", borderRadius: 8, border: "1px solid var(--border)" }}>
              <p style={{ fontWeight: 600, fontSize: 14, marginBottom: 4 }}>🎯 Goal Setting Template</p>
              <p style={{ fontSize: 13, color: "var(--muted)" }}>Create SMART goals with deadlines, success metrics, and action steps</p>
            </div>
            <div style={{ padding: 12, background: "var(--surface)", borderRadius: 8, border: "1px solid var(--border)" }}>
              <p style={{ fontWeight: 600, fontSize: 14, marginBottom: 4 }}>⚔️ Porter's Five Forces</p>
              <p style={{ fontSize: 13, color: "var(--muted)" }}>Analyze competitive forces in your industry</p>
            </div>
            <div style={{ padding: 12, background: "var(--surface)", borderRadius: 8, border: "1px solid var(--border)" }}>
              <p style={{ fontWeight: 600, fontSize: 14, marginBottom: 4 }}>🎨 Strategic Canvas</p>
              <p style={{ fontSize: 13, color: "var(--muted)" }}>Visual strategy mapping and competitive positioning</p>
            </div>
            <div style={{ padding: 12, background: "var(--surface)", borderRadius: 8, border: "1px solid var(--border)" }}>
              <p style={{ fontWeight: 600, fontSize: 14, marginBottom: 4 }}>📋 Strategic Action Plan</p>
              <p style={{ fontSize: 13, color: "var(--muted)" }}>Turn goals into actionable tasks with timelines</p>
            </div>
          </div>
        </>
      ),
    },
    {
      title: "🛡️ Risk & Product Tools",
      content: (
        <>
          <p style={{ marginBottom: 16, fontSize: 16, lineHeight: 1.6 }}>
            Additional tools for <strong>risk management and product strategy</strong>:
          </p>
          <div style={{ display: "grid", gap: 12 }}>
            <div style={{ padding: 12, background: "var(--surface)", borderRadius: 8, border: "1px solid var(--border)" }}>
              <p style={{ fontWeight: 600, fontSize: 14, marginBottom: 4 }}>🛡️ Contingency Plan</p>
              <p style={{ fontSize: 13, color: "var(--muted)" }}>Prepare for risks with response plans for potential disruptions</p>
            </div>
            <div style={{ padding: 12, background: "var(--surface)", borderRadius: 8, border: "1px solid var(--border)" }}>
              <p style={{ fontWeight: 600, fontSize: 14, marginBottom: 4 }}>📊 Product Canvas</p>
              <p style={{ fontSize: 13, color: "var(--muted)" }}>Map your product strategy: markets, channels, pricing, competition</p>
            </div>
            <div style={{ padding: 12, background: "var(--surface)", borderRadius: 8, border: "1px solid var(--border)" }}>
              <p style={{ fontWeight: 600, fontSize: 14, marginBottom: 4 }}>💰 Personal Financial Report</p>
              <p style={{ fontSize: 13, color: "var(--muted)" }}>Track income, expenses, and identify savings opportunities</p>
            </div>
          </div>
        </>
      ),
    },
    {
      title: "🚀 Ready to Get Started?",
      content: (
        <>
          <p style={{ marginBottom: 16, fontSize: 16, lineHeight: 1.6 }}>
            Here's how to dive in:
          </p>
          <div style={{ display: "grid", gap: 12, marginBottom: 16 }}>
            <div style={{ padding: 16, background: "var(--surface)", borderRadius: 8, border: "2px solid var(--primary)" }}>
              <p style={{ fontWeight: 700, fontSize: 15, marginBottom: 8, color: "var(--primary)" }}>
                1️⃣ Click "Open Homepage"
              </p>
              <p style={{ fontSize: 14, color: "var(--muted)" }}>
                Start at the welcome screen to see the full planning workflow and get context
              </p>
            </div>
            <div style={{ padding: 16, background: "var(--surface)", borderRadius: 8, border: "1px solid var(--border)" }}>
              <p style={{ fontWeight: 700, fontSize: 15, marginBottom: 8 }}>
                2️⃣ Pick a Tool
              </p>
              <p style={{ fontSize: 14, color: "var(--muted)" }}>
                Jump directly to any tool — Strategic Planning Guide is recommended for first-timers
              </p>
            </div>
            <div style={{ padding: 16, background: "var(--surface)", borderRadius: 8, border: "1px solid var(--border)" }}>
              <p style={{ fontWeight: 700, fontSize: 15, marginBottom: 8 }}>
                3️⃣ Sign In (Optional)
              </p>
              <p style={{ fontSize: 14, color: "var(--muted)" }}>
                Create an account to sync your work across devices — but you can try everything in guest mode first
              </p>
            </div>
          </div>
          <div style={{ padding: 16, background: "#f0f9ff", borderRadius: 8, border: "1px solid #0ea5e9" }}>
            <p style={{ fontSize: 14, color: "#0369a1" }}>
              <strong>💡 Tip:</strong> Your work auto-saves as you go, so you won't lose progress even if you close your browser.
            </p>
          </div>
        </>
      ),
    },
  ];

  if (!isOpen) return null;

  const step = steps[currentStep];
  const isFirstStep = currentStep === 0;
  const isLastStep = currentStep === steps.length - 1;

  return (
    <div
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        background: "rgba(0, 0, 0, 0.6)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        zIndex: 1000,
        padding: 20,
      }}
      onClick={handleClose}
    >
      <div
        className="card"
        style={{
          maxWidth: 600,
          width: "100%",
          maxHeight: "90vh",
          overflow: "auto",
          position: "relative",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <div style={{ marginBottom: 20 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 16 }}>
            <h2 style={{ margin: 0, fontSize: 24 }}>{step.title}</h2>
            <button
              onClick={handleClose}
              style={{
                background: "transparent",
                border: "none",
                fontSize: 24,
                cursor: "pointer",
                padding: 0,
                color: "var(--muted)",
                lineHeight: 1,
              }}
              aria-label="Close"
            >
              ×
            </button>
          </div>
          <div style={{ display: "flex", gap: 6, marginBottom: 20 }}>
            {steps.map((_, idx) => (
              <div
                key={idx}
                style={{
                  flex: 1,
                  height: 4,
                  background: idx <= currentStep ? "var(--primary)" : "var(--border)",
                  borderRadius: 2,
                }}
              />
            ))}
          </div>
        </div>

        <div style={{ marginBottom: 24 }}>{step.content}</div>

        <div style={{ display: "flex", gap: 10, justifyContent: "space-between" }}>
          <button
            className="btnSecondary"
            onClick={handlePrev}
            disabled={isFirstStep}
            style={{ opacity: isFirstStep ? 0.5 : 1, cursor: isFirstStep ? "not-allowed" : "pointer" }}
          >
            Previous
          </button>
          <div style={{ display: "flex", gap: 10 }}>
            <button className="btnSecondary" onClick={handleClose}>
              Skip Tour
            </button>
            <button className="btnPrimary" onClick={handleNext}>
              {isLastStep ? "Get Started" : "Next"}
            </button>
          </div>
        </div>

        <p style={{ marginTop: 16, textAlign: "center", fontSize: 13, color: "var(--muted)" }}>
          Step {currentStep + 1} of {steps.length}
        </p>
      </div>
    </div>
  );
}
