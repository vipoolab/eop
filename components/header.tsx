"use client";

import { Search } from "lucide-react";
import { PersonaSwitcher } from "@/components/persona-switcher";
import { ThemeToggle } from "@/components/theme-toggle";
import { InboxBell } from "@/components/inbox-bell";

export function Header() {
  const now = new Date();
  const dateStr = new Intl.DateTimeFormat("th-TH", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  }).format(now);

  return (
    <header className="h-16 border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 flex items-center justify-between px-6">
      <div className="flex items-center gap-6">
        <div>
          <h1 className="text-sm font-semibold text-slate-900 dark:text-slate-100 leading-tight">
            ระบบบูรณาการการวางแผนยุทธศาสตร์และติดตามการปฏิบัติงาน
          </h1>
          <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">{dateStr}</p>
        </div>
      </div>

      <div className="flex items-center gap-3">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <input
            suppressHydrationWarning
            type="text"
            placeholder="ค้นหาคำสั่ง/รายงาน/หน่วยงาน..."
            className="w-72 rounded-sm border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100 pl-9 pr-3 py-2 text-sm placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-none focus:border-[#1e3a5f] dark:focus:border-[#5278a8] focus:bg-white dark:focus:bg-slate-900 transition-colors"
          />
        </div>

        <ThemeToggle />

        <InboxBell />

        <PersonaSwitcher />
      </div>
    </header>
  );
}
