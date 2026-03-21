/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./src/**/*.{js,jsx,ts,tsx}"],
  theme: {
    extend: {
      fontFamily: {
        display: ["'Clash Display'", "'DM Sans'", "sans-serif"],
        mono:    ["'JetBrains Mono'", "monospace"],
        body:    ["'DM Sans'", "sans-serif"],
      },
      colors: {
        ink:   { DEFAULT: "#0E0F14", 50: "#1a1c24", 100: "#13151c" },
        jade:  { DEFAULT: "#00D68F", dark: "#00a86b", light: "#4dffc3" },
        cobalt:{ DEFAULT: "#3B82F6", dark: "#1d4ed8" },
        ember: { DEFAULT: "#F97316", dark: "#c2410c" },
        slate: { 850: "#1e2330", 900: "#141720" },
      },
      animation: {
        "fade-up":   "fadeUp .5s ease both",
        "fade-in":   "fadeIn .4s ease both",
        "slide-in":  "slideIn .35s ease both",
        "pulse-dot": "pulseDot 2s ease-in-out infinite",
      },
      keyframes: {
        fadeUp:   { from: { opacity: 0, transform: "translateY(16px)" }, to: { opacity: 1, transform: "translateY(0)" }},
        fadeIn:   { from: { opacity: 0 }, to: { opacity: 1 }},
        slideIn:  { from: { opacity: 0, transform: "translateX(-12px)" }, to: { opacity: 1, transform: "translateX(0)" }},
        pulseDot: { "0%,100%": { opacity: 1 }, "50%": { opacity: .3 }},
      },
    },
  },
  plugins: [],
};
