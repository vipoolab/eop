"use client";

import { useEffect, useState } from "react";
import { Sun, Moon } from "lucide-react";
import { useTheme } from "@/components/theme-provider";

export function ThemeToggle() {
  const { theme, toggle } = useTheme();
  const [mounted, setMounted] = useState(false);

  // Avoid hydration mismatch — server can't know which icon to render
  // because theme is set via early script + localStorage on client only.
  useEffect(() => {
    setMounted(true);
  }, []);

  const isDark = theme === "dark";

  // Until mounted, render identical attributes on server + first client paint
  // to prevent hydration mismatch. After mount, theme-dependent attrs update.
  const title = mounted ? (isDark ? "เปลี่ยนเป็นโหมดสว่าง" : "เปลี่ยนเป็นโหมดมืด") : undefined;
  const ariaLabel = mounted ? (isDark ? "Switch to light mode" : "Switch to dark mode") : "Toggle theme";

  return (
    <button
      type="button"
      suppressHydrationWarning
      onClick={toggle}
      title={title}
      aria-label={ariaLabel}
      className="relative h-9 w-9 rounded-sm border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 flex items-center justify-center transition-colors"
    >
      {mounted ? (
        isDark ? (
          <Sun className="h-4 w-4 text-amber-400" />
        ) : (
          <Moon className="h-4 w-4 text-slate-600" />
        )
      ) : (
        <span className="h-4 w-4" />
      )}
    </button>
  );
}
