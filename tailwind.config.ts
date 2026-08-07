import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: "class",
  content: [
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        accent: {
          DEFAULT: "#0066FF",
          hover: "#0052CC",
          light: "rgba(0, 102, 255, 0.12)",
          dark: "rgba(0, 102, 255, 0.25)",
        },
        income: {
          DEFAULT: "#10B981",
          light: "rgba(16, 185, 129, 0.12)",
          dark: "rgba(16, 185, 129, 0.25)",
        },
        expense: {
          DEFAULT: "#EF4444",
          light: "rgba(239, 68, 68, 0.12)",
          dark: "rgba(239, 68, 68, 0.25)",
        },
        warning: {
          DEFAULT: "#F59E0B",
          light: "rgba(245, 158, 11, 0.12)",
          dark: "rgba(245, 158, 11, 0.25)",
        },
        zen: {
          50: "#F8FAFC",
          100: "#F1F5F9",
          200: "#E2E8F0",
          300: "#CBD5E1",
          400: "#94A3B8",
          500: "#64748B",
          600: "#475569",
          700: "#334155",
          800: "#1E293B",
          850: "#131C2E",
          900: "#0F172A",
          950: "#0A0F1D",
        },
      },
      fontFamily: {
        sans: [
          "-apple-system",
          "BlinkMacSystemFont",
          '"SF Pro Display"',
          '"SF Pro Text"',
          '"Segoe UI"',
          "Roboto",
          "sans-serif",
        ],
      },
      borderRadius: {
        apple: "16px",
        card: "24px",
        pill: "9999px",
      },
      boxShadow: {
        apple: "0 4px 24px 0 rgba(0, 0, 0, 0.04)",
        "apple-hover": "0 8px 32px 0 rgba(0, 0, 0, 0.08)",
        glow: "0 0 20px rgba(0, 102, 255, 0.35)",
        "glow-green": "0 0 20px rgba(16, 185, 129, 0.35)",
      },
    },
  },
  plugins: [],
};

export default config;
