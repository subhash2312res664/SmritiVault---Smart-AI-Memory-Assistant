import React, { useState } from "react";
import { useApp } from "../store/AppContext";
import toast from "react-hot-toast";

export default function AddItem() {
  const { addItem } = useApp();
  const [name, setName]       = useState("");
  const [loc, setLoc]         = useState("");
  const [loading, setLoading] = useState(false);
  const [resp, setResp]       = useState({ msg: "Fill in the form and click Log Item.", type: "" });

  async function handleSubmit(e) {
    e.preventDefault();
    if (!name.trim() || !loc.trim()) {
      toast.error("Both fields are required!");
      return;
    }
    setLoading(true);
    setResp({ msg: "Logging item…", type: "info" });
    try {
      const data = await addItem(name.trim(), loc.trim());
      setResp({ msg: `✅ Logged "${data.item_name || name}" at "${data.location || loc}"`, type: "success" });
      toast.success(`📌 ${name} logged!`);
      setName(""); setLoc("");
    } catch (err) {
      setResp({ msg: `❌ ${err.message}`, type: "error" });
      toast.error(err.message);
    } finally { setLoading(false); }
  }

  return (
    <div className="sv-card" style={{ padding: 24 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 20 }}>
        <div style={{ width: 32, height: 32, borderRadius: 8, background: "var(--jade-dim)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 15 }}>📌</div>
        <span className="section-label">Log New Item</span>
      </div>

      <form onSubmit={handleSubmit}>
        <div style={{ marginBottom: 14 }}>
          <label className="section-label" style={{ display: "block", marginBottom: 6 }}>Item Name</label>
          <input
            className="sv-input"
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g. Keys, Wallet, Passport"
            minLength={2}
            maxLength={50}
          />
        </div>

        <div style={{ marginBottom: 18 }}>
          <label className="section-label" style={{ display: "block", marginBottom: 6 }}>Location</label>
          <input
            className="sv-input"
            type="text"
            value={loc}
            onChange={(e) => setLoc(e.target.value)}
            placeholder="e.g. Top drawer, Kitchen counter"
            minLength={2}
            maxLength={100}
          />
        </div>

        <button className="sv-btn sv-btn-jade" type="submit" disabled={loading} style={{ width: "100%" }}>
          {loading ? <><span className="sv-spinner" /> Logging…</> : <><span>📌</span> Log Item</>}
        </button>
      </form>

      <div className={`sv-response ${resp.type}`} style={{ marginTop: 14 }}>{resp.msg}</div>
    </div>
  );
}
