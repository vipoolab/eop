"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Monitor, LogOut } from "lucide-react";

interface SessionRow {
  id: string;
  token: string;
  expires: Date | string;
  createdAt: Date | string;
}

export function SessionsSection({ sessions }: { sessions: SessionRow[] }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function logoutAll() {
    if (!confirm("ออกจากทุก device ที่ login อยู่? (รวม device ปัจจุบัน)")) return;
    setLoading(true);
    try {
      const res = await fetch("/api/security/my-account/logout-all", { method: "POST" });
      const data = await res.json();
      if (!res.ok || !data.success) throw new Error(data.message);
      window.location.href = "/login";
    } catch (e) {
      alert(e instanceof Error ? e.message : "ออกจากระบบไม่สำเร็จ");
      setLoading(false);
    }
  }

  if (sessions.length === 0) {
    return <div className="text-sm text-slate-400">ไม่มี active session</div>;
  }

  return (
    <div className="space-y-2">
      {sessions.map((s) => (
        <div
          key={s.id}
          className="rounded-md border border-slate-200 bg-slate-50/50 p-3 flex items-center gap-3"
        >
          <Monitor className="h-4 w-4 text-slate-500 shrink-0" />
          <div className="flex-1 min-w-0 text-[12px] text-slate-700">
            <div className="font-mono truncate">{s.token.slice(0, 16)}…</div>
            <div className="text-[10px] text-slate-500">
              สร้างเมื่อ{" "}
              {new Date(s.createdAt).toLocaleString("th-TH", {
                dateStyle: "short",
                timeStyle: "short",
              })}
              {" · "}
              หมดอายุ{" "}
              {new Date(s.expires).toLocaleString("th-TH", {
                dateStyle: "short",
                timeStyle: "short",
              })}
            </div>
          </div>
        </div>
      ))}
      <button
        onClick={logoutAll}
        disabled={loading}
        className="inline-flex items-center gap-1 rounded-md border border-rose-300 bg-white text-rose-700 px-3 py-1.5 text-sm hover:bg-rose-50 disabled:opacity-50"
      >
        {loading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <LogOut className="h-3.5 w-3.5" />}
        ออกจากทุก device
      </button>
    </div>
  );
}
