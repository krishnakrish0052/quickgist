import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}", "./lib/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        ink: "#0f0f10",
        paper: "#fbfaf6",
        line: "#e6e1d6",
        signal: "#c2410c",
        accent: "#0f766e",
        alert: "#a43f2d",
        gold: "#b08642",
        midnight: "#0a1424",
        slate50: "#f4f4f5",
        slate100: "#e4e4e7",
        slate800: "#27272a",
        slate900: "#18181b"
      },
      fontFamily: {
        sans: ["var(--font-inter)", "ui-sans-serif", "system-ui", "-apple-system", "Segoe UI", "sans-serif"],
        serif: ["var(--font-source-serif)", "'Source Serif 4'", "Georgia", "Cambria", "serif"],
        display: ["var(--font-source-serif)", "'Source Serif 4'", "Georgia", "serif"],
        mono: ["var(--font-jetbrains-mono)", "'JetBrains Mono'", "ui-monospace", "SFMono-Regular", "monospace"]
      },
      fontSize: {
        "display-xl": ["clamp(2.5rem, 5vw, 4.5rem)", { lineHeight: "1.05", letterSpacing: "-0.02em" }],
        "display-lg": ["clamp(2rem, 3.5vw, 3rem)", { lineHeight: "1.08", letterSpacing: "-0.015em" }],
        headline: ["clamp(1.5rem, 2vw, 2rem)", { lineHeight: "1.18", letterSpacing: "-0.01em" }]
      },
      boxShadow: {
        panel: "0 16px 40px rgba(15, 15, 16, 0.08)",
        soft: "0 1px 2px rgba(0, 0, 0, 0.04), 0 8px 24px rgba(15, 15, 16, 0.06)",
        glow: "0 0 0 1px rgba(15, 118, 110, 0.18), 0 12px 36px rgba(15, 118, 110, 0.16)"
      },
      backgroundImage: {
        "hero-radial":
          "radial-gradient(60% 60% at 50% 0%, rgba(194, 65, 12, 0.06) 0%, rgba(251, 250, 246, 0) 60%), radial-gradient(80% 80% at 100% 100%, rgba(15, 118, 110, 0.05) 0%, rgba(251, 250, 246, 0) 70%)",
        "ink-gradient":
          "linear-gradient(180deg, rgba(15, 15, 16, 0) 0%, rgba(15, 15, 16, 0.9) 100%)"
      },
      animation: {
        "fade-in": "fadeIn 0.6s ease-out forwards",
        "slide-up": "slideUp 0.5s ease-out forwards",
        shimmer: "shimmer 2.5s linear infinite"
      },
      keyframes: {
        fadeIn: {
          from: { opacity: "0" },
          to: { opacity: "1" }
        },
        slideUp: {
          from: { opacity: "0", transform: "translateY(12px)" },
          to: { opacity: "1", transform: "translateY(0)" }
        },
        shimmer: {
          from: { backgroundPosition: "-200% 0" },
          to: { backgroundPosition: "200% 0" }
        }
      },
      typography: {
        DEFAULT: {
          css: {
            "--tw-prose-body": "#1f1f22",
            "--tw-prose-headings": "#0f0f10"
          }
        }
      }
    }
  },
  plugins: []
};

export default config;
