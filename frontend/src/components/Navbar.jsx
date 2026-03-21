import React from "react";
import { Link, useLocation } from "react-router-dom";
import { useApp } from "../store/AppContext";

const NAV_LINKS = [
  { to: "/",        label: "Dashboard",  icon: "⊞" },
  { to: "/detect",  label: "AI Detect",  icon: "◎", badge: "Phase 3" },
];

export default function Navbar() {
  const { pathname } = useLocation();
  const { apiStatus, checkApiHealth } = useApp();

  const statusColor = {
    online:   "#00D68F",
    offline:  "#F97316",
    checking: "#64718a",
  }[apiStatus];

  const statusLabel = {
    online:   "API Online",
    offline:  "API Offline",
    checking: "Connecting…",
  }[apiStatus];

  return (
    <nav
      style={{
        background: "rgba(14,15,20,.9)",
        backdropFilter: "blur(16px)",
        borderBottom: "1px solid var(--border)",
        position: "sticky",
        top: 0,
        zIndex: 50,
      }}
    >
      <div
        style={{
          maxWidth: 1200,
          margin: "0 auto",
          padding: "0 24px",
          height: 62,
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
        }}
      >
        {/* LOGO */}
        <Link to="/" style={{ textDecoration: "none", display: "flex", alignItems: "center", gap: 10 }}>
          <div
            style={{
              width: 34, height: 34,
              background: "var(--jade)",
              borderRadius: 8,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: 17,
              flexShrink: 0,
            }}
          >
            🧠
          </div>
          <div>
            <div
              style={{
                fontFamily: "'Clash Display', sans-serif",
                fontWeight: 700,
                fontSize: "1.1rem",
                color: "var(--text)",
                lineHeight: 1.1,
              }}
            >
              Smriti<span style={{ color: "var(--jade)" }}>Vault</span>
            </div>
            <div style={{ fontSize: "0.6rem", color: "var(--muted)", fontFamily: "monospace" }}>
              IIT Patna · Group 87
            </div>
          </div>
        </Link>

        {/* NAV LINKS */}
        <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
          {NAV_LINKS.map((link) => {
            const active = pathname === link.to;
            return (
              <Link
                key={link.to}
                to={link.to}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 6,
                  padding: "6px 14px",
                  borderRadius: 8,
                  textDecoration: "none",
                  fontSize: "0.88rem",
                  fontWeight: 600,
                  fontFamily: "'Clash Display', sans-serif",
                  background: active ? "var(--jade-dim)" : "transparent",
                  color: active ? "var(--jade)" : "var(--muted)",
                  border: active ? "1px solid rgba(0,214,143,.2)" : "1px solid transparent",
                  transition: "all .2s",
                  position: "relative",
                }}
              >
                <span>{link.icon}</span>
                {link.label}
                {link.badge && (
                  <span
                    style={{
                      fontSize: "0.58rem",
                      background: "rgba(249,115,22,.15)",
                      color: "var(--ember)",
                      border: "1px solid rgba(249,115,22,.25)",
                      borderRadius: 100,
                      padding: "1px 6px",
                      fontFamily: "monospace",
                      fontWeight: 700,
                    }}
                  >
                    {link.badge}
                  </span>
                )}
              </Link>
            );
          })}
        </div>

        {/* STATUS */}
        <button
          onClick={checkApiHealth}
          style={{
            display: "flex",
            alignItems: "center",
            gap: 8,
            background: "var(--surface)",
            border: "1px solid var(--border)",
            borderRadius: 100,
            padding: "6px 14px",
            cursor: "pointer",
            fontFamily: "'JetBrains Mono', monospace",
            fontSize: "0.72rem",
            color: "var(--muted)",
            transition: "border-color .2s",
          }}
          title="Click to re-check API connection"
        >
          <span
            style={{
              width: 8,
              height: 8,
              borderRadius: "50%",
              background: statusColor,
              flexShrink: 0,
              animation: apiStatus === "online" ? "pulseDot 2s ease-in-out infinite" : "none",
            }}
          />
          {statusLabel}
        </button>
      </div>
    </nav>
  );
}
