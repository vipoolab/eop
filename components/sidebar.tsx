"use client";

// Sidebar — enterprise/clean design
// Note: TOR clause refs are kept in nav-config.ts source for traceability,
// but intentionally NOT rendered in the UI for a polished look.

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { navSections } from "@/lib/nav-config";

export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="w-64 shrink-0 border-r border-slate-200 bg-white flex flex-col overflow-hidden">
      {/* Brand */}
      <div className="flex h-16 items-center gap-3 border-b border-slate-200 px-5 shrink-0">
        <div className="flex h-9 w-9 items-center justify-center rounded-md bg-slate-900 text-white font-semibold text-[13px] tracking-tight">
          EOP
        </div>
        <div className="min-w-0">
          <div className="text-sm font-semibold leading-tight text-slate-900">
            สำนักงานยุทธศาสตร์ตำรวจ
          </div>
          <div className="text-[11px] text-slate-500">
            Enterprise Operation Planning
          </div>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 overflow-y-auto px-3 py-4">
        {navSections.map((section, idx) => (
          <div key={idx} className="mb-5 last:mb-0">
            {/* Section header — only show for non-Home sections */}
            {section.label !== "หน้าหลัก" && (
              <div className="px-3 mb-1.5">
                <h3 className="text-[10px] font-semibold uppercase tracking-[0.08em] text-slate-400">
                  {section.label.replace(/^ระบบ \d+:\s*/, "")}
                </h3>
              </div>
            )}

            {/* Section items */}
            <div className="space-y-px">
              {section.items.map((item) => {
                const isActive = pathname === item.href;
                const Icon = item.icon;
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={cn(
                      "group flex items-center gap-2.5 rounded-md px-3 py-2 text-sm transition-colors",
                      isActive
                        ? "bg-slate-900 text-white"
                        : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
                    )}
                  >
                    <Icon
                      className={cn(
                        "h-4 w-4 shrink-0",
                        isActive
                          ? "text-white"
                          : "text-slate-400 group-hover:text-slate-600"
                      )}
                    />
                    <span className="flex-1 truncate font-medium">
                      {item.label}
                    </span>
                    {item.live && (
                      <span
                        className={cn(
                          "h-1.5 w-1.5 rounded-full shrink-0",
                          isActive ? "bg-emerald-300" : "bg-emerald-500"
                        )}
                        title="Live AI"
                      />
                    )}
                  </Link>
                );
              })}
            </div>
          </div>
        ))}
      </nav>

      {/* Footer */}
      <div className="border-t border-slate-200 px-5 py-3 shrink-0">
        <div className="flex items-center gap-2 text-[11px] text-slate-400">
          <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
          <span>System online · v0.1</span>
        </div>
      </div>
    </aside>
  );
}
