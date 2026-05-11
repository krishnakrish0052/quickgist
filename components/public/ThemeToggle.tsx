"use client";

import { useState, useEffect } from "react";
import { Sun, Moon } from "lucide-react";

interface ThemeToggleProps {
  initial?: string;
}

export function ThemeToggle({ initial = "dark" }: ThemeToggleProps) {
  const [theme, setTheme] = useState(initial);

  useEffect(() => {
    const stored = document.cookie
      .split("; ")
      .find((row) => row.startsWith("quickgist_theme="))
      ?.split("=")[1];
    if (stored) setTheme(stored);
  }, []);

  useEffect(() => {
    document.documentElement.classList.toggle("light", theme === "light");
  }, [theme]);

  function toggle() {
    const next = theme === "dark" ? "light" : "dark";
    setTheme(next);
    document.cookie = `quickgist_theme=${next}; path=/; max-age=${60 * 60 * 24 * 365}; SameSite=Lax`;
  }

  return (
    <button
      onClick={toggle}
      aria-label={`Switch to ${theme === "dark" ? "light" : "dark"} mode`}
      className="flex h-8 w-8 items-center justify-center rounded-full border border-white/15 text-[var(--ink-muted)] transition hover:border-white/30 hover:text-[var(--ink)]"
    >
      {theme === "dark" ? <Sun size={14} /> : <Moon size={14} />}
    </button>
  );
}
