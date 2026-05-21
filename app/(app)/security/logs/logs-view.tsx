"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Download, Search as SearchIcon, ScrollText, AlertTriangle, Activity } from "lucide-react";

interface AuditRow {
  id: string;
  action: string;
  target: string | null;
  userId: string | null;
  userName: string | null;
  userEmail: string | null;
  ip: string | null;
  ua: string | null;
  details: unknown;
  createdAt: string;
}

interface AttemptRow {
  id: string;
  email: string;
  success: boolean;
  failReason: string | null;
  ipAddress: string;
  userAgent: string | null;
  createdAt: string;
}

const FAIL_REASON_LABEL: Record<string, string> = {
  WRONG_PASS: "รหัสผ่านผิด",
  USER_LOCKED: "บัญชีถูกล็อก",
  MFA_FAIL: "MFA ผิด",
  UNKNOWN_USER: "ไม่พบบัญชี",
  ACCOUNT_DISABLED: "บัญชีถูกระงับ",
};

export function LogsView({
  initialTab,
  audit,
  attempts,
  actions,
  users,
  filters,
}: {
  initialTab: "activity" | "attempts";
  audit: AuditRow[];
  attempts: AttemptRow[];
  actions: { action: string; count: number }[];
  users: { id: string; name: string; rank: string | null; email: string }[];
  filters: { action: string; user: string; q: string };
}) {
  const router = useRouter();
  const [tab, setTab] = useState<"activity" | "attempts">(initialTab);
  const [q, setQ] = useState(filters.q);
  const [actionFilter, setActionFilter] = useState(filters.action);
  const [userFilter, setUserFilter] = useState(filters.user);

  function applyFilters() {
    const params = new URLSearchParams();
    if (q) params.set("q", q);
    if (actionFilter) params.set("action", actionFilter);
    if (userFilter) params.set("user", userFilter);
    params.set("tab", tab);
    router.push(`/security/logs?${params.toString()}`);
  }

  function exportCsv() {
    if (tab === "activity") {
      const rows = audit.map((a) => ({
        time: a.createdAt,
        action: a.action,
        target: a.target ?? "",
        user: a.userName ?? "",
        email: a.userEmail ?? "",
        ip: a.ip ?? "",
        userAgent: a.ua ?? "",
        details: typeof a.details === "string" ? a.details : JSON.stringify(a.details),
      }));
      downloadCsv("activity-log", rows);
    } else {
      const rows = attempts.map((l) => ({
        time: l.createdAt,
        email: l.email,
        success: l.success ? "TRUE" : "FALSE",
        failReason: l.failReason ?? "",
        ip: l.ipAddress,
        userAgent: l.userAgent ?? "",
      }));
      downloadCsv("login-attempts", rows);
    }
  }

  function downloadCsv(name: string, rows: Record<string, string>[]) {
    if (rows.length === 0) {
      alert("ไม่มีข้อมูล");
      return;
    }
    const headers = Object.keys(rows[0]);
    const lines = [
      headers.join(","),
      ...rows.map((r) =>
        headers
          .map((h) => {
            const v = r[h] ?? "";
            return /[",\n]/.test(v) ? `"${v.replace(/"/g, '""')}"` : v;
          })
          .join(",")
      ),
    ];
    const blob = new Blob(["﻿" + lines.join("\n")], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${name}-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div className="space-y-4">
      {/* Tabs */}
      <div className="flex gap-1 border-b border-slate-200">
        <button
          onClick={() => setTab("activity")}
          className={`px-4 py-2 text-sm font-semibold border-b-2 -mb-px transition-colors inline-flex items-center gap-2 ${
            tab === "activity" ? "text-slate-900 border-slate-900" : "text-slate-500 border-transparent hover:text-slate-700"
          }`}
        >
          <Activity className="h-4 w-4" />
          Activity Log ({audit.length})
        </button>
        <button
          onClick={() => setTab("attempts")}
          className={`px-4 py-2 text-sm font-semibold border-b-2 -mb-px transition-colors inline-flex items-center gap-2 ${
            tab === "attempts" ? "text-slate-900 border-slate-900" : "text-slate-500 border-transparent hover:text-slate-700"
          }`}
        >
          <AlertTriangle className="h-4 w-4" />
          Login Attempts ({attempts.length})
        </button>
      </div>

      {/* Filters */}
      <div className="rounded-xl border border-slate-200 bg-white p-3 flex items-center gap-2 flex-wrap">
        <div className="flex-1 relative min-w-[200px]">
          <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <input
            type="search"
            placeholder="ค้นหา action / target / email / IP..."
            value={q}
            onChange={(e) => setQ(e.target.value)}
            className="w-full rounded-md border border-slate-300 pl-9 pr-3 py-1.5 text-sm"
          />
        </div>
        {tab === "activity" && (
          <>
            <select
              value={actionFilter}
              onChange={(e) => setActionFilter(e.target.value)}
              className="rounded-md border border-slate-300 px-2 py-1.5 text-sm bg-white"
            >
              <option value="">ทุก action</option>
              {actions.map((a) => (
                <option key={a.action} value={a.action}>
                  {a.action} ({a.count})
                </option>
              ))}
            </select>
            <select
              value={userFilter}
              onChange={(e) => setUserFilter(e.target.value)}
              className="rounded-md border border-slate-300 px-2 py-1.5 text-sm bg-white"
            >
              <option value="">ทุก user</option>
              {users.map((u) => (
                <option key={u.id} value={u.id}>
                  {u.rank ?? ""} {u.name}
                </option>
              ))}
            </select>
          </>
        )}
        <button
          onClick={applyFilters}
          className="text-sm rounded-md bg-slate-900 text-white px-3 py-1.5 hover:bg-slate-700"
        >
          กรอง
        </button>
        <button
          onClick={exportCsv}
          className="text-sm rounded-md border border-slate-300 px-3 py-1.5 hover:bg-slate-100 inline-flex items-center gap-1"
        >
          <Download className="h-3.5 w-3.5" />
          Export CSV
        </button>
      </div>

      {/* Content */}
      {tab === "activity" ? <ActivityList rows={audit} /> : <AttemptsList rows={attempts} />}
    </div>
  );
}

function ActivityList({ rows }: { rows: AuditRow[] }) {
  if (rows.length === 0) {
    return (
      <div className="rounded-xl border border-dashed border-slate-300 bg-slate-50 p-8 text-center text-sm text-slate-500">
        ไม่พบกิจกรรม
      </div>
    );
  }
  return (
    <div className="rounded-xl border border-slate-200 bg-white divide-y divide-slate-100">
      {rows.map((a) => (
        <div key={a.id} className="p-3 flex items-start gap-3">
          <ScrollText className="h-4 w-4 text-slate-400 shrink-0 mt-0.5" />
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <code className="text-[10px] bg-slate-100 px-1.5 py-0.5 rounded font-mono">{a.action}</code>
              {a.userName && (
                <span className="text-sm text-slate-700 truncate">{a.userName}</span>
              )}
              {a.target && (
                <span className="text-[10px] text-slate-400 font-mono truncate">{a.target}</span>
              )}
            </div>
            <div className="text-[10px] text-slate-500 mt-0.5 flex gap-2 flex-wrap">
              {a.ip && <span className="font-mono">{a.ip}</span>}
              {a.userEmail && <span>· {a.userEmail}</span>}
            </div>
          </div>
          <span className="text-[10px] text-slate-500 tabular-nums shrink-0">
            {new Date(a.createdAt).toLocaleString("th-TH", { dateStyle: "short", timeStyle: "short" })}
          </span>
        </div>
      ))}
    </div>
  );
}

function AttemptsList({ rows }: { rows: AttemptRow[] }) {
  if (rows.length === 0) {
    return (
      <div className="rounded-xl border border-dashed border-slate-300 bg-slate-50 p-8 text-center text-sm text-slate-500">
        ไม่พบ login attempts
      </div>
    );
  }
  return (
    <div className="rounded-xl border border-slate-200 bg-white divide-y divide-slate-100">
      {rows.map((l) => (
        <div
          key={l.id}
          className={`p-3 flex items-center gap-3 ${l.success ? "" : "bg-rose-50/30"}`}
        >
          <span className={`text-xl ${l.success ? "text-emerald-600" : "text-rose-600"}`}>
            {l.success ? "✓" : "✗"}
          </span>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-sm text-slate-800 font-mono">{l.email}</span>
              <span className="text-[10px] text-slate-500 font-mono">{l.ipAddress}</span>
              {!l.success && l.failReason && (
                <span className="text-[10px] px-1.5 py-0.5 rounded bg-rose-100 text-rose-700 border border-rose-200">
                  {FAIL_REASON_LABEL[l.failReason] ?? l.failReason}
                </span>
              )}
            </div>
            {l.userAgent && (
              <div className="text-[10px] text-slate-400 mt-0.5 truncate">{l.userAgent}</div>
            )}
          </div>
          <span className="text-[10px] text-slate-500 tabular-nums shrink-0">
            {new Date(l.createdAt).toLocaleString("th-TH", { dateStyle: "short", timeStyle: "short" })}
          </span>
        </div>
      ))}
    </div>
  );
}
