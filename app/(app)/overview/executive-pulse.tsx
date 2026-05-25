"use client";

import { useEffect, useState } from "react";

/**
 * Tiny live clock + heartbeat indicator for the executive dashboard header.
 * Updates every second so the dashboard feels "alive".
 */
export function ExecutivePulse() {
  const [now, setNow] = useState<Date | null>(null);

  useEffect(() => {
    setNow(new Date());
    const t = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(t);
  }, []);

  if (!now) return null;

  return (
    <div className="text-right" suppressHydrationWarning>
      <div className="flex items-center justify-end gap-1.5 mb-0.5">
        <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
        <span className="text-[10px] font-semibold uppercase tracking-wider text-emerald-600 dark:text-emerald-400">
          LIVE
        </span>
      </div>
      <div className="text-lg font-bold font-mono text-slate-900 dark:text-slate-100 leading-none tabular-nums">
        {now.toLocaleTimeString("th-TH", { hour12: false })}
      </div>
      <div className="text-[10px] text-slate-500 dark:text-slate-400 mt-0.5">
        {now.toLocaleDateString("th-TH", {
          weekday: "long",
          day: "numeric",
          month: "long",
          year: "numeric",
        })}
      </div>
    </div>
  );
}
