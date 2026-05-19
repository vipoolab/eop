"use client";

import { useState } from "react";
import { signOut, useSession } from "next-auth/react";
import { Bell, Search, User, LogOut, ChevronDown } from "lucide-react";

const ROLE_LABELS: Record<string, string> = {
  ADMIN: "ผู้ดูแลระบบ",
  COMMANDER: "ผู้บังคับบัญชา",
  STAFF: "เจ้าหน้าที่",
  AUDITOR: "ผู้ตรวจสอบ",
  VIEWER: "ผู้ดูข้อมูล",
};

export function Header() {
  const { data: session } = useSession();
  const [menuOpen, setMenuOpen] = useState(false);

  const now = new Date();
  const dateStr = new Intl.DateTimeFormat("th-TH", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  }).format(now);

  async function handleSignOut() {
    await signOut({ callbackUrl: "/login" });
  }

  const user = session?.user;
  const initials =
    user?.name
      ?.split(" ")
      .map((n) => n[0])
      .slice(0, 2)
      .join("") ?? "?";

  return (
    <header className="h-16 border-b border-slate-200 bg-white flex items-center justify-between px-6">
      <div className="flex items-center gap-6">
        <div>
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

        {/* User menu */}
        <div className="relative">
          <button
            onClick={() => setMenuOpen((v) => !v)}
            className="flex items-center gap-2 pl-3 pr-2 py-1.5 rounded-lg border border-transparent hover:bg-slate-50 hover:border-slate-200 transition-colors"
          >
            <div className="h-9 w-9 rounded-full bg-blue-700 flex items-center justify-center text-white text-xs font-bold">
              {user ? initials : <User className="h-4 w-4" />}
            </div>
            <div className="text-right pr-1">
              <div className="text-sm font-medium text-slate-900 leading-tight">
                {user?.rank ? `${user.rank} ` : ""}
                {user?.name ?? "Loading..."}
              </div>
              <div className="text-xs text-slate-500 leading-tight">
                {user?.role ? ROLE_LABELS[user.role] ?? user.role : "—"}
                {user?.unitCode && (
                  <span className="ml-1 text-slate-400">• {user.unitCode}</span>
                )}
              </div>
            </div>
            <ChevronDown
              className={`h-4 w-4 text-slate-400 transition-transform ${
                menuOpen ? "rotate-180" : ""
              }`}
            />
          </button>

          {menuOpen && (
            <>
              <div
                className="fixed inset-0 z-40"
                onClick={() => setMenuOpen(false)}
              />
              <div className="absolute right-0 top-full mt-1 w-56 rounded-lg border border-slate-200 bg-white shadow-lg z-50 overflow-hidden">
                <div className="px-4 py-3 border-b border-slate-100">
                  <div className="text-sm font-medium text-slate-900 truncate">
                    {user?.name}
                  </div>
                  <div className="text-xs text-slate-500 truncate font-mono">
                    {user?.email}
                  </div>
                </div>
                <button
                  onClick={handleSignOut}
                  className="w-full flex items-center gap-2 px-4 py-2.5 text-sm text-red-700 hover:bg-red-50 transition-colors"
                >
                  <LogOut className="h-4 w-4" />
                  ออกจากระบบ
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
