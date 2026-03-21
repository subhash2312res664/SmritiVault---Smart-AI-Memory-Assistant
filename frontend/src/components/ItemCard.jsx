import React, { useState } from "react";
import { useApp } from "../store/AppContext";
import { getEmoji, timeAgo } from "../utils";
import toast from "react-hot-toast";

export default function ItemCard({ item, index }) {
  const { updateItemLocation, removeItem } = useApp();
  const [editing, setEditing]   = useState(false);
  const [newLoc, setNewLoc]     = useState(item.location);
  const [loading, setLoading]   = useState(false);

  async function handleUpdate() {
    if (!newLoc.trim()) return;
    setLoading(true);
    try {
      await updateItemLocation(item.item_name, newLoc.trim());
      toast.success(`✏️ ${item.item_name} updated!`);
      setEditing(false);
    } catch (err) {
      toast.error(err.message);
    } finally { setLoading(false); }
  }

  async function handleDelete() {
    if (!window.confirm(`Delete "${item.item_name}"? This cannot be undone.`)) return;
    try {
      await removeItem(item.item_name);
      toast.success(`🗑️ ${item.item_name} deleted`);
    } catch (err) {
      toast.error(err.message);
    }
  }

  return (
    <div
      style={{
        background: "var(--surface2)",
        border: "1px solid var(--border)",
        borderRadius: 12,
        padding: "14px 16px",
        display: "flex",
        alignItems: "center",
        gap: 14,
        animation: "fadeUp .4s ease both",
        animationDelay: `${index * 0.04}s`,
        opacity: 0,
        animationFillMode: "forwards",
        transition: "border-color .2s",
      }}
      onMouseEnter={(e) => e.currentTarget.style.borderColor = "var(--border2)"}
      onMouseLeave={(e) => e.currentTarget.style.borderColor = "var(--border)"}
    >
      {/* EMOJI */}
      <div
        style={{
          width: 42, height: 42,
          background: "rgba(0,214,143,.08)",
          borderRadius: 10,
          display: "flex", alignItems: "center", justifyContent: "center",
          fontSize: 20,
          flexShrink: 0,
        }}
      >
        {getEmoji(item.item_name)}
      </div>

      {/* INFO */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontFamily: "'Clash Display', sans-serif", fontWeight: 700, fontSize: "0.95rem", textTransform: "capitalize", marginBottom: 3 }}>
          {item.item_name}
        </div>

        {editing ? (
          <input
            className="sv-input"
            style={{ padding: "5px 10px", fontSize: "0.82rem", marginTop: 4 }}
            value={newLoc}
            onChange={(e) => setNewLoc(e.target.value)}
            onKeyDown={(e) => { if (e.key === "Enter") handleUpdate(); if (e.key === "Escape") setEditing(false); }}
            autoFocus
          />
        ) : (
          <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: "0.78rem", color: "var(--muted)" }}>
            📍 {item.location}
          </div>
        )}
      </div>

      {/* TIME */}
      <div style={{ fontFamily: "monospace", fontSize: "0.68rem", color: "var(--muted)", flexShrink: 0, textAlign: "right" }}>
        {timeAgo(item.timestamp)}
      </div>

      {/* ACTIONS */}
      <div style={{ display: "flex", gap: 6, flexShrink: 0 }}>
        {editing ? (
          <>
            <button
              onClick={handleUpdate}
              disabled={loading}
              style={{
                width: 30, height: 30,
                border: "1px solid rgba(0,214,143,.3)",
                borderRadius: 7,
                background: "rgba(0,214,143,.1)",
                color: "var(--jade)",
                cursor: "pointer",
                fontSize: 13,
                display: "flex", alignItems: "center", justifyContent: "center",
              }}
              title="Save"
            >
              {loading ? <span className="sv-spinner" style={{ width: 12, height: 12 }} /> : "✓"}
            </button>
            <button
              onClick={() => { setEditing(false); setNewLoc(item.location); }}
              style={{
                width: 30, height: 30,
                border: "1px solid var(--border)",
                borderRadius: 7,
                background: "transparent",
                color: "var(--muted)",
                cursor: "pointer",
                fontSize: 13,
                display: "flex", alignItems: "center", justifyContent: "center",
              }}
              title="Cancel"
            >
              ✕
            </button>
          </>
        ) : (
          <>
            <button
              onClick={() => setEditing(true)}
              style={{
                width: 30, height: 30,
                border: "1px solid var(--border)",
                borderRadius: 7,
                background: "transparent",
                color: "var(--muted)",
                cursor: "pointer",
                fontSize: 12,
                display: "flex", alignItems: "center", justifyContent: "center",
                transition: "all .2s",
              }}
              onMouseEnter={(e) => { e.currentTarget.style.borderColor = "rgba(59,130,246,.5)"; e.currentTarget.style.color = "var(--cobalt)"; }}
              onMouseLeave={(e) => { e.currentTarget.style.borderColor = "var(--border)"; e.currentTarget.style.color = "var(--muted)"; }}
              title="Edit location"
            >
              ✏️
            </button>
            <button
              onClick={handleDelete}
              style={{
                width: 30, height: 30,
                border: "1px solid var(--border)",
                borderRadius: 7,
                background: "transparent",
                color: "var(--muted)",
                cursor: "pointer",
                fontSize: 12,
                display: "flex", alignItems: "center", justifyContent: "center",
                transition: "all .2s",
              }}
              onMouseEnter={(e) => { e.currentTarget.style.borderColor = "rgba(249,115,22,.5)"; e.currentTarget.style.color = "var(--ember)"; }}
              onMouseLeave={(e) => { e.currentTarget.style.borderColor = "var(--border)"; e.currentTarget.style.color = "var(--muted)"; }}
              title="Delete"
            >
              🗑️
            </button>
          </>
        )}
      </div>
    </div>
  );
}
