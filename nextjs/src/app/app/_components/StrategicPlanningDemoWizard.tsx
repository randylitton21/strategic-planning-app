"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/authContext";

type DemoData = {
  businessName: string;
  yourName: string;
  vision: string;
  mission: string;
  values: string;
};

export default function StrategicPlanningDemoWizard({
  isOpen,
  onClose,
}: {
  isOpen: boolean;
  onClose: () => void;
}) {
  const [step, setStep] = useState(0);
  const [showPreview, setShowPreview] = useState(false);
  const [showVideo, setShowVideo] = useState<string | null>(null);
  const { user } = useAuth();
  const router = useRouter();

  const [demoData, setDemoData] = useState<DemoData>({
    businessName: "",
    yourName: "",
    vision: "",
    mission: "",
    values: "",
  });

  const handleNext = () => {
    if (step < wizardSteps.length - 1) {
      setStep(step + 1);
    } else {
      // Show preview
      setShowPreview(true);
    }
  };

  const handleSaveAndContinue = () => {
    // If user is signed in, save to their account (future: actually save to Firestore)
    if (user) {
      // Save demo data to Strategic Planning tool
      const storageKey = `prototype_strategicPlan_${user.uid}`;
      const strategicPlanData = {
        businessName: demoData.businessName,
        yourName: demoData.yourName,
        step1: {
          vision: demoData.vision,
          mission: demoData.mission,
          values: demoData.values.split("\n").filter(v => v.trim()),
        },
      };
      localStorage.setItem(storageKey, JSON.stringify(strategicPlanData));
      onClose();
      router.push("/app/strategic-planning");
    } else {
      // Prompt to sign up
      router.push("/app/login");
    }
  };

  const wizardSteps = [
    {
      field: "businessName",
      title: "What is the name of your business?",
      subtitle: "If you haven't decided yet, use a working name — you can change it anytime.",
      placeholder: "e.g., Acme Consulting, Sarah's Bakery, TechFlow Solutions",
      helpText: "This is just for you — it helps personalize your plan and makes it feel real.",
      type: "short" as const,
    },
    {
      field: "yourName",
      title: "What is your name?",
      subtitle: "The person creating this strategic plan.",
      placeholder: "e.g., John Smith",
      helpText: "We'll use this to personalize your plan and in any reports you generate.",
      type: "short" as const,
    },
    {
      field: "vision",
      title: "What is your Vision?",
      subtitle: "Where do you want your business to be in 5-10 years? Dream big.",
      placeholder: "e.g., To become the leading eco-friendly packaging supplier in the Northeast, known for innovation and sustainability.",
      helpText: "Your vision is your North Star — it's aspirational and inspiring. Think about the ultimate impact you want to have.",
      videoTitle: "Understanding Vision Statements",
      videoEmbed: "https://www.youtube.com/embed/6y4WX2VhQjQ", // HBR example
      examples: [
        "To be the most trusted financial advisor for small business owners in our region",
        "To revolutionize how restaurants source local ingredients through technology",
        "To help 10,000 families achieve financial independence through education",
      ],
      type: "long" as const,
    },
    {
      field: "mission",
      title: "What is your Mission?",
      subtitle: "What does your business do, and for whom? This is more concrete than vision.",
      placeholder: "e.g., We provide sustainable packaging solutions to small businesses, helping them reduce environmental impact while maintaining quality and affordability.",
      helpText: "Your mission is operational — it describes what you do today to work toward your vision. Be specific about who you serve and what value you provide.",
      videoTitle: "Crafting a Mission Statement",
      videoEmbed: "https://www.youtube.com/embed/LJhG3HZ7b4o", // HBR example
      examples: [
        "We help first-time homebuyers navigate the mortgage process with transparent advice and personalized support",
        "We deliver fresh, organic meal kits to busy professionals who care about health but don't have time to cook",
        "We provide affordable web design and digital marketing to local small businesses",
      ],
      type: "long" as const,
    },
    {
      field: "values",
      title: "What are your Core Values?",
      subtitle: "3-5 principles that guide how you make decisions and treat people.",
      placeholder: "Enter one value per line:\nIntegrity\nCustomer-first mindset\nContinuous improvement\nTransparency\nSustainability",
      helpText: "Core values aren't just words on a wall — they're decision-making filters. When you're not sure what to do, your values give you the answer.",
      videoTitle: "Defining Core Values",
      videoEmbed: "https://www.youtube.com/embed/YXPY1CoGGV8", // HBR example
      examples: [
        "Honesty, Quality, Innovation, Community, Sustainability",
        "Integrity, Collaboration, Excellence, Accountability, Respect",
        "Customer Focus, Transparency, Creativity, Results, Fun",
      ],
      type: "long" as const,
    },
  ];

  const currentWizardStep = wizardSteps[step];
  const isComplete = currentWizardStep
    ? demoData[currentWizardStep.field as keyof DemoData].trim().length > 0
    : false;

  if (!isOpen) return null;

  // Preview Document Screen
  if (showPreview) {
    return (
      <div
        style={{
          position: "fixed",
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: "rgba(0, 0, 0, 0.75)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          zIndex: 2000,
          padding: 20,
          backdropFilter: "blur(6px)",
        }}
      >
        <div
          className="card"
          style={{
            maxWidth: 800,
            width: "100%",
            maxHeight: "90vh",
            overflow: "auto",
            boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.5)",
          }}
        >
          {/* Document Preview */}
          <div style={{ marginBottom: 24 }}>
            <div style={{ textAlign: "center", marginBottom: 24, paddingBottom: 20, borderBottom: "3px solid var(--primary)" }}>
              <h1 style={{ fontSize: 32, marginBottom: 8, color: "var(--primary)" }}>Strategic Plan</h1>
              <p style={{ fontSize: 18, fontWeight: 600 }}>{demoData.businessName}</p>
              <p style={{ fontSize: 14, color: "var(--muted)" }}>Prepared by: {demoData.yourName}</p>
              <p style={{ fontSize: 13, color: "var(--muted)" }}>Date: {new Date().toLocaleDateString()}</p>
            </div>

            <div style={{ marginBottom: 24 }}>
              <h2 style={{ fontSize: 20, marginBottom: 10, color: "var(--primary)" }}>Vision Statement</h2>
              <div style={{ padding: 16, background: "var(--surface)", borderRadius: 8, border: "1px solid var(--border)" }}>
                <p style={{ fontSize: 15, lineHeight: 1.7 }}>{demoData.vision}</p>
              </div>
            </div>

            <div style={{ marginBottom: 24 }}>
              <h2 style={{ fontSize: 20, marginBottom: 10, color: "var(--primary)" }}>Mission Statement</h2>
              <div style={{ padding: 16, background: "var(--surface)", borderRadius: 8, border: "1px solid var(--border)" }}>
                <p style={{ fontSize: 15, lineHeight: 1.7 }}>{demoData.mission}</p>
              </div>
            </div>

            <div style={{ marginBottom: 24 }}>
              <h2 style={{ fontSize: 20, marginBottom: 10, color: "var(--primary)" }}>Core Values</h2>
              <div style={{ padding: 16, background: "var(--surface)", borderRadius: 8, border: "1px solid var(--border)" }}>
                <ul style={{ paddingLeft: 20, fontSize: 15, lineHeight: 1.9 }}>
                  {demoData.values.split("\n").filter(v => v.trim()).map((value, idx) => (
                    <li key={idx}>{value.trim()}</li>
                  ))}
                </ul>
              </div>
            </div>
          </div>

          {/* Actions */}
          {user ? (
            <div style={{ padding: 20, background: "#f0fdf4", borderRadius: 10, border: "2px solid #22c55e", marginBottom: 16 }}>
              <p style={{ fontSize: 15, fontWeight: 600, color: "#15803d", marginBottom: 10 }}>
                ✅ Great start! This will be saved to your account.
              </p>
              <p style={{ fontSize: 14, color: "#15803d", marginBottom: 16 }}>
                When you open the Strategic Planning Guide, you'll see these answers in Step 1. Continue from there to complete your full strategic plan.
              </p>
              <button
                className="btnPrimary"
                onClick={handleSaveAndContinue}
                style={{ width: "100%", padding: "14px", fontSize: 15 }}
              >
                Save & Open Strategic Planning Guide →
              </button>
            </div>
          ) : (
            <div style={{ padding: 20, background: "#fef3c7", borderRadius: 10, border: "2px solid #fbbf24", marginBottom: 16 }}>
              <p style={{ fontSize: 15, fontWeight: 600, color: "#92400e", marginBottom: 10 }}>
                ⚠️ Want to save this work?
              </p>
              <p style={{ fontSize: 14, color: "#92400e", marginBottom: 16 }}>
                You've made a great start, but this won't be saved unless you create an account. It only takes 30 seconds and is completely free during beta.
              </p>
              <div style={{ display: "grid", gap: 10 }}>
                <button
                  className="btnPrimary"
                  onClick={handleSaveAndContinue}
                  style={{ padding: "14px", fontSize: 15 }}
                >
                  Create Account & Save
                </button>
                <button
                  className="btnSecondary"
                  onClick={onClose}
                  style={{ padding: "12px", fontSize: 14 }}
                >
                  Exit Without Saving
                </button>
              </div>
            </div>
          )}

          <button
            className="btnSecondary"
            onClick={() => setShowPreview(false)}
            style={{ width: "100%", fontSize: 14 }}
          >
            ← Back to Edit
          </button>
        </div>
      </div>
    );
  }

  // Video Modal
  if (showVideo) {
    return (
      <div
        style={{
          position: "fixed",
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: "rgba(0, 0, 0, 0.85)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          zIndex: 2001,
          padding: 20,
        }}
        onClick={() => setShowVideo(null)}
      >
        <div
          style={{
            maxWidth: 900,
            width: "100%",
            background: "white",
            borderRadius: 12,
            overflow: "hidden",
            boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.5)",
          }}
          onClick={(e) => e.stopPropagation()}
        >
          <div style={{ padding: 16, borderBottom: "1px solid var(--border)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <h3 style={{ margin: 0, fontSize: 18 }}>{showVideo}</h3>
            <button
              onClick={() => setShowVideo(null)}
              style={{
                background: "transparent",
                border: "none",
                fontSize: 28,
                cursor: "pointer",
                color: "var(--muted)",
              }}
            >
              ×
            </button>
          </div>
          <div style={{ position: "relative", paddingBottom: "56.25%", height: 0 }}>
            <iframe
              src={wizardSteps.find(s => s.videoTitle === showVideo)?.videoEmbed}
              title={showVideo}
              style={{
                position: "absolute",
                top: 0,
                left: 0,
                width: "100%",
                height: "100%",
                border: "none",
              }}
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
            />
          </div>
          <div style={{ padding: 16, background: "var(--surface)" }}>
            <button className="btnPrimary" onClick={() => setShowVideo(null)} style={{ width: "100%", fontSize: 14 }}>
              Continue with Demo
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (!isOpen) return null;

  const currentStep = wizardSteps[step];
  const currentValue = demoData[currentStep.field as keyof DemoData];

  return (
    <div
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        background: "rgba(0, 0, 0, 0.75)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        zIndex: 2000,
        padding: 20,
        backdropFilter: "blur(6px)",
      }}
    >
      <div
        className="card"
        style={{
          maxWidth: 650,
          width: "100%",
          maxHeight: "90vh",
          overflow: "auto",
          boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.5)",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div style={{ marginBottom: 20 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 16 }}>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 12, color: "var(--muted)", marginBottom: 4, fontWeight: 600 }}>
                GUIDED DEMO · STEP 1: VISION & MISSION
              </div>
              <h2 style={{ margin: 0, fontSize: 24, lineHeight: 1.2 }}>{currentStep.title}</h2>
              <p style={{ marginTop: 6, fontSize: 14, color: "var(--muted)" }}>{currentStep.subtitle}</p>
            </div>
            <button
              onClick={onClose}
              style={{
                background: "transparent",
                border: "none",
                fontSize: 28,
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
          {/* Progress */}
          <div style={{ display: "flex", gap: 6, marginBottom: 8 }}>
            {wizardSteps.map((_, idx) => (
              <div
                key={idx}
                style={{
                  flex: 1,
                  height: 6,
                  background: idx <= step ? "var(--primary)" : "var(--border)",
                  borderRadius: 3,
                }}
              />
            ))}
          </div>
          <p style={{ fontSize: 12, color: "var(--muted)", textAlign: "right" }}>
            Question {step + 1} of {wizardSteps.length}
          </p>
        </div>

        {/* Help Text */}
        <div style={{ marginBottom: 16, padding: 14, background: "#f0f9ff", borderRadius: 8, border: "1px solid #0ea5e9" }}>
          <p style={{ fontSize: 14, color: "#0369a1" }}>
            💡 {currentStep.helpText}
          </p>
        </div>

        {/* Video & Examples (for long fields) */}
        {currentStep.type === "long" && (
          <div style={{ marginBottom: 16, display: "grid", gap: 10 }}>
            {currentStep.videoTitle && (
              <button
                className="btnSecondary"
                onClick={() => setShowVideo(currentStep.videoTitle!)}
                style={{ textAlign: "left", padding: "12px 16px", fontSize: 14 }}
              >
                <span style={{ marginRight: 8 }}>📺</span>
                Watch: {currentStep.videoTitle}
              </button>
            )}
            {currentStep.examples && (
              <details style={{ padding: 12, background: "var(--surface)", borderRadius: 8, border: "1px solid var(--border)" }}>
                <summary style={{ cursor: "pointer", fontWeight: 600, fontSize: 14, color: "var(--primary)" }}>
                  📋 See Examples
                </summary>
                <ul style={{ marginTop: 10, paddingLeft: 20, fontSize: 13, color: "var(--muted)", lineHeight: 1.8 }}>
                  {currentStep.examples.map((ex, idx) => (
                    <li key={idx}>{ex}</li>
                  ))}
                </ul>
              </details>
            )}
          </div>
        )}

        {/* Input Field */}
        <div style={{ marginBottom: 20 }}>
          <label style={{ display: "block", marginBottom: 8, fontWeight: 600, fontSize: 14 }}>
            Your Answer:
          </label>
          {currentStep.type === "short" ? (
            <input
              type="text"
              value={currentValue}
              onChange={(e) =>
                setDemoData({ ...demoData, [currentStep.field]: e.target.value })
              }
              placeholder={currentStep.placeholder}
              className="card"
              style={{
                width: "100%",
                padding: "14px",
                fontSize: 15,
                border: "2px solid var(--border)",
              }}
              autoFocus
            />
          ) : (
            <textarea
              value={currentValue}
              onChange={(e) =>
                setDemoData({ ...demoData, [currentStep.field]: e.target.value })
              }
              placeholder={currentStep.placeholder}
              className="card"
              rows={currentStep.field === "values" ? 6 : 4}
              style={{
                width: "100%",
                padding: "14px",
                fontSize: 15,
                border: "2px solid var(--border)",
                resize: "vertical",
                fontFamily: "inherit",
              }}
              autoFocus
            />
          )}
        </div>

        {/* Navigation */}
        <div style={{ display: "flex", gap: 10, justifyContent: "space-between" }}>
          <button
            className="btnSecondary"
            onClick={() => setStep(step - 1)}
            disabled={step === 0}
            style={{
              opacity: step === 0 ? 0.4 : 1,
              cursor: step === 0 ? "not-allowed" : "pointer",
              visibility: step === 0 ? "hidden" : "visible",
            }}
          >
            ← Previous
          </button>
          <div style={{ display: "flex", gap: 10 }}>
            <button
              className="btnSecondary"
              onClick={onClose}
              style={{ fontSize: 14 }}
            >
              Exit Demo
            </button>
            <button
              className="btnPrimary"
              onClick={handleNext}
              disabled={!isComplete}
              style={{
                opacity: isComplete ? 1 : 0.5,
                cursor: isComplete ? "pointer" : "not-allowed",
              }}
            >
              {step === wizardSteps.length - 1 ? "Show Preview →" : "Next →"}
            </button>
          </div>
        </div>

        {!isComplete && (
          <p style={{ marginTop: 12, fontSize: 13, color: "var(--muted)", textAlign: "center" }}>
            Please answer to continue
          </p>
        )}
      </div>
    </div>
  );
}
