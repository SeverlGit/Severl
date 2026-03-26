import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
    "./lib/**/*.{ts,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ["var(--font-poppins)", "sans-serif"],
        mono: ["var(--font-mono)", "JetBrains Mono", "monospace"],
      },
      colors: {
        brand: {
          navy: "#0D1B2A",
          mint: "#6EE7B7",
          white: "#FFFFFF",
        },
        page: "#0D1B2A",
        panel: "#0D1B2A",
        surface: "#0D1B2A",
        "surface-hover": "#162336",
        subtle: "#0D1B2A",
        border: {
          DEFAULT: "#1e2d3d",
          subtle: "#182232",
          hover: "#253648",
        },
        txt: {
          primary: "#ffffff",
          secondary: "rgba(255,255,255,0.60)",
          muted: "rgba(255,255,255,0.35)",
          hint: "rgba(255,255,255,0.18)",
        },
        accent: "#6EE7B7",
        success: {
          DEFAULT: "#6EE7B7",
          bg: "rgba(110,231,183,0.10)",
          border: "rgba(110,231,183,0.20)",
        },
        warning: {
          DEFAULT: "#facc15",
          bg: "rgba(250,204,21,0.10)",
          border: "rgba(250,204,21,0.25)",
        },
        danger: {
          DEFAULT: "#f87171",
          bg: "rgba(248,113,113,0.10)",
          border: "rgba(248,113,113,0.25)",
        },
        info: {
          DEFAULT: "#6EE7B7",
          bg: "rgba(110,231,183,0.10)",
          border: "rgba(110,231,183,0.25)",
        },
      },
      borderRadius: {
        lg: "10px",
        md: "7px",
        full: "9999px",
      },
      keyframes: {
        "accordion-down": {
          from: { height: "0" },
          to: { height: "var(--radix-accordion-content-height)" },
        },
        "accordion-up": {
          from: { height: "var(--radix-accordion-content-height)" },
          to: { height: "0" },
        },
      },
      animation: {
        "accordion-down": "accordion-down 0.2s ease-out",
        "accordion-up": "accordion-up 0.2s ease-out",
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
};

export default config;
