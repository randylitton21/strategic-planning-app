"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/authContext";

const ONBOARDING_KEY = "sps_onboarding_completed";

export default function OnboardingModal() {
  const [isOpen, setIsOpen] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const [userType, setUserType] = useState<string | null>(null);
  const [hasWatchedVideos, setHasWatchedVideos] = useState(false);
  const router = useRouter();
  const { user } = useAuth();

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

  const handleStartPlanning = () => {
    handleClose();
    router.push("/app/strategic-planning");
  };

  const steps = [
    {
      title: "Welcome! Let's Build Your Business Plan",
      content: (
        <>
          <p style={{ marginBottom: 20, fontSize: 17, lineHeight: 1.6 }}>
            Whether you're starting from scratch or refining an existing business, this suite will guide you through <strong>everything you need</strong> to create a real, actionable plan.
          </p>
          <div style={{ marginBottom: 20, padding: 20, background: "#f0f9ff", borderRadius: 10, border: "2px solid #0ea5e9" }}>
            <p style={{ fontSize: 15, marginBottom: 12, fontWeight: 600, color: "#0369a1" }}>
              ✨ First, tell us about yourself:
            </p>
            <div style={{ display: "grid", gap: 10 }}>
              <button
                className={userType === "new" ? "btnPrimary" : "btnSecondary"}
                onClick={() => setUserType("new")}
                style={{ textAlign: "left", padding: "12px 16px" }}
              >
                <div style={{ fontWeight: 600, marginBottom: 4 }}>🌱 I'm just starting a business</div>
                <div style={{ fontSize: 13, opacity: 0.8 }}>New to business planning, need step-by-step guidance</div>
              </button>
              <button
                className={userType === "existing" ? "btnPrimary" : "btnSecondary"}
                onClick={() => setUserType("existing")}
                style={{ textAlign: "left", padding: "12px 16px" }}
              >
                <div style={{ fontWeight: 600, marginBottom: 4 }}>📈 I have a business already</div>
                <div style={{ fontSize: 13, opacity: 0.8 }}>Looking to improve strategy, planning, or growth</div>
              </button>
            </div>
          </div>
          <p style={{ fontSize: 14, color: "var(--muted)", textAlign: "center" }}>
            {userType ? "Perfect! Let's show you the right path →" : "Choose one to continue"}
          </p>
        </>
      ),
      canProceed: userType !== null,
    },
    {
      title: "Your Strategic Planning Journey",
      content: (
        <>
          <p style={{ marginBottom: 16, fontSize: 16, lineHeight: 1.6 }}>
            {userType === "new" 
              ? "Here's the proven path successful entrepreneurs follow. We'll guide you through each step."
              : "Here's the complete framework to refine and strengthen your business strategy."}
          </p>
          <div style={{ marginBottom: 20, padding: 18, background: "var(--surface)", borderRadius: 10, border: "2px solid var(--primary)" }}>
            <p style={{ fontSize: 15, fontWeight: 700, marginBottom: 12, color: "var(--primary)" }}>
              📖 Strategic Planning Guide — The 7-Step Process
            </p>
            <div style={{ display: "grid", gap: 10, fontSize: 14 }}>
              <div style={{ display: "flex", gap: 12, alignItems: "flex-start" }}>
                <span style={{ fontWeight: 700, color: "var(--primary)" }}>1</span>
                <div><strong>Vision & Mission</strong> — Define what you're building and why it matters</div>
              </div>
              <div style={{ display: "flex", gap: 12, alignItems: "flex-start" }}>
                <span style={{ fontWeight: 700, color: "var(--primary)" }}>2</span>
                <div><strong>Core Values</strong> — Establish the principles that guide decisions</div>
              </div>
              <div style={{ display: "flex", gap: 12, alignItems: "flex-start" }}>
                <span style={{ fontWeight: 700, color: "var(--primary)" }}>3</span>
                <div><strong>SWOT Analysis</strong> — Identify Strengths, Weaknesses, Opportunities, Threats</div>
              </div>
              <div style={{ display: "flex", gap: 12, alignItems: "flex-start" }}>
                <span style={{ fontWeight: 700, color: "var(--primary)" }}>4</span>
                <div><strong>Strategic Objectives</strong> — Set high-level business objectives</div>
              </div>
              <div style={{ display: "flex", gap: 12, alignItems: "flex-start" }}>
                <span style={{ fontWeight: 700, color: "var(--primary)" }}>5</span>
                <div><strong>Strategic Goals</strong> — Create measurable, actionable goals</div>
              </div>
              <div style={{ display: "flex", gap: 12, alignItems: "flex-start" }}>
                <span style={{ fontWeight: 700, color: "var(--primary)" }}>6</span>
                <div><strong>Action Planning</strong> — Break goals into concrete tasks</div>
              </div>
              <div style={{ display: "flex", gap: 12, alignItems: "flex-start" }}>
                <span style={{ fontWeight: 700, color: "var(--primary)" }}>7</span>
                <div><strong>Review & Adjust</strong> — Set up regular check-ins and adjustments</div>
              </div>
            </div>
          </div>
          <div style={{ padding: 16, background: "#fef3c7", borderRadius: 8, border: "1px solid #fbbf24" }}>
            <p style={{ fontSize: 14, color: "#92400e" }}>
              <strong>📺 Video Tutorials:</strong> Every step includes Harvard Business Review videos and practical examples to guide you.
            </p>
          </div>
        </>
      ),
      canProceed: true,
    },
    {
      title: "What You'll See: Strategic Planning Screen",
      content: (
        <>
          <p style={{ marginBottom: 16, fontSize: 16, lineHeight: 1.6 }}>
            When you open the <strong>Strategic Planning Guide</strong>, here's what you'll work with:
          </p>
          <div style={{ marginBottom: 16, padding: 16, background: "var(--surface)", borderRadius: 10, border: "1px solid var(--border)" }}>
            <div style={{ marginBottom: 12, padding: 12, background: "#dbeafe", borderRadius: 6 }}>
              <p style={{ fontSize: 13, color: "#1e3a8a", marginBottom: 4 }}>
                <strong>Top Navigation Bar</strong> — Jump between all planning tools
              </p>
            </div>
            <div style={{ marginBottom: 12, padding: 12, background: "#dbeafe", borderRadius: 6 }}>
              <p style={{ fontSize: 13, color: "#1e3a8a", marginBottom: 4 }}>
                <strong>Progress Dots (Left Sidebar)</strong> — See which step you're on
              </p>
            </div>
            <div style={{ marginBottom: 12, padding: 12, background: "#dbeafe", borderRadius: 6 }}>
              <p style={{ fontSize: 13, color: "#1e3a8a", marginBottom: 4 }}>
                <strong>Main Content Area</strong> — Text fields, dropdowns, examples for each step
              </p>
            </div>
            <div style={{ padding: 12, background: "#dbeafe", borderRadius: 6 }}>
              <p style={{ fontSize: 13, color: "#1e3a8a", marginBottom: 4 }}>
                <strong>Educational Sidebar (Right)</strong> — Learn buttons, video tutorials, templates
              </p>
            </div>
          </div>
          <div style={{ padding: 16, background: "#fef3c7", borderRadius: 8, border: "1px solid #fbbf24", marginBottom: 16 }}>
            <p style={{ fontSize: 14, color: "#92400e", marginBottom: 8 }}>
              <strong>💡 Pro Tip:</strong>
            </p>
            <p style={{ fontSize: 14, color: "#92400e" }}>
              Don't try to complete everything in one sitting. Work through 1-2 steps at a time, save, and come back. The app auto-saves every change.
            </p>
          </div>
          <div style={{ padding: 16, background: "#f0fdf4", borderRadius: 8, border: "1px solid #22c55e" }}>
            <p style={{ fontSize: 14, color: "#15803d" }}>
              <strong>📺 Look for the "Learn" buttons</strong> in every step — they open educational resources including HBR videos that explain concepts in depth.
            </p>
          </div>
        </>
      ),
      canProceed: true,
    },
    {
      title: "Step 2: Goals & Action Planning",
      content: (
        <>
          <p style={{ marginBottom: 16, fontSize: 16, lineHeight: 1.6 }}>
            After defining your strategy, you'll turn it into <strong>specific, measurable goals and concrete actions</strong>.
          </p>
          <div style={{ display: "grid", gap: 14, marginBottom: 20 }}>
            <div style={{ padding: 16, background: "var(--surface)", borderRadius: 10, border: "2px solid var(--border)" }}>
              <p style={{ fontSize: 15, fontWeight: 700, marginBottom: 10 }}>🎯 Goal Setting Template</p>
              <p style={{ fontSize: 14, color: "var(--muted)", marginBottom: 12 }}>
                Transform your strategic goals into <strong>SMART goals</strong>:
              </p>
              <ul style={{ paddingLeft: 20, fontSize: 13, color: "var(--muted)", lineHeight: 1.8 }}>
                <li><strong>S</strong>pecific — Exactly what you'll achieve</li>
                <li><strong>M</strong>easurable — Numbers you can track</li>
                <li><strong>A</strong>chievable — Realistic for your resources</li>
                <li><strong>R</strong>elevant — Aligned with your vision</li>
                <li><strong>T</strong>ime-bound — Clear deadline</li>
              </ul>
            </div>
            <div style={{ padding: 16, background: "var(--surface)", borderRadius: 10, border: "2px solid var(--border)" }}>
              <p style={{ fontSize: 15, fontWeight: 700, marginBottom: 10 }}>📋 Strategic Action Plan</p>
              <p style={{ fontSize: 14, color: "var(--muted)", marginBottom: 8 }}>
                Break each goal into actionable tasks with:
              </p>
              <ul style={{ paddingLeft: 20, fontSize: 13, color: "var(--muted)", lineHeight: 1.8 }}>
                <li>Who's responsible</li>
                <li>When it's due</li>
                <li>What resources you need</li>
                <li>How you'll measure success</li>
              </ul>
            </div>
          </div>
          <p style={{ fontSize: 14, color: "var(--muted)", textAlign: "center", fontStyle: "italic" }}>
            {userType === "new" 
              ? "This is where ideas become real work — don't skip this step!"
              : "This turns your strategy into an executable roadmap."}
          </p>
        </>
      ),
      canProceed: true,
    },
    {
      title: "Step 3: Understand Your Market",
      content: (
        <>
          <p style={{ marginBottom: 16, fontSize: 16, lineHeight: 1.6 }}>
            Before you launch (or grow), you need to <strong>understand the competitive landscape</strong> and where you fit.
          </p>
          <div style={{ display: "grid", gap: 14, marginBottom: 20 }}>
            <div style={{ padding: 16, background: "var(--surface)", borderRadius: 10, border: "2px solid var(--border)" }}>
              <p style={{ fontSize: 15, fontWeight: 700, marginBottom: 10 }}>⚔️ Porter's Five Forces</p>
              <p style={{ fontSize: 14, color: "var(--muted)", marginBottom: 12 }}>
                Analyze the <strong>five competitive forces</strong> that shape your industry:
              </p>
              <ul style={{ paddingLeft: 20, fontSize: 13, color: "var(--muted)", lineHeight: 1.8 }}>
                <li>Threat of new competitors entering</li>
                <li>Bargaining power of suppliers</li>
                <li>Bargaining power of customers</li>
                <li>Threat of substitute products</li>
                <li>Rivalry among existing competitors</li>
              </ul>
              <p style={{ fontSize: 13, color: "var(--muted)", marginTop: 10, fontStyle: "italic" }}>
                📺 Includes Harvard Business Review video explaining the framework
              </p>
            </div>
            <div style={{ padding: 16, background: "var(--surface)", borderRadius: 10, border: "2px solid var(--border)" }}>
              <p style={{ fontSize: 15, fontWeight: 700, marginBottom: 10 }}>🎨 Strategic Canvas</p>
              <p style={{ fontSize: 14, color: "var(--muted)", marginBottom: 8 }}>
                Visual map showing how you compare to competitors across key factors.
              </p>
              <p style={{ fontSize: 13, color: "var(--muted)", fontStyle: "italic" }}>
                You'll plot your business vs competitors on factors like price, quality, service, innovation, etc.
              </p>
            </div>
          </div>
          <div style={{ padding: 14, background: "#fef3c7", borderRadius: 8, border: "1px solid #fbbf24" }}>
            <p style={{ fontSize: 14, color: "#92400e" }}>
              <strong>When to use:</strong> {userType === "new" ? "Do this before you finalize your business model" : "Review quarterly or when entering new markets"}
            </p>
          </div>
        </>
      ),
      canProceed: true,
    },
    {
      title: "Step 4: Product Strategy & Risk Planning",
      content: (
        <>
          <p style={{ marginBottom: 16, fontSize: 16, lineHeight: 1.6 }}>
            Now refine your <strong>product offering</strong> and prepare for <strong>potential risks</strong>.
          </p>
          <div style={{ display: "grid", gap: 14, marginBottom: 20 }}>
            <div style={{ padding: 16, background: "var(--surface)", borderRadius: 10, border: "2px solid var(--border)" }}>
              <p style={{ fontSize: 15, fontWeight: 700, marginBottom: 10 }}>📊 Product Canvas</p>
              <p style={{ fontSize: 14, color: "var(--muted)", marginBottom: 12 }}>
                A comprehensive view of your product strategy:
              </p>
              <ul style={{ paddingLeft: 20, fontSize: 13, color: "var(--muted)", lineHeight: 1.8 }}>
                <li><strong>Target Markets</strong> — Who are your customers?</li>
                <li><strong>Channels</strong> — How do you reach them?</li>
                <li><strong>Pricing</strong> — What's your pricing strategy?</li>
                <li><strong>Competition</strong> — Who are you up against?</li>
                <li><strong>Differentiators</strong> — What makes you unique?</li>
                <li><strong>Trends & Risks</strong> — Market dynamics</li>
              </ul>
            </div>
            <div style={{ padding: 16, background: "var(--surface)", borderRadius: 10, border: "2px solid var(--border)" }}>
              <p style={{ fontSize: 15, fontWeight: 700, marginBottom: 10 }}>🛡️ Contingency Plan</p>
              <p style={{ fontSize: 14, color: "var(--muted)", marginBottom: 8 }}>
                Prepare for disruptions before they happen:
              </p>
              <ul style={{ paddingLeft: 20, fontSize: 13, color: "var(--muted)", lineHeight: 1.8 }}>
                <li>Economic crises (recession, market crash)</li>
                <li>Operational disruptions (supply chain, tech failure)</li>
                <li>Natural disasters & emergencies</li>
                <li>Cybersecurity threats</li>
              </ul>
              <p style={{ fontSize: 13, color: "var(--muted)", marginTop: 10 }}>
                For each risk: define triggers, response plans, resources needed, and recovery steps.
              </p>
            </div>
          </div>
          <p style={{ fontSize: 14, color: "var(--muted)", textAlign: "center", fontStyle: "italic" }}>
            These tools help you think through "what if" scenarios before they become problems.
          </p>
        </>
      ),
      canProceed: true,
    },
    {
      title: "Step 5: Personal Financial Health",
      content: (
        <>
          <p style={{ marginBottom: 16, fontSize: 16, lineHeight: 1.6 }}>
            Don't forget yourself! {userType === "new" ? "Starting a business is hard — make sure you can sustain yourself." : "Your personal finances affect your business decisions."}
          </p>
          <div style={{ padding: 18, background: "var(--surface)", borderRadius: 10, border: "2px solid var(--border)", marginBottom: 20 }}>
            <p style={{ fontSize: 15, fontWeight: 700, marginBottom: 12 }}>💰 Personal Financial Report</p>
            <p style={{ fontSize: 14, color: "var(--muted)", marginBottom: 12 }}>
              A guided, step-by-step assessment of your personal finances:
            </p>
            <ol style={{ paddingLeft: 20, fontSize: 14, color: "var(--muted)", lineHeight: 1.8 }}>
              <li><strong>Income</strong> — Track all income sources</li>
              <li><strong>Fixed Expenses</strong> — Housing, utilities, insurance (needs)</li>
              <li><strong>Discretionary Spending</strong> — Entertainment, dining, subscriptions (wants)</li>
              <li><strong>Financial Overview</strong> — See your 50/30/20 budget breakdown</li>
              <li><strong>Reduction Planner</strong> — Identify where to cut expenses</li>
              <li><strong>Action Plan</strong> — Create your financial improvement plan</li>
            </ol>
          </div>
          <div style={{ padding: 14, background: "#dcfce7", borderRadius: 8, border: "1px solid #22c55e" }}>
            <p style={{ fontSize: 14, color: "#15803d" }}>
              <strong>✅ Real talk:</strong> You'll be asked tough questions about spending. Be honest — the tool uses the 50/30/20 rule to show you where you stand.
            </p>
          </div>
        </>
      ),
      canProceed: true,
    },
    {
      title: "🎓 Learning Resources Built In",
      content: (
        <>
          <p style={{ marginBottom: 16, fontSize: 16, lineHeight: 1.6 }}>
            Every tool includes <strong>educational resources</strong> so you're never stuck wondering "What do I write here?"
          </p>
          <div style={{ display: "grid", gap: 12, marginBottom: 20 }}>
            <div style={{ padding: 14, background: "#f0f9ff", borderRadius: 8, border: "1px solid #0ea5e9" }}>
              <p style={{ fontSize: 14, fontWeight: 600, marginBottom: 6, color: "#0369a1" }}>📺 Video Tutorials</p>
              <p style={{ fontSize: 13, color: "#0c4a6e" }}>
                Harvard Business Review videos explain concepts like SWOT, Porter's Five Forces, and strategic planning frameworks
              </p>
            </div>
            <div style={{ padding: 14, background: "#f0f9ff", borderRadius: 8, border: "1px solid #0ea5e9" }}>
              <p style={{ fontSize: 14, fontWeight: 600, marginBottom: 6, color: "#0369a1" }}>📋 Templates & Examples</p>
              <p style={{ fontSize: 13, color: "#0c4a6e" }}>
                Load pre-built templates for different business types and see real examples
              </p>
            </div>
            <div style={{ padding: 14, background: "#f0f9ff", borderRadius: 8, border: "1px solid #0ea5e9" }}>
              <p style={{ fontSize: 14, fontWeight: 600, marginBottom: 6, color: "#0369a1" }}>❓ Contextual Help</p>
              <p style={{ fontSize: 13, color: "#0c4a6e" }}>
                Click the "?" or "Learn" buttons throughout the app for explanations and guidance
              </p>
            </div>
          </div>
          <label style={{ display: "flex", alignItems: "center", gap: 10, padding: 14, background: "var(--surface)", borderRadius: 8, cursor: "pointer" }}>
            <input
              type="checkbox"
              checked={hasWatchedVideos}
              onChange={(e) => setHasWatchedVideos(e.target.checked)}
              style={{ width: 18, height: 18, cursor: "pointer" }}
            />
            <span style={{ fontSize: 14 }}>I understand there are videos and examples to help me</span>
          </label>
        </>
      ),
      canProceed: true,
    },
    {
      title: "🔄 How the Tools Work Together",
      content: (
        <>
          <p style={{ marginBottom: 16, fontSize: 16, lineHeight: 1.6 }}>
            {userType === "new" 
              ? "Here's the recommended order for building your first business plan:"
              : "Here's how the tools complement each other:"}
          </p>
          <div style={{ display: "grid", gap: 10, marginBottom: 20 }}>
            <div style={{ display: "flex", gap: 12, alignItems: "flex-start", padding: 12, background: "#f0f9ff", borderRadius: 8 }}>
              <span style={{ fontWeight: 700, fontSize: 18, color: "#0369a1" }}>1</span>
              <div>
                <p style={{ fontWeight: 600, fontSize: 14, marginBottom: 4 }}>Start: Strategic Planning Guide</p>
                <p style={{ fontSize: 13, color: "#0c4a6e" }}>Complete the 7-step process — this is your foundation</p>
              </div>
            </div>
            <div style={{ display: "flex", gap: 12, alignItems: "flex-start", padding: 12, background: "#f0fdf4", borderRadius: 8 }}>
              <span style={{ fontWeight: 700, fontSize: 18, color: "#15803d" }}>2</span>
              <div>
                <p style={{ fontWeight: 600, fontSize: 14, marginBottom: 4 }}>Refine: Goal Setting + Action Plan</p>
                <p style={{ fontSize: 13, color: "#14532d" }}>Turn Step 5 & 6 goals into detailed SMART goals and tasks</p>
              </div>
            </div>
            <div style={{ display: "flex", gap: 12, alignItems: "flex-start", padding: 12, background: "#fef3c7", borderRadius: 8 }}>
              <span style={{ fontWeight: 700, fontSize: 18, color: "#92400e" }}>3</span>
              <div>
                <p style={{ fontWeight: 600, fontSize: 14, marginBottom: 4 }}>Analyze: Porter's Five Forces + Strategic Canvas</p>
                <p style={{ fontSize: 13, color: "#78350f" }}>Deep dive into competitive analysis and positioning</p>
              </div>
            </div>
            <div style={{ display: "flex", gap: 12, alignItems: "flex-start", padding: 12, background: "#fce7f3", borderRadius: 8 }}>
              <span style={{ fontWeight: 700, fontSize: 18, color: "#9f1239" }}>4</span>
              <div>
                <p style={{ fontWeight: 600, fontSize: 14, marginBottom: 4 }}>Prepare: Product Canvas + Contingency Plan</p>
                <p style={{ fontSize: 13, color: "#831843" }}>Product strategy and risk mitigation</p>
              </div>
            </div>
            <div style={{ display: "flex", gap: 12, alignItems: "flex-start", padding: 12, background: "#f3e8ff", borderRadius: 8 }}>
              <span style={{ fontWeight: 700, fontSize: 18, color: "#6b21a8" }}>5</span>
              <div>
                <p style={{ fontWeight: 600, fontSize: 14, marginBottom: 4 }}>Personal: Financial Report</p>
                <p style={{ fontSize: 13, color: "#581c87" }}>Ensure your personal finances support your business goals</p>
              </div>
            </div>
          </div>
          <p style={{ fontSize: 13, color: "var(--muted)", textAlign: "center" }}>
            You don't have to use every tool — pick what's relevant for your situation.
          </p>
        </>
      ),
      canProceed: true,
    },
    {
      title: user ? "🚀 You're Ready to Start!" : "🚀 One More Thing...",
      content: (
        <>
          {!user ? (
            <>
              <p style={{ marginBottom: 16, fontSize: 16, lineHeight: 1.6 }}>
                You can use everything in <strong>guest mode</strong>, but signing in gives you:
              </p>
              <div style={{ marginBottom: 20, padding: 18, background: "#f0fdf4", borderRadius: 10, border: "2px solid #22c55e" }}>
                <ul style={{ paddingLeft: 20, fontSize: 14, color: "#15803d", lineHeight: 2 }}>
                  <li><strong>Sync across devices</strong> — Phone, laptop, tablet</li>
                  <li><strong>Never lose work</strong> — Cloud backup</li>
                  <li><strong>Access all tools</strong> — Unlock the full suite</li>
                  <li><strong>100% free during beta</strong> — No credit card needed</li>
                </ul>
              </div>
              <div style={{ display: "grid", gap: 10, marginBottom: 20 }}>
                <Link
                  href="/app/login"
                  className="btnPrimary"
                  style={{ textAlign: "center", padding: "14px 20px", fontSize: 15 }}
                  onClick={handleClose}
                >
                  Sign In / Create Account
                </Link>
                <button
                  className="btnSecondary"
                  style={{ padding: "12px 16px", fontSize: 14 }}
                  onClick={handleNext}
                >
                  Continue as Guest
                </button>
              </div>
            </>
          ) : (
            <>
              <p style={{ marginBottom: 20, fontSize: 16, lineHeight: 1.6 }}>
                You're signed in as <strong>{user.email}</strong> — your work will sync across devices.
              </p>
              <div style={{ padding: 18, background: "#f0fdf4", borderRadius: 10, border: "2px solid #22c55e", marginBottom: 20 }}>
                <p style={{ fontSize: 14, color: "#15803d", marginBottom: 8 }}>
                  <strong>✅ You're all set!</strong>
                </p>
                <p style={{ fontSize: 14, color: "#15803d" }}>
                  Everything you do will auto-save and sync. Start wherever makes sense for you.
                </p>
              </div>
            </>
          )}
          <div style={{ padding: 20, background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)", borderRadius: 10, color: "white" }}>
            <p style={{ fontSize: 15, fontWeight: 700, marginBottom: 10, textAlign: "center" }}>
              🎯 Ready to Build Your Plan?
            </p>
            <p style={{ fontSize: 14, marginBottom: 16, opacity: 0.95, textAlign: "center" }}>
              {userType === "new"
                ? "Start with the Strategic Planning Guide — it will walk you through everything step by step."
                : "Jump to any tool, or start at the homepage for the full workflow overview."}
            </p>
            <button
              className="btnPrimary"
              onClick={handleStartPlanning}
              style={{ width: "100%", background: "white", color: "#667eea", padding: "14px 20px", fontSize: 15, fontWeight: 700 }}
            >
              {userType === "new" 
                ? "Start Strategic Planning Now →" 
                : "Open Strategic Planning Guide →"}
            </button>
            <button
              className="btnSecondary"
              onClick={handleClose}
              style={{ width: "100%", marginTop: 10, background: "rgba(255,255,255,0.2)", color: "white", border: "1px solid rgba(255,255,255,0.3)", padding: "12px 16px" }}
            >
              Explore Tools First
            </button>
          </div>
        </>
      ),
      canProceed: true,
    },
  ];

  if (!isOpen) return null;

  const step = steps[currentStep];
  const isFirstStep = currentStep === 0;
  const isLastStep = currentStep === steps.length - 1;
  const canProceed = step.canProceed !== false;

  return (
    <div
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        background: "rgba(0, 0, 0, 0.65)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        zIndex: 1000,
        padding: 20,
        backdropFilter: "blur(4px)",
      }}
      onClick={handleClose}
    >
      <div
        className="card"
        style={{
          maxWidth: 650,
          width: "100%",
          maxHeight: "90vh",
          overflow: "auto",
          position: "relative",
          boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.4)",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div style={{ marginBottom: 20 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 16 }}>
            <h2 style={{ margin: 0, fontSize: 24, lineHeight: 1.2 }}>{step.title}</h2>
            <button
              onClick={handleClose}
              style={{
                background: "transparent",
                border: "none",
                fontSize: 28,
                cursor: "pointer",
                padding: 0,
                color: "var(--muted)",
                lineHeight: 1,
                transition: "color 0.2s",
              }}
              onMouseEnter={(e) => (e.currentTarget.style.color = "var(--text)")}
              onMouseLeave={(e) => (e.currentTarget.style.color = "var(--muted)")}
              aria-label="Close"
            >
              ×
            </button>
          </div>
          {/* Progress bar */}
          <div style={{ display: "flex", gap: 6, marginBottom: 8 }}>
            {steps.map((_, idx) => (
              <div
                key={idx}
                style={{
                  flex: 1,
                  height: 6,
                  background: idx <= currentStep ? "var(--primary)" : "var(--border)",
                  borderRadius: 3,
                  transition: "background 0.3s",
                }}
              />
            ))}
          </div>
          <p style={{ fontSize: 12, color: "var(--muted)", textAlign: "right" }}>
            Step {currentStep + 1} of {steps.length}
          </p>
        </div>

        {/* Content */}
        <div style={{ marginBottom: 24 }}>{step.content}</div>

        {/* Navigation */}
        <div style={{ display: "flex", gap: 10, justifyContent: "space-between", alignItems: "center" }}>
          <button
            className="btnSecondary"
            onClick={handlePrev}
            disabled={isFirstStep}
            style={{ 
              opacity: isFirstStep ? 0.4 : 1, 
              cursor: isFirstStep ? "not-allowed" : "pointer",
              visibility: isFirstStep ? "hidden" : "visible"
            }}
          >
            ← Previous
          </button>
          <div style={{ display: "flex", gap: 10 }}>
            {!isLastStep && (
              <button 
                className="btnSecondary" 
                onClick={handleClose}
                style={{ fontSize: 14 }}
              >
                Skip Tour
              </button>
            )}
            {!isLastStep && (
              <button 
                className="btnPrimary" 
                onClick={handleNext}
                disabled={!canProceed}
                style={{ 
                  opacity: canProceed ? 1 : 0.5,
                  cursor: canProceed ? "pointer" : "not-allowed"
                }}
              >
                Next →
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
