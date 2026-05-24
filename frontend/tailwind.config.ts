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
          bg: "rgb(var(--cosmos-bg) / <alpha-value>)",
          surface: "rgb(var(--cosmos-surface) / <alpha-value>)",
          card: "rgb(var(--cosmos-card) / <alpha-value>)",
          border: "rgb(var(--cosmos-border) / <alpha-value>)",
          gold: "rgb(var(--cosmos-gold) / <alpha-value>)",
          "gold-dim": "rgb(var(--cosmos-gold-dim) / <alpha-value>)",
          blue: "rgb(var(--cosmos-blue) / <alpha-value>)",
          "blue-dim": "rgb(var(--cosmos-blue-dim) / <alpha-value>)",
          purple: "rgb(var(--cosmos-purple) / <alpha-value>)",
          "purple-dim": "rgb(var(--cosmos-purple-dim) / <alpha-value>)",
          text: "rgb(var(--cosmos-text) / <alpha-value>)",
          "text-dim": "rgb(var(--cosmos-text-dim) / <alpha-value>)",
          accent: "rgb(var(--cosmos-accent) / <alpha-value>)",
        },
      },
      fontFamily: {
        display: ["'LXGW WenKai Screen'", "serif"],
        body: ["'LXGW WenKai Screen'", "serif"],
        mono: ["'LXGW WenKai Screen'", "serif"],
        ui: ["'LXGW WenKai Screen'", "serif"],
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
          "radial-gradient(ellipse at 50% 50%, rgb(var(--cosmos-surface) / 0.98) 0%, rgb(var(--cosmos-bg) / 1) 70%)",
      },
    },
  },
  plugins: [],
};
export default config;
