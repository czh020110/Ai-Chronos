import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        cosmos: {
          bg: "#07070e",
          surface: "#0d0d1a",
          card: "#111128",
          border: "#1e1e3f",
          gold: "#d4a853",
          "gold-dim": "#8b7340",
          blue: "#5b8def",
          "blue-dim": "#3a5a9f",
          purple: "#8b5cf6",
          "purple-dim": "#5a3a9f",
          text: "#e0e0ec",
          "text-dim": "#7a7a9a",
          accent: "#f0c060",
        },
      },
      fontFamily: {
        display: ["'Playfair Display'", "Georgia", "serif"],
        body: ["'Source Serif 4'", "Georgia", "serif"],
        mono: ["'JetBrains Mono'", "Consolas", "monospace"],
        ui: ["'DM Sans'", "system-ui", "sans-serif"],
      },
      animation: {
        "star-twinkle": "twinkle 3s ease-in-out infinite",
        "orbit-slow": "orbit 20s linear infinite",
        "orbit-medium": "orbit 15s linear infinite",
        "float": "float 6s ease-in-out infinite",
        "pulse-glow": "pulse-glow 2s ease-in-out infinite",
        "slide-up": "slide-up 0.5s ease-out",
        "fade-in": "fade-in 0.4s ease-out",
      },
      keyframes: {
        twinkle: {
          "0%, 100%": { opacity: "0.3" },
          "50%": { opacity: "1" },
        },
        orbit: {
          "0%": { transform: "rotate(0deg)" },
          "100%": { transform: "rotate(360deg)" },
        },
        float: {
          "0%, 100%": { transform: "translateY(0)" },
          "50%": { transform: "translateY(-10px)" },
        },
        "pulse-glow": {
          "0%, 100%": { boxShadow: "0 0 10px rgba(212,168,83,0.3)" },
          "50%": { boxShadow: "0 0 25px rgba(212,168,83,0.6)" },
        },
        "slide-up": {
          "0%": { transform: "translateY(20px)", opacity: "0" },
          "100%": { transform: "translateY(0)", opacity: "1" },
        },
        "fade-in": {
          "0%": { opacity: "0" },
          "100%": { opacity: "1" },
        },
      },
      backgroundImage: {
        "cosmos-gradient":
          "radial-gradient(ellipse at 50% 50%, #111133 0%, #07070e 70%)",
      },
    },
  },
  plugins: [],
};
export default config;
