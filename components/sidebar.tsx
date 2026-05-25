"use client";

// Sidebar — official Thai government style with inbox badge
// Re-fetches inbox count on pathname change so persona switches reflect immediately.

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { navSections } from "@/lib/nav-config";

export function Sidebar() {
  const pathname = usePathname();
  const [inboxCount, setInboxCount] = useState<number | null>(null);

  useEffect(() => {
    fetch("/api/inbox")
      .then((r) => r.json())
      .then((j) => setInboxCount(j.data?.totalActionable ?? 0))
      .catch(() => setInboxCount(0));
  }, [pathname]); // re-fetch on route change (persona switch reloads page)

  return (
    <aside className="w-64 shrink-0 border-r border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 flex flex-col overflow-hidden">
      {/* Brand */}
      <div className="border-b border-slate-200 dark:border-slate-800 px-5 py-4 shrink-0 bg-[#1e3a5f] text-white">
        <div className="flex items-center gap-3">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-sm border border-white/20 bg-white/5">
            <span className="font-serif text-[15px] font-bold text-[#d4a017] tracking-tight">
              EOP
            </span>
          </div>
          <div className="min-w-0">
            <div className="text-[11px] font-medium text-[#d4a017] uppercase tracking-wider leading-tight">
              Royal Thai Police
            </div>
            <div className="text-sm font-semibold leading-tight text-white mt-0.5">
              สำนักงานยุทธศาสตร์ตำรวจ
            </div>
          </div>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 overflow-y-auto px-3 py-4">
        {navSections.map((section, idx) => (
          <div key={idx} className="mb-5 last:mb-0">
            {section.label !== "หน้าหลัก" && (
              <div className="px-3 mb-1.5">
                <h3 className="text-[10px] font-semibold uppercase tracking-[0.08em] text-slate-400">
                  {section.label.replace(/^ระบบ \d+:\s*/, "")}
                </h3>
              </div>
            )}

            <div className="space-y-px">
              {section.items.map((item) => {
                const isActive =
                  pathname === item.href ||
                  pathname.startsWith(item.href + "/");
                const Icon = item.icon;
                const showBadge =
                  item.badge === "inbox" && inboxCount !== null && inboxCount > 0;
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={cn(
                      "group flex items-center gap-2.5 rounded-sm px-3 py-2 text-sm transition-colors relative",
                      isActive
                        ? "bg-[#1e3a5f] text-white"
                        : "text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-slate-100"
                    )}
                  >
                    {isActive && (
                      <span className="absolute left-0 top-1/2 -translate-y-1/2 h-5 w-0.5 bg-[#d4a017]" />
                    )}
                    <Icon
                      className={cn(
                        "h-4 w-4 shrink-0",
                        isActive
                          ? "text-[#d4a017]"
                          : "text-slate-400 group-hover:text-slate-600"
                      )}
                    />
                    <span className="flex-1 truncate font-medium">
                      {item.label}
                    </span>
                    {showBadge && (
                      <span
                        className={cn(
                          "shrink-0 text-[10px] font-bold px-1.5 py-px rounded-sm tabular-nums",
                          isActive
                            ? "bg-[#d4a017] text-[#1e3a5f]"
                            : "bg-red-600 text-white"
                        )}
                      >
                        {inboxCount}
                      </span>
                    )}
                    {item.poc !== undefined && !showBadge && (
                      <span
                        className={cn(
                          "shrink-0 text-[9px] font-bold uppercase px-1.5 py-0.5 rounded-sm tracking-wider shadow-sm",
                          isActive
                            ? "bg-white text-[#b8860b] ring-1 ring-[#d4a017]"
                            : "bg-gradient-to-br from-[#d4a017] to-[#b8860b] text-white"
                        )}
                        title={`Proof of Concept ${item.poc}`}
                      >
                        PoC {item.poc}
                      </span>
                    )}
                    {item.live && !showBadge && item.poc === undefined && (
                      <span
                        className={cn(
                          "text-[9px] font-semibold uppercase px-1 py-px rounded-sm tracking-wider",
                          isActive
                            ? "bg-[#d4a017] text-[#1e3a5f]"
                            : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400"
                        )}
                      >
                        AI
                      </span>
                    )}
                  </Link>
                );
              })}
            </div>
          </div>
        ))}
      </nav>

      {/* Footer */}
      <div className="border-t border-slate-200 dark:border-slate-800 px-5 py-3 shrink-0 bg-slate-50 dark:bg-slate-950">
        <div className="text-[10px] text-slate-500 leading-relaxed">
          <div className="font-semibold text-slate-700 dark:text-slate-300">
            ใช้ภายในหน่วยงานเท่านั้น
          </div>
          <div className="mt-0.5 text-slate-400">
            Restricted · Internal Use Only
          </div>
        </div>
      </div>
    </aside>
  );
}
