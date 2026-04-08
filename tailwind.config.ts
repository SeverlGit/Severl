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
        sans:    ["var(--font-dm-sans)", "sans-serif"],
        display: ["var(--font-fraunces)", "serif"],
      },
      colors: {
        // Canvas
        page:            "#F0EBE3",
        panel:           "#FAF7F4",
        surface:         "#FFFFFF",
        "surface-hover": "#E8E2D9",

        // Sidebar
        sidebar:         "#1E1B24",

        // Brand rose (primary accent)
        "brand-rose":      "#C4909A",
        "brand-rose-mid":  "#DDB4BC",
        "brand-rose-deep": "#8C5562",
        "brand-rose-dim":  "#F7ECED",

        // Brand plum (secondary)
        "brand-plum":      "#6B6178",
        "brand-plum-mid":  "#9B92A8",
        "brand-plum-deep": "#3D3649",
        "brand-plum-dim":  "#EDEBF2",

        // Borders
        border:          "#DDD7CE",
        "border-subtle": "#E8E2D9",
        "border-strong": "#C8C0B5",

        // Text
        "txt-primary":   "#1A1714",
        "txt-secondary": "#6B6560",
        "txt-muted":     "#A09890",
        "txt-hint":      "#C4BAB0",

        // Semantic
        success:         "#5A8A6A",
        "success-bg":    "#EEF5F0",
        danger:          "#C05A48",
        "danger-bg":     "#FBF0EE",
        warning:         "#B5803A",
        "warning-bg":    "#FBF3E8",

        // Accent alias
        accent:          "#C4909A",
      },
      borderRadius: {
        sm:      "4px",
        DEFAULT: "6px",
        md:      "8px",
        lg:      "9px",
        xl:      "10px",
        full:    "9999px",
      },
      keyframes: {
        shimmer: {
          '0%':   { transform: 'translateX(-100%)' },
          '100%': { transform: 'translateX(100%)' },
        },
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
        shimmer: 'shimmer 1.6s ease-in-out infinite',
        "accordion-down": "accordion-down 0.2s ease-out",
        "accordion-up": "accordion-up 0.2s ease-out",
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
};

export default config;
