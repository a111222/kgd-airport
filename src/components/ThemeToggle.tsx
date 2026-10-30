"use client";

import { useEffect, useState } from "react";
import type { ThemeName } from "@/lib/settings";

const STORAGE_KEY = "kgd-theme";

/** Переключатель «тёплая / тёмная». Показывается только если админ не зафиксировал тему. */
export function ThemeToggle() {
  const [theme, setTheme] = useState<ThemeName | null>(null);

  useEffect(() => {
    setTheme(document.documentElement.dataset.theme === "dark" ? "dark" : "warm");
  }, []);

  const choose = (next: ThemeName) => {
    document.documentElement.dataset.theme = next;
    try {
      localStorage.setItem(STORAGE_KEY, next);
    } catch {
      // приватный режим: тема просто не запомнится
    }
    setTheme(next);
  };

  const btn = (active: boolean) =>
    `grid size-10 place-items-center rounded-full transition-colors ${active ? "bg-surface shadow-sm" : "hover:bg-surface/60"}`;

  return (
    <div role="group" aria-label="Тема оформления" className="flex gap-0.5 rounded-full bg-bg p-1">
      <button type="button" aria-label="Тёплая тема" aria-pressed={theme === "warm"} onClick={() => choose("warm")} className={btn(theme === "warm")}>
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
          <circle cx="12" cy="12" r="4" />
          <path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4" />
        </svg>
      </button>
      <button type="button" aria-label="Тёмная тема" aria-pressed={theme === "dark"} onClick={() => choose("dark")} className={btn(theme === "dark")}>
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <path d="M21 12.8A9 9 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8z" />
        </svg>
      </button>
    </div>
  );
}
