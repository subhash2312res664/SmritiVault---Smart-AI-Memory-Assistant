// ── Item Emoji Map ─────────────────────────────────────────────────────────
const EMOJI_MAP = [
  [["key", "keys"],              "🔑"],
  [["wallet", "purse"],          "👛"],
  [["phone", "mobile", "cell"],  "📱"],
  [["laptop", "computer", "pc"], "💻"],
  [["charger", "cable"],         "🔌"],
  [["passport", "visa"],         "📘"],
  [["bag", "backpack", "sack"],  "🎒"],
  [["watch", "clock"],           "⌚"],
  [["glasses", "specs", "lens"], "👓"],
  [["book", "notebook"],         "📖"],
  [["pen", "pencil"],            "✏️"],
  [["headphone", "earphone", "airpod"], "🎧"],
  [["remote"],                   "📺"],
  [["umbrella"],                 "☂️"],
  [["medicine", "tablet", "pill","capsule"], "💊"],
  [["document", "id", "card"],   "📄"],
  [["camera"],                   "📷"],
  [["card", "debit", "credit"],  "💳"],
  [["ring", "jewelry"],          "💍"],
  [["bottle", "water"],          "🍶"],
];

export function getEmoji(name = "") {
  const lower = name.toLowerCase();
  for (const [keywords, emoji] of EMOJI_MAP) {
    if (keywords.some((k) => lower.includes(k))) return emoji;
  }
  return "📦";
}

// ── Date Formatter ────────────────────────────────────────────────────────────
export function formatDate(ts) {
  if (!ts) return "—";
  try {
    return new Date(ts).toLocaleString("en-IN", {
      timeZone: "Asia/Kolkata",
      dateStyle: "medium",
      timeStyle: "short",
    });
  } catch { return ts; }
}

// ── Short time-ago ────────────────────────────────────────────────────────────
export function timeAgo(ts) {
  if (!ts) return "";
  const diff = Date.now() - new Date(ts).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1)  return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24)  return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}

// ── Capitalize ────────────────────────────────────────────────────────────────
export function cap(s = "") {
  return s.charAt(0).toUpperCase() + s.slice(1);
}
