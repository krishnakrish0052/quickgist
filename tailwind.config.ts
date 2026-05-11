import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}", "./lib/**/*.{ts,tsx}"],
  darkMode: "class",
  theme: {
    extend: {
      colors: {
        // Base surfaces (dark mode primary)
        abyss: "#050508",
        void: "#08080c",
        deep: "#0c0c12",
        elevated: "#12121a",
        raft: "#181820",
        shelf: "#1e1e28",

        // Base surfaces (light mode)
        mist: "#fafaf7",
        paper: "#f4f3ef",
        canvas: "#ecebe5",
        chalk: "#e3e1da",

        // Text (dark mode)
        "ink-white": "#f0efe8",
        "ink-soft": "#c4c2b8",
        "ink-muted": "#787670",
        "ink-faint": "#4a4844",

        // Text (light mode)
        "ink-black": "#0f0f10",
        "ink-charcoal": "#2a292d",
        "ink-slate": "#5c5a5e",
        "ink-ghost": "#949296",

        // Primary accent — signal orange
        signal: "#f85a16",
        "signal-glow": "#ff7b3d",
        "signal-deep": "#c2410c",
        "signal-soft": "rgba(248, 90, 22, 0.12)",

        // Secondary accent — teal
        accent: "#0ce6c4",
        "accent-glow": "#3df5d8",
        "accent-deep": "#0f766e",
        "accent-soft": "rgba(12, 230, 196, 0.10)",

        // Glass surfaces
        "glass-dark": "rgba(255, 255, 255, 0.04)",
        "glass-light": "rgba(255, 255, 255, 0.08)",
        "glass-hover": "rgba(255, 255, 255, 0.12)",

        // Borders
        "line-subtle": "rgba(255, 255, 255, 0.06)",
        "line-default": "rgba(255, 255, 255, 0.10)",
        "line-strong": "rgba(255, 255, 255, 0.15)",

        // Semantic
        success: "#0ce6a0",
        alert: "#f85a16",
        danger: "#ef4444",
      },
      fontFamily: {
        sans: ["var(--font-inter)", "ui-sans-serif", "system-ui", "-apple-system", "Segoe UI", "sans-serif"],
        serif: ["var(--font-source-serif)", "'Source Serif 4'", "Georgia", "Cambria", "serif"],
        display: ["var(--font-source-serif)", "'Source Serif 4'", "Georgia", "serif"],
        mono: ["var(--font-jetbrains-mono)", "'JetBrains Mono'", "ui-monospace", "SFMono-Regular", "monospace"],
      },
      fontSize: {
        "hero-xl": ["clamp(3.5rem, 7vw, 7rem)", { lineHeight: "0.94", letterSpacing: "-0.03em" }],
        "hero-lg": ["clamp(2.5rem, 5vw, 4.5rem)", { lineHeight: "1.02", letterSpacing: "-0.025em" }],
        hero: ["clamp(2rem, 3.5vw, 3.25rem)", { lineHeight: "1.06", letterSpacing: "-0.02em" }],
        "display-xl": ["clamp(2.5rem, 5vw, 4.5rem)", { lineHeight: "1.05", letterSpacing: "-0.02em" }],
        "display-lg": ["clamp(2rem, 3.5vw, 3rem)", { lineHeight: "1.08", letterSpacing: "-0.015em" }],
        headline: ["clamp(1.5rem, 2vw, 2rem)", { lineHeight: "1.18", letterSpacing: "-0.01em" }],
      },
      spacing: {
        "18": "4.5rem",
        "22": "5.5rem",
        "30": "7.5rem",
        "34": "8.5rem",
        "38": "9.5rem",
      },
      boxShadow: {
        // Glass / elevation (dark mode)
        "glass-sm": "0 1px 0 0 rgba(255,255,255,0.06), 0 2px 8px rgba(0,0,0,0.4)",
        glass: "0 1px 0 0 rgba(255,255,255,0.08), 0 4px 16px rgba(0,0,0,0.5), 0 0 0 1px rgba(255,255,255,0.04)",
        "glass-lg": "0 1px 0 0 rgba(255,255,255,0.10), 0 8px 32px rgba(0,0,0,0.6), 0 0 0 1px rgba(255,255,255,0.06)",

        // Glow (accent)
        "glow-signal": "0 0 0 1px rgba(248,90,22,0.20), 0 0 60px rgba(248,90,22,0.15), 0 8px 32px rgba(248,90,22,0.08)",
        "glow-accent": "0 0 0 1px rgba(12,230,196,0.18), 0 0 40px rgba(12,230,196,0.12), 0 4px 20px rgba(12,230,196,0.06)",

        // Classic
        panel: "0 16px 40px rgba(0,0,0,0.5)",
        soft: "0 1px 2px rgba(0,0,0,0.2), 0 8px 24px rgba(0,0,0,0.3)",
        lift: "0 20px 48px rgba(0,0,0,0.5)",
      },
      backgroundImage: {
        "hero-radial":
          "radial-gradient(70% 60% at 50% 0%, rgba(248, 90, 22, 0.10) 0%, rgba(8, 8, 12, 0) 55%), radial-gradient(70% 80% at 100% 100%, rgba(12, 230, 196, 0.06) 0%, rgba(8, 8, 12, 0) 65%)",
        "hero-radial-light":
          "radial-gradient(70% 60% at 50% 0%, rgba(248, 90, 22, 0.06) 0%, rgba(250, 250, 247, 0) 55%), radial-gradient(70% 80% at 100% 100%, rgba(15, 118, 110, 0.05) 0%, rgba(250, 250, 247, 0) 65%)",
        "gradient-signal": "linear-gradient(135deg, #f85a16 0%, #ff7b3d 50%, #c2410c 100%)",
        "gradient-accent": "linear-gradient(135deg, #0ce6c4 0%, #3df5d8 50%, #0f766e 100%)",
        "gradient-mixed": "linear-gradient(135deg, #f85a16 0%, #0ce6c4 100%)",
        "gradient-radial-dark": "radial-gradient(ellipse 80% 60% at 50% 0%, rgba(248,90,22,0.08) 0%, transparent 60%)",
        "gradient-radial-accent": "radial-gradient(ellipse 60% 50% at 80% 100%, rgba(12,230,196,0.06) 0%, transparent 55%)",
      },
      animation: {
        "fade-in": "fadeIn 0.6s ease-out forwards",
        "slide-up": "slideUp 0.5s ease-out forwards",
        "slide-up-delayed": "slideUp 0.6s 0.15s ease-out forwards",
        shimmer: "shimmer 2.5s linear infinite",
        "pulse-glow": "pulseGlow 3s ease-in-out infinite",
        float: "float 6s ease-in-out infinite",
        "gradient-shift": "gradientShift 8s ease infinite",
        "border-glow": "borderGlow 4s ease-in-out infinite",
      },
      keyframes: {
        fadeIn: {
          from: { opacity: "0" },
          to: { opacity: "1" },
        },
        slideUp: {
          from: { opacity: "0", transform: "translateY(16px)" },
          to: { opacity: "1", transform: "translateY(0)" },
        },
        shimmer: {
          from: { backgroundPosition: "-200% 0" },
          to: { backgroundPosition: "200% 0" },
        },
        pulseGlow: {
          "0%, 100%": { boxShadow: "0 0 0 0 rgba(248,90,22,0)" },
          "50%": { boxShadow: "0 0 40px 8px rgba(248,90,22,0.12)" },
        },
        float: {
          "0%, 100%": { transform: "translateY(0px)" },
          "50%": { transform: "translateY(-12px)" },
        },
        gradientShift: {
          "0%, 100%": { backgroundPosition: "0% 50%" },
          "50%": { backgroundPosition: "100% 50%" },
        },
        borderGlow: {
          "0%, 100%": { borderColor: "rgba(248,90,22,0.15)" },
          "50%": { borderColor: "rgba(248,90,22,0.35)" },
        },
      },
      transitionDuration: {
        "400": "400ms",
        "600": "600ms",
        "800": "800ms",
      },
      zIndex: {
        "1": "1",
        "2": "2",
        "3": "3",
      },
    },
  },
  plugins: [],
};

export default config;