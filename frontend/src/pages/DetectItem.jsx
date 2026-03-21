import React, { useState } from "react";
import CameraCapture from "../components/CameraCapture";
import AddItem from "../components/AddItem";
import toast from "react-hot-toast";

const PHASES = [
  {
    phase: "Phase 1",
    title: "Manual System",
    status: "done",
    icon: "✅",
    items: ["Add / Search / Update / Delete items", "MongoDB storage", "IST timestamps", "FastAPI backend"],
  },
  {
    phase: "Phase 2",
    title: "Image Upload",
    status: "in-progress",
    icon: "🔄",
    items: ["Upload item photo", "Store image with location", "File input + /upload_image route", "MongoDB GridFS or cloud storage"],
  },
  {
    phase: "Phase 3",
    title: "AI Object Detection",
    status: "upcoming",
    icon: "🤖",
    items: ["YOLOv8 + OpenCV", "Real-time camera detection", "Auto-fill item name from detection", "/detect endpoint → FastAPI + PyTorch"],
  },
];

const STATUS_STYLES = {
  done:        { bg: "rgba(0,214,143,.12)",  border: "rgba(0,214,143,.3)",  color: "var(--jade)" },
  "in-progress":{ bg: "rgba(59,130,246,.12)", border: "rgba(59,130,246,.3)", color: "var(--cobalt)" },
  upcoming:    { bg: "rgba(249,115,22,.10)",  border: "rgba(249,115,22,.25)", color: "var(--ember)" },
};

export default function DetectItem() {
  const [detectedItems, setDetectedItems] = useState([]);
  const [autoFill, setAutoFill]           = useState("");

  function handleDetected(items) {
    setDetectedItems(items);
    if (items.length > 0) {
      setAutoFill(items[0].object);
      toast(`🎯 ${items.length} object(s) detected! Log them below.`);
    }
  }

  return (
    <div style={{ maxWidth: 1100, margin: "0 auto", padding: "36px 24px 80px" }}>

      {/* HEADER */}
      <div style={{ marginBottom: 36, animation: "fadeUp .5s ease both" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 10 }}>
          <div
            style={{
              padding: "4px 12px",
              background: "rgba(249,115,22,.12)",
              border: "1px solid rgba(249,115,22,.3)",
              borderRadius: 100,
              fontFamily: "monospace",
              fontSize: "0.72rem",
              color: "var(--ember)",
              fontWeight: 700,
            }}
          >
            PHASE 2 → 3 · AI FEATURES
          </div>
        </div>
        <div
          style={{
            fontFamily: "'Clash Display', sans-serif",
            fontWeight: 800,
            fontSize: "clamp(1.6rem, 3.5vw, 2.4rem)",
            lineHeight: 1.1,
            letterSpacing: "-0.5px",
            marginBottom: 8,
          }}
        >
          AI Object<br />
          <span style={{ color: "var(--ember)" }}>Detection</span>
        </div>
        <div style={{ color: "var(--muted)", fontFamily: "monospace", fontSize: "0.8rem" }}>
          // YOLOv8 + OpenCV · Camera Integration · Auto-log detected items
        </div>
      </div>

      {/* ROADMAP */}
      <div style={{ display: "flex", gap: 12, marginBottom: 36, flexWrap: "wrap", animation: "fadeUp .5s .06s ease both", opacity: 0, animationFillMode: "forwards" }}>
        {PHASES.map((p) => {
          const s = STATUS_STYLES[p.status];
          return (
            <div
              key={p.phase}
              style={{
                flex: 1,
                minWidth: 220,
                background: s.bg,
                border: `1px solid ${s.border}`,
                borderRadius: 12,
                padding: "18px 20px",
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 10 }}>
                <span style={{ fontSize: 18 }}>{p.icon}</span>
                <div>
                  <div style={{ fontFamily: "monospace", fontSize: "0.68rem", color: s.color, fontWeight: 700 }}>{p.phase}</div>
                  <div style={{ fontFamily: "'Clash Display', sans-serif", fontWeight: 700, fontSize: "0.95rem" }}>{p.title}</div>
                </div>
              </div>
              {p.items.map((item, i) => (
                <div key={i} style={{ fontFamily: "monospace", fontSize: "0.72rem", color: "var(--muted)", marginBottom: 4 }}>
                  › {item}
                </div>
              ))}
            </div>
          );
        })}
      </div>

      {/* MAIN LAYOUT */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20 }}>

        {/* CAMERA */}
        <div style={{ animation: "fadeUp .5s .15s ease both", opacity: 0, animationFillMode: "forwards" }}>
          <div className="sv-card" style={{ padding: 24 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 20 }}>
              <div style={{ width: 32, height: 32, borderRadius: 8, background: "var(--ember-dim)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 15 }}>📷</div>
              <div>
                <div className="section-label">Camera / Image Input</div>
                <div style={{ fontFamily: "monospace", fontSize: "0.68rem", color: "var(--muted)", marginTop: 2 }}>Phase 2: Upload · Phase 3: YOLO Detect</div>
              </div>
            </div>
            <CameraCapture onDetected={handleDetected} />
          </div>
        </div>

        {/* RIGHT PANEL */}
        <div style={{ display: "flex", flexDirection: "column", gap: 18, animation: "fadeUp .5s .2s ease both", opacity: 0, animationFillMode: "forwards" }}>

          {/* DETECTED ITEMS (if any) */}
          {detectedItems.length > 0 && (
            <div
              style={{
                background: "rgba(0,214,143,.06)",
                border: "1px solid rgba(0,214,143,.2)",
                borderRadius: 12,
                padding: 18,
              }}
            >
              <div className="section-label" style={{ marginBottom: 10 }}>Detected — Auto-fill ready</div>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginBottom: 12 }}>
                {detectedItems.map((d, i) => (
                  <button
                    key={i}
                    className="sv-btn sv-btn-jade"
                    style={{ padding: "6px 14px", fontSize: "0.8rem" }}
                    onClick={() => setAutoFill(d.object)}
                  >
                    {d.object} {d.confidence ? `${Math.round(d.confidence * 100)}%` : ""}
                  </button>
                ))}
              </div>
              <div style={{ fontFamily: "monospace", fontSize: "0.7rem", color: "var(--muted)" }}>
                Click an item to auto-fill the Log form →
              </div>
            </div>
          )}

          {/* ADD ITEM (auto-filled) */}
          <AddItem prefillName={autoFill} />

          {/* TECH STACK INFO */}
          <div
            className="sv-card"
            style={{ padding: 20 }}
          >
            <div className="section-label" style={{ marginBottom: 12 }}>AI Tech Stack (Phase 3)</div>
            {[
              ["Detection Model", "YOLOv8", "var(--jade)"],
              ["Image Processing", "OpenCV", "var(--cobalt)"],
              ["ML Framework", "PyTorch", "var(--ember)"],
              ["API", "FastAPI /detect", "var(--jade)"],
              ["Storage", "MongoDB + Cloud", "var(--cobalt)"],
            ].map(([label, val, color]) => (
              <div key={label} style={{ display: "flex", justifyContent: "space-between", fontFamily: "monospace", fontSize: "0.78rem", marginBottom: 8 }}>
                <span style={{ color: "var(--muted)" }}>{label}</span>
                <span style={{ color }}>{val}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* YOLO FLOW DIAGRAM */}
      <div style={{ marginTop: 36, animation: "fadeUp .5s .3s ease both", opacity: 0, animationFillMode: "forwards" }}>
        <div className="section-label" style={{ marginBottom: 16 }}>How YOLO Detection Will Work</div>
        <div style={{ display: "flex", alignItems: "center", gap: 0, flexWrap: "wrap" }}>
          {[
            { icon: "📸", label: "Capture Image", sub: "Camera / Upload" },
            { icon: "→" },
            { icon: "🧠", label: "YOLOv8 Model", sub: "PyTorch inference" },
            { icon: "→" },
            { icon: "📦", label: "Detections", sub: '{ "wallet": 0.92 }' },
            { icon: "→" },
            { icon: "📌", label: "Auto-log", sub: "Item + Location → DB" },
          ].map((step, i) =>
            step.icon === "→" ? (
              <div key={i} style={{ color: "var(--muted)", fontSize: "1.2rem", padding: "0 8px" }}>→</div>
            ) : (
              <div
                key={i}
                style={{
                  background: "var(--surface)",
                  border: "1px solid var(--border)",
                  borderRadius: 12,
                  padding: "16px 20px",
                  textAlign: "center",
                  minWidth: 120,
                  flex: 1,
                }}
              >
                <div style={{ fontSize: 28, marginBottom: 6 }}>{step.icon}</div>
                <div style={{ fontFamily: "'Clash Display', sans-serif", fontWeight: 700, fontSize: "0.85rem", marginBottom: 3 }}>{step.label}</div>
                <div style={{ fontFamily: "monospace", fontSize: "0.65rem", color: "var(--muted)" }}>{step.sub}</div>
              </div>
            )
          )}
        </div>
      </div>
    </div>
  );
}
