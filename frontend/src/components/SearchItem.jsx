import React, { useState } from "react";
import { useApp } from "../store/AppContext";
import { formatDate } from "../utils";
import toast from "react-hot-toast";

export default function SearchItem() {
  const { searchItemByName } = useApp();
  const [name, setName]       = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult]   = useState(null);
  const [resp, setResp]       = useState({ msg: "Enter a name to search for an item.", type: "" });

  async function handleSearch(e) {
    e.preventDefault();
    if (!name.trim()) { toast.error("Enter an item name!"); return; }
    setLoading(true);
    setResult(null);
    setResp({ msg: "Searching…", type: "info" });
    try {
      const data = await searchItemByName(name.trim());
      setResult(data);
      setResp({
        msg: `🎯 Found: "${data.item_name}"\n📍 Location: ${data.location}\n⏰ Logged: ${formatDate(data.timestamp)}`,
        type: "success",
      });
      toast.success(`Found ${data.item_name}!`);
    } catch (err) {
      setResp({ msg: `❌ ${err.message}`, type: "error" });
      toast.error(err.message);
    } finally { setLoading(false); }
  }

  return (
    <div className="sv-card" style={{ padding: 24 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 20 }}>
        <div style={{ width: 32, height: 32, borderRadius: 8, background: "var(--cobalt-dim)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 15 }}>🔍</div>
        <span className="section-label">Search Item</span>
      </div>

      <form onSubmit={handleSearch}>
        <div style={{ marginBottom: 14 }}>
          <label className="section-label" style={{ display: "block", marginBottom: 6 }}>Item Name</label>
          <input
            className="sv-input"
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="What are you looking for?"
          />
        </div>
        <button className="sv-btn sv-btn-cobalt" type="submit" disabled={loading} style={{ width: "100%" }}>
          {loading ? <><span className="sv-spinner" /> Searching…</> : <><span>🔍</span> Find It</>}
        </button>
      </form>

      {result && (
        <div
          style={{
            marginTop: 14,
            padding: "14px 16px",
            background: "var(--surface2)",
            border: "1px solid rgba(0,214,143,.25)",
            borderRadius: 10,
            display: "flex",
            alignItems: "center",
            gap: 14,
          }}
        >
          <div style={{ fontSize: 28 }}>📍</div>
          <div>
            <div style={{ fontFamily: "'Clash Display', sans-serif", fontWeight: 700, fontSize: "1rem", marginBottom: 3 }}>
              {result.item_name}
            </div>
            <div style={{ color: "var(--jade)", fontFamily: "monospace", fontSize: "0.8rem" }}>
              {result.location}
            </div>
            <div style={{ color: "var(--muted)", fontFamily: "monospace", fontSize: "0.7rem", marginTop: 4 }}>
              {formatDate(result.timestamp)}
            </div>
          </div>
        </div>
      )}

      {!result && <div className={`sv-response ${resp.type}`} style={{ marginTop: 14 }}>{resp.msg}</div>}
    </div>
  );
}
