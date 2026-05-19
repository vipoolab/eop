"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";
import { navSections } from "@/lib/nav-config";

export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="w-72 shrink-0 border-r border-slate-200 bg-white flex flex-col overflow-hidden">
      {/* Header */}
      <div className="flex h-16 items-center gap-3 border-b border-slate-200 px-6 shrink-0">
        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-700 text-white font-bold text-sm">
          EOP
        </div>
        <div>
          <div className="text-sm font-semibold leading-tight">สยศ.ตร.</div>
          <div className="text-xs text-slate-500">Strategic Hub Demo</div>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 overflow-y-auto px-3 py-3">
        {navSections.map((section, idx) => (
          <div key={idx} className="mb-4">
            {/* Section header */}
            {section.label !== "หน้าหลัก" && (
              <div className="flex items-center justify-between px-3 mb-1.5 mt-2">
                <h3 className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">
                  {section.label}
                </h3>
                {section.torRef && (
                  <span className="text-[9px] font-mono text-slate-300">
                    {section.torRef}
                  </span>
                )}
              </div>
            )}

            {/* Section items */}
            <div className="space-y-0.5">
              {section.items.map((item) => {
                const isActive = pathname === item.href;
                const Icon = item.icon;
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={cn(
                      "flex items-start gap-2.5 rounded-lg px-3 py-2 text-sm transition-colors group relative",
                      isActive
                        ? "bg-blue-50 text-blue-700"
                        : "text-slate-700 hover:bg-slate-50"
                    )}
                  >
                    <Icon
                      className={cn(
                        "h-4 w-4 mt-0.5 shrink-0",
                        isActive
                          ? "text-blue-700"
                          : "text-slate-400 group-hover:text-slate-600"
                      )}
                    />
                    <div className="flex-1 min-w-0">
                      <div className="font-medium truncate text-xs leading-tight flex items-center gap-1">
                        {item.label}
                        {item.live && (
                          <Sparkles className="h-3 w-3 text-amber-500 shrink-0" />
                        )}
                      </div>
                      <div className="text-[10px] text-slate-400 mt-0.5 truncate">
                        TOR {item.torRef}
                        {item.poc && (
                          <span className="ml-1 text-amber-600 font-semibold">
                            • PoC {item.poc}
                          </span>
                        )}
                      </div>
                    </div>
                  </Link>
                );
              })}
            </div>
          </div>
        ))}
      </nav>

      {/* Footer */}
      <div className="mx-3 mb-3 rounded-lg border border-blue-100 bg-blue-50 p-3 shrink-0">
        <div className="text-xs font-medium text-blue-900">Phase 1 MVP</div>
        <p className="text-[10px] text-blue-700 mt-0.5 leading-snug">
          ต้นแบบจริง — ครอบคลุม TOR ทุกข้อ ⭐ = Live AI / PoC = ทดสอบจริง
        </p>
      </div>
    </aside>
  );
}
