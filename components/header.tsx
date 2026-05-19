"use client";

import { Bell, Search, User } from "lucide-react";

export function Header() {
  const now = new Date();
  const dateStr = new Intl.DateTimeFormat("th-TH", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  }).format(now);

  return (
    <header className="h-16 border-b border-slate-200 bg-white flex items-center justify-between px-6">
      <div className="flex items-center gap-6">
        <div>
          <h1 className="text-base font-semibold text-slate-900">
            ระบบวางแผนและติดตามการปฏิบัติงาน (EOP)
          </h1>
          <p className="text-xs text-slate-500">{dateStr}</p>
        </div>
      </div>

      <div className="flex items-center gap-3">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <input
            type="text"
            placeholder="ค้นหาคำสั่ง/รายงาน/หน่วยงาน..."
            className="w-72 rounded-lg border border-slate-200 bg-slate-50 pl-9 pr-3 py-2 text-sm placeholder:text-slate-400 focus:outline-none focus:border-blue-400 focus:bg-white"
          />
        </div>
        <button className="relative h-9 w-9 rounded-lg border border-slate-200 hover:bg-slate-50 flex items-center justify-center">
          <Bell className="h-4 w-4 text-slate-600" />
          <span className="absolute top-1.5 right-1.5 h-2 w-2 rounded-full bg-red-500" />
        </button>
        <div className="flex items-center gap-2 pl-3 border-l border-slate-200">
          <div className="h-9 w-9 rounded-full bg-blue-700 flex items-center justify-center">
            <User className="h-4 w-4 text-white" />
          </div>
          <div className="text-right">
            <div className="text-sm font-medium text-slate-900">พล.ต.ต. สมชาย</div>
            <div className="text-xs text-slate-500">ผบ.สยศ.ตร.</div>
          </div>
        </div>
      </div>
    </header>
  );
}
