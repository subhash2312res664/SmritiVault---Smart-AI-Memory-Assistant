import React, { useEffect, useState } from "react";
import { useApp } from "../store/AppContext";
import AddItem from "../components/AddItem";
import SearchItem from "../components/SearchItem";
import ItemCard from "../components/ItemCard";
import toast from "react-hot-toast";

function StatPill({ label, value, accent }) {
  return (
    <div
      style={{
        background: "var(--surface)",
        border: "1px solid var(--border)",
        borderRadius: 12,
        padding: "16px 20px",
        flex: 1,
        minWidth: 100,
      }}
    >
      <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: "1.5rem", fontWeight: 700, color: accent || "var(--jade)", marginBottom: 4 }}>
        {value}
      </div>
      <div className="section-label">{label}</div>
    </div>
  );
}

function UpdatePanel() {
  const { updateItemLocation } = useApp();
  const [name, setName]   = useState("");
  const [loc, setLoc]     = useState("");
  const [loading, setL]   = useState(false);
  const [resp, setResp]   = useState({ msg: "Enter item name and new location.", type: "" });

  async function handleUpdate(e) {
    e.preventDefault();
    if (!name.trim() || !loc.trim()) { toast.error("Both fields required!"); return; }
    setL(true);
    setResp({ msg: "Updating…", type: "info" });
    try {
      await updateItemLocation(name.trim(), loc.trim());
      setResp({ msg: `✅ "${name}" → "${loc}" updated`, type: "success" });
      toast.success(`Updated ${name}!`);
      setName(""); setLoc("");
    } catch (err) {
      setResp({ msg: `❌ ${err.message}`, type: "error" });
      toast.error(err.message);
    } finally { setL(false); }
  }

  return (
    <div className="sv-card" style={{ padding: 24 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 20 }}>
        <div style={{ width: 32, height: 32, borderRadius: 8, background: "rgba(160,100,255,.15)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 15 }}>✏️</div>
        <span className="section-label">Update Location</span>
      </div>
      <form onSubmit={handleUpdate}>
        <div style={{ marginBottom: 14 }}>
          <label className="section-label" style={{ display: "block", marginBottom: 6 }}>Item Name</label>
          <input className="sv-input" type="text" value={name} onChange={(e) => setName(e.target.value)} placeholder="Item to update" />
        </div>
        <div style={{ marginBottom: 18 }}>
          <label className="section-label" style={{ display: "block", marginBottom: 6 }}>New Location</label>
          <input className="sv-input" type="text" value={loc} onChange={(e) => setLoc(e.target.value)} placeholder="New location" />
        </div>
        <button
          className="sv-btn"
          type="submit"
          disabled={loading}
          style={{ width: "100%", background: "rgba(160,100,255,.9)", color: "#fff" }}
        >
          {loading ? <><span className="sv-spinner" /> Updating…</> : <><span>✏️</span> Update</>}
        </button>
      </form>
      <div className={`sv-response ${resp.type}`} style={{ marginTop: 14 }}>{resp.msg}</div>
    </div>
  );
}

export default function Dashboard() {
  const { items, loading, fetchAllItems, checkApiHealth, apiStatus } = useApp();
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("all");

  useEffect(() => {
    checkApiHealth().then((ok) => { if (ok) fetchAllItems(); });
  }, []);

  const filtered = items.filter((item) => {
    const matchSearch = item.item_name.toLowerCase().includes(search.toLowerCase()) ||
                        item.location.toLowerCase().includes(search.toLowerCase());
    return matchSearch;
  });

  const recent = items.filter((item) => {
    const diff = Date.now() - new Date(item.timestamp).getTime();
    return diff < 86400000; // last 24h
  });

  return (
    <div style={{ maxWidth: 1200, margin: "0 auto", padding: "36px 24px 80px" }}>

      {/* HERO */}
      <div style={{ marginBottom: 36, animation: "fadeUp .5s ease both" }}>
        <div
          style={{
            fontFamily: "'Clash Display', sans-serif",
            fontWeight: 800,
            fontSize: "clamp(1.8rem, 4vw, 2.8rem)",
            lineHeight: 1.1,
            letterSpacing: "-1px",
            marginBottom: 8,
          }}
        >
          Your Memory,<br />
          <span style={{ color: "var(--jade)" }}>Digitized.</span>
        </div>
        <div style={{ color: "var(--muted)", fontFamily: "'JetBrains Mono', monospace", fontSize: "0.82rem" }}>
          // SmritiVault · Smart AI Memory Assistant · IIT Patna Group 87
        </div>
      </div>

      {/* OFFLINE BANNER */}
      {apiStatus === "offline" && (
        <div
          style={{
            background: "var(--ember-dim)",
            border: "1px solid rgba(249,115,22,.3)",
            borderRadius: 10,
            padding: "12px 16px",
            marginBottom: 24,
            fontFamily: "monospace",
            fontSize: "0.82rem",
            color: "var(--ember)",
            display: "flex",
            alignItems: "center",
            gap: 10,
          }}
        >
          ⚠️ Cannot connect to backend API. Make sure FastAPI is running on port 8000.
          <code style={{ opacity: .7 }}>uvicorn main:app --reload</code>
        </div>
      )}

      {/* STATS */}
      <div style={{ display: "flex", gap: 12, marginBottom: 32, flexWrap: "wrap", animation: "fadeUp .5s .06s ease both", opacity: 0, animationFillMode: "forwards" }}>
        <StatPill label="Total Items"   value={items.length}  accent="var(--jade)" />
        <StatPill label="Added Today"   value={recent.length} accent="var(--cobalt)" />
        <StatPill label="API Status"    value={apiStatus === "online" ? "●" : "○"} accent={apiStatus === "online" ? "var(--jade)" : "var(--ember)"} />
      </div>

      {/* CRUD GRID */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))",
          gap: 18,
          marginBottom: 36,
        }}
      >
        <div style={{ animation: "fadeUp .5s .1s ease both", opacity: 0, animationFillMode: "forwards" }}>
          <AddItem />
        </div>
        <div style={{ animation: "fadeUp .5s .15s ease both", opacity: 0, animationFillMode: "forwards" }}>
          <SearchItem />
        </div>
        <div style={{ animation: "fadeUp .5s .2s ease both", opacity: 0, animationFillMode: "forwards" }}>
          <UpdatePanel />
        </div>
      </div>

      <div className="glow-line" />

      {/* ALL ITEMS */}
      <div style={{ animation: "fadeUp .5s .25s ease both", opacity: 0, animationFillMode: "forwards" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 18, flexWrap: "wrap", gap: 12 }}>
          <div>
            <div style={{ fontFamily: "'Clash Display', sans-serif", fontWeight: 700, fontSize: "1.2rem", marginBottom: 4 }}>
              All Items
            </div>
            <div className="section-label">{items.length} item{items.length !== 1 ? "s" : ""} logged</div>
          </div>

          <div style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}>
            <input
              className="sv-input"
              style={{ width: 200 }}
              type="text"
              placeholder="Filter by name or location…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
            <button
              className="sv-btn sv-btn-jade"
              onClick={fetchAllItems}
              disabled={loading}
              style={{ padding: "10px 18px" }}
            >
              {loading ? <span className="sv-spinner" /> : "🔄"} Refresh
            </button>
          </div>
        </div>

        {loading ? (
          <div style={{ textAlign: "center", padding: 48, color: "var(--muted)", fontFamily: "monospace" }}>
            <span className="sv-spinner" style={{ width: 24, height: 24, marginBottom: 12, display: "block", margin: "0 auto 16px" }} />
            Loading items…
          </div>
        ) : filtered.length === 0 ? (
          <div
            style={{
              textAlign: "center",
              padding: "52px 24px",
              background: "var(--surface)",
              border: "1px solid var(--border)",
              borderRadius: 14,
              color: "var(--muted)",
              fontFamily: "'JetBrains Mono', monospace",
              fontSize: "0.82rem",
            }}
          >
            <div style={{ fontSize: "2.5rem", marginBottom: 12 }}>{search ? "🔎" : "📭"}</div>
            {search ? `No items matching "${search}"` : "No items logged yet. Add your first item above!"}
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {filtered.map((item, i) => (
              <ItemCard key={item._id || item.item_name + i} item={item} index={i} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
