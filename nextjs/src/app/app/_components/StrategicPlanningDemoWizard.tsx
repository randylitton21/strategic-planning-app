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
      videoTitle: "Strategic Planning Video Tutorial",
      videoEmbed: "https://www.youtube.com/embed/Z4_YNeVsZhw",
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
      videoTitle: "Strategic Planning Video Tutorial",
      videoEmbed: "https://www.youtube.com/embed/Z4_YNeVsZhw",
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
      videoTitle: "Strategic Planning Video Tutorial",
      videoEmbed: "https://www.youtube.com/embed/Z4_YNeVsZhw",
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
          style={{
            maxWidth: 900,
            width: "100%",
            maxHeight: "90vh",
            overflow: "auto",
            boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.5)",
            background: "white",
            borderRadius: 8,
          }}
        >
          {/* Professional Document Preview - Word/Excel Style */}
          <div style={{ 
            padding: "60px 80px", 
            background: "white",
            fontFamily: "'Calibri', 'Arial', sans-serif",
          }}>
            {/* Document Header - Professional Style */}
            <div style={{ 
              textAlign: "center", 
              marginBottom: 48,
              paddingBottom: 24,
              borderBottom: "3px double #2563eb",
            }}>
              <h1 style={{ 
                fontSize: 36, 
                marginBottom: 12, 
                color: "#1e40af",
                fontWeight: 700,
                letterSpacing: "0.5px",
                textTransform: "uppercase",
              }}>
                Strategic Business Plan
              </h1>
              <div style={{ 
                fontSize: 20, 
                fontWeight: 600,
                color: "#1f2937",
                marginTop: 16,
                marginBottom: 12,
              }}>
                {demoData.businessName}
              </div>
              <div style={{ 
                fontSize: 14, 
                color: "#6b7280",
                marginTop: 8,
                lineHeight: 1.6,
              }}>
                <div>Prepared by: <strong>{demoData.yourName}</strong></div>
                <div>Date: <strong>{new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</strong></div>
              </div>
            </div>

            {/* Vision Statement - Professional Format */}
            <div style={{ marginBottom: 36 }}>
              <div style={{ 
                fontSize: 22, 
                fontWeight: 700,
                color: "#1e40af",
                marginBottom: 14,
                paddingBottom: 8,
                borderBottom: "2px solid #e5e7eb",
                textTransform: "uppercase",
                letterSpacing: "0.5px",
              }}>
                Vision Statement
              </div>
              <div style={{ 
                padding: "20px 24px", 
                background: "#f8fafc",
                border: "1px solid #e2e8f0",
                borderLeft: "4px solid #2563eb",
                borderRadius: 4,
                boxShadow: "0 1px 3px rgba(0,0,0,0.1)",
              }}>
                <p style={{ 
                  fontSize: 15, 
                  lineHeight: 1.8,
                  color: "#1f2937",
                  margin: 0,
                  fontStyle: "italic",
                }}>{demoData.vision}</p>
              </div>
            </div>

            {/* Mission Statement - Professional Format */}
            <div style={{ marginBottom: 36 }}>
              <div style={{ 
                fontSize: 22, 
                fontWeight: 700,
                color: "#1e40af",
                marginBottom: 14,
                paddingBottom: 8,
                borderBottom: "2px solid #e5e7eb",
                textTransform: "uppercase",
                letterSpacing: "0.5px",
              }}>
                Mission Statement
              </div>
              <div style={{ 
                padding: "20px 24px", 
                background: "#f8fafc",
                border: "1px solid #e2e8f0",
                borderLeft: "4px solid #2563eb",
                borderRadius: 4,
                boxShadow: "0 1px 3px rgba(0,0,0,0.1)",
              }}>
                <p style={{ 
                  fontSize: 15, 
                  lineHeight: 1.8,
                  color: "#1f2937",
                  margin: 0,
                  fontStyle: "italic",
                }}>{demoData.mission}</p>
              </div>
            </div>

            {/* Core Values - Professional Format */}
            <div style={{ marginBottom: 36 }}>
              <div style={{ 
                fontSize: 22, 
                fontWeight: 700,
                color: "#1e40af",
                marginBottom: 14,
                paddingBottom: 8,
                borderBottom: "2px solid #e5e7eb",
                textTransform: "uppercase",
                letterSpacing: "0.5px",
              }}>
                Core Values
              </div>
              <div style={{ 
                padding: "20px 24px", 
                background: "#f8fafc",
                border: "1px solid #e2e8f0",
                borderLeft: "4px solid #2563eb",
                borderRadius: 4,
                boxShadow: "0 1px 3px rgba(0,0,0,0.1)",
              }}>
                <ul style={{ 
                  paddingLeft: 24, 
                  fontSize: 15, 
                  lineHeight: 2,
                  color: "#1f2937",
                  margin: 0,
                }}>
                  {demoData.values.split("\n").filter(v => v.trim()).map((value, idx) => (
                    <li key={idx} style={{ marginBottom: 4 }}>
                      <strong>{value.trim()}</strong>
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            {/* Document Footer */}
            <div style={{
              marginTop: 48,
              paddingTop: 24,
              borderTop: "1px solid #e5e7eb",
              textAlign: "center",
              color: "#9ca3af",
              fontSize: 12,
            }}>
              <p style={{ margin: 0 }}>Strategic Planning Suite • {new Date().getFullYear()}</p>
              <p style={{ margin: "4px 0 0 0" }}>This is a preview of Step 1 of your Strategic Plan</p>
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
    <>
      <style>{`
        @media (max-width: 768px) {
          .demo-wizard-container {
            padding: 10px !important;
            align-items: flex-start !important;
          }
          .demo-wizard-card {
            max-width: 100% !important;
            max-height: 100vh !important;
            margin: 0 !important;
            border-radius: 12px !important;
          }
          .demo-wizard-header-container {
            padding-right: 40px !important;
          }
          .demo-wizard-help-box {
            margin-bottom: 12px !important;
            padding: 12px !important;
            font-size: 13px !important;
          }
          .demo-wizard-video-btn {
            font-size: 13px !important;
            padding: 10px 14px !important;
          }
          .demo-wizard-nav-buttons {
            flex-direction: column !important;
            position: fixed !important;
            bottom: 0 !important;
            left: 0 !important;
            right: 0 !important;
            background: white !important;
            padding: 12px !important;
            margin: 0 !important;
            box-shadow: 0 -4px 12px rgba(0,0,0,0.1) !important;
            border-radius: 0 !important;
            z-index: 10 !important;
          }
          .demo-wizard-nav-buttons button {
            width: 100% !important;
            margin: 0 !important;
          }
          .demo-wizard-card {
            padding-bottom: 100px !important;
          }
        }
      `}</style>
      <div
        className="demo-wizard-container"
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
          className="card demo-wizard-card"
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
          <div className="demo-wizard-header-container" style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 16 }}>
            <div style={{ flex: 1, paddingRight: 10 }}>
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
                flexShrink: 0,
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
        <div className="demo-wizard-help-box" style={{ marginBottom: 16, padding: 14, background: "#f0f9ff", borderRadius: 8, border: "1px solid #0ea5e9" }}>
          <p style={{ fontSize: 14, color: "#0369a1", margin: 0, lineHeight: 1.6 }}>
            💡 {currentStep.helpText}
          </p>
        </div>

        {/* Video & Examples (for long fields) */}
        {currentStep.type === "long" && (
          <div style={{ marginBottom: 16, display: "grid", gap: 10 }}>
            {currentStep.videoTitle && (
              <button
                className="btnSecondary demo-wizard-video-btn"
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
        <div className="demo-wizard-nav-buttons" style={{ display: "flex", gap: 10, justifyContent: "space-between" }}>
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
          <div style={{ display: "flex", gap: 10, flex: 1 }}>
            <button
              className="btnSecondary"
              onClick={onClose}
              style={{ fontSize: 14, flex: 1 }}
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
                flex: 1,
              }}
            >
              {step === wizardSteps.length - 1 ? "Show Preview →" : "Next →"}
            </button>
          </div>
        </div>

        {!isComplete && (
          <p style={{ marginTop: 12, fontSize: 13, color: "var(--muted)", textAlign: "center", marginBottom: 80 }}>
            Please answer to continue
          </p>
        )}
      </div>
    </div>
    </>
  );
}
