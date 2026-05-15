import type { Config } from "tailwindcss";

export default {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        fari: {
          blue: "#1c3d8f",
          "blue-deep": "#14306f",
          "blue-bright": "#4a6fdb",
          mint: "#2fd4b0",
          "mint-bright": "#5be3c5",
          ink: "#0f1f4d",
          "ink-soft": "#4a5780",
        },
        paper: { DEFAULT: "#ffffff", tint: "#f4f6fb" },
        line: { dark: "#e6eaf4", soft: "rgba(255,255,255,0.10)" },
      },
      fontFamily: {
        sans: ['"Manrope"', "system-ui", "sans-serif"],
        mono: ['"JetBrains Mono"', "ui-monospace", "monospace"],
      },
      borderRadius: {
        card: "14px",
        pill: "9999px",
        input: "8px",
      },
      letterSpacing: {
        eyebrow: "0.22em",
      },
      fontSize: {
        display: ["52px", { lineHeight: "0.95", letterSpacing: "-0.04em" }],
      },
    },
  },
  plugins: [],
} satisfies Config;
