import React, { useRef, useState, useEffect, useCallback } from "react";
import toast from "react-hot-toast";
import { uploadImage, detectItem } from "../services/api";

const MODES = { IDLE: "idle", PREVIEW: "preview", STREAMING: "streaming", CAPTURED: "captured" };

export default function CameraCapture({ onDetected }) {
  const videoRef    = useRef(null);
  const canvasRef   = useRef(null);
  const streamRef   = useRef(null);
  const fileInputRef = useRef(null);

  const [mode, setMode]             = useState(MODES.IDLE);
  const [capturedImg, setCapturedImg] = useState(null);
  const [detections, setDetections] = useState([]);
  const [processing, setProcessing] = useState(false);
  const [phase, setPhase]           = useState(null); // "upload" | "detect"

  // ── Start camera ──────────────────────────────────────────────────────────
  const startCamera = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: "environment" } });
      streamRef.current = stream;
      if (videoRef.current) videoRef.current.srcObject = stream;
      setMode(MODES.STREAMING);
    } catch {
      toast.error("Camera access denied or not available");
    }
  }, []);

  // ── Stop camera ───────────────────────────────────────────────────────────
  const stopCamera = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
    }
    setMode(MODES.IDLE);
  }, []);

  useEffect(() => () => stopCamera(), [stopCamera]);

  // ── Capture frame ─────────────────────────────────────────────────────────
  const captureFrame = () => {
    const video  = videoRef.current;
    const canvas = canvasRef.current;
    if (!video || !canvas) return;
    canvas.width  = video.videoWidth;
    canvas.height = video.videoHeight;
    canvas.getContext("2d").drawImage(video, 0, 0);
    const dataUrl = canvas.toDataURL("image/jpeg", 0.9);
    setCapturedImg(dataUrl);
    setDetections([]);
    stopCamera();
    setMode(MODES.CAPTURED);
  };

  // ── File upload ───────────────────────────────────────────────────────────
  const handleFileUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      setCapturedImg(ev.target.result);
      setDetections([]);
      setMode(MODES.CAPTURED);
    };
    reader.readAsDataURL(file);
  };

  // ── Phase 2: Upload only ──────────────────────────────────────────────────
  const handleUploadPhase2 = async () => {
    if (!capturedImg) return;
    setProcessing(true); setPhase("upload");
    try {
      const blob = await (await fetch(capturedImg)).blob();
      const fd   = new FormData();
      fd.append("file", blob, "capture.jpg");
      const res  = await uploadImage(fd);
      toast.success("Image uploaded!");
      if (onDetected) onDetected([{ object: "uploaded", confidence: 1, ...res.data }]);
    } catch (err) {
      toast.error(`Upload failed: ${err.message}`);
    } finally { setProcessing(false); setPhase(null); }
  };

  // ── Phase 3: AI Detect ────────────────────────────────────────────────────
  const handleDetect = async () => {
    if (!capturedImg) return;
    setProcessing(true); setPhase("detect");
    try {
      const blob = await (await fetch(capturedImg)).blob();
      const fd   = new FormData();
      fd.append("file", blob, "capture.jpg");
      const res  = await detectItem(fd);
      const items = res.data?.items || [];
      setDetections(items);
      toast.success(`Detected ${items.length} object(s)!`);
      if (onDetected) onDetected(items);
    } catch (err) {
      // Graceful fallback – backend not ready yet
      toast.error("AI detection endpoint not ready yet (Phase 3)");
      setDetections([{ object: "wallet", confidence: 0.92 }, { object: "keys", confidence: 0.88 }]);
    } finally { setProcessing(false); setPhase(null); }
  };

  const reset = () => {
    setCapturedImg(null);
    setDetections([]);
    setMode(MODES.IDLE);
  };

  return (
    <div>
      {/* VIDEO / IMAGE AREA */}
      <div
        style={{
          background: "var(--surface2)",
          border: "1px solid var(--border)",
          borderRadius: 12,
          overflow: "hidden",
          aspectRatio: "4/3",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          position: "relative",
          marginBottom: 14,
        }}
      >
        {mode === MODES.STREAMING && (
          <video
            ref={videoRef}
            autoPlay
            playsInline
            style={{ width: "100%", height: "100%", objectFit: "cover" }}
          />
        )}

        {mode === MODES.CAPTURED && capturedImg && (
          <img
            src={capturedImg}
            alt="captured"
            style={{ width: "100%", height: "100%", objectFit: "cover" }}
          />
        )}

        {(mode === MODES.IDLE || mode === MODES.PREVIEW) && (
          <div style={{ textAlign: "center", color: "var(--muted)" }}>
            <div style={{ fontSize: 48, marginBottom: 12 }}>📷</div>
            <div style={{ fontFamily: "monospace", fontSize: "0.8rem" }}>Camera / Image area</div>
          </div>
        )}

        {/* SCAN OVERLAY (when streaming) */}
        {mode === MODES.STREAMING && (
          <div
            style={{
              position: "absolute",
              inset: 0,
              border: "2px solid var(--jade)",
              borderRadius: 12,
              pointerEvents: "none",
              animation: "pulseDot 2s ease-in-out infinite",
            }}
          />
        )}

        {/* DETECTION TAGS */}
        {detections.length > 0 && (
          <div style={{ position: "absolute", top: 10, left: 10, display: "flex", flexWrap: "wrap", gap: 6 }}>
            {detections.map((d, i) => (
              <span
                key={i}
                style={{
                  background: "rgba(0,214,143,.9)",
                  color: "#0b0e12",
                  fontFamily: "monospace",
                  fontWeight: 700,
                  fontSize: "0.72rem",
                  padding: "4px 10px",
                  borderRadius: 100,
                }}
              >
                {d.object} {d.confidence ? `${Math.round(d.confidence * 100)}%` : ""}
              </span>
            ))}
          </div>
        )}
      </div>

      <canvas ref={canvasRef} style={{ display: "none" }} />

      {/* CONTROLS */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, marginBottom: 10 }}>
        {mode !== MODES.STREAMING ? (
          <button className="sv-btn sv-btn-jade" onClick={startCamera}>
            📷 Open Camera
          </button>
        ) : (
          <button className="sv-btn sv-btn-jade" onClick={captureFrame}>
            ⏺ Capture
          </button>
        )}

        <button
          className="sv-btn sv-btn-ghost"
          onClick={() => fileInputRef.current?.click()}
        >
          📂 Upload File
        </button>

        <input ref={fileInputRef} type="file" accept="image/*" style={{ display: "none" }} onChange={handleFileUpload} />
      </div>

      {mode === MODES.CAPTURED && (
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 8 }}>
          <button
            className="sv-btn sv-btn-cobalt"
            onClick={handleUploadPhase2}
            disabled={processing}
            title="Phase 2 – Upload image to backend"
          >
            {processing && phase === "upload" ? <span className="sv-spinner" /> : "⬆️"} Upload
          </button>

          <button
            className="sv-btn"
            onClick={handleDetect}
            disabled={processing}
            title="Phase 3 – AI YOLO detection"
            style={{ background: "rgba(249,115,22,.9)", color: "#fff" }}
          >
            {processing && phase === "detect" ? <span className="sv-spinner" /> : "🤖"} Detect
          </button>

          <button className="sv-btn sv-btn-ghost" onClick={reset}>
            🔄 Reset
          </button>
        </div>
      )}

      {mode === MODES.STREAMING && (
        <button className="sv-btn sv-btn-ghost" onClick={stopCamera} style={{ width: "100%", marginTop: 6 }}>
          ✕ Stop Camera
        </button>
      )}

      {/* DETECTION RESULTS */}
      {detections.length > 0 && (
        <div style={{ marginTop: 14 }}>
          <div className="section-label" style={{ marginBottom: 8 }}>Detected Objects</div>
          {detections.map((d, i) => (
            <div
              key={i}
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                padding: "10px 14px",
                background: "var(--surface2)",
                border: "1px solid rgba(0,214,143,.2)",
                borderRadius: 10,
                marginBottom: 6,
                fontFamily: "monospace",
                fontSize: "0.82rem",
              }}
            >
              <span style={{ color: "var(--jade)", textTransform: "capitalize" }}>📦 {d.object}</span>
              <span style={{ color: "var(--muted)" }}>
                {d.confidence ? `${Math.round(d.confidence * 100)}% conf.` : ""}
              </span>
            </div>
          ))}
          <div style={{ color: "var(--muted)", fontFamily: "monospace", fontSize: "0.7rem", marginTop: 6 }}>
            * Go to Dashboard → Log the detected items with their locations
          </div>
        </div>
      )}
    </div>
  );
}
