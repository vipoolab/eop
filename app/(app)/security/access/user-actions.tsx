"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { UserPlus, Loader2, X } from "lucide-react";

interface Unit {
  id: string;
  code: string;
  name: string;
}

const ROLES = ["ADMIN", "COMMANDER", "STAFF", "AUDITOR", "VIEWER"] as const;

export function UserActions({ units }: { units: Unit[] }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [rank, setRank] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState<(typeof ROLES)[number]>("STAFF");
  const [unitId, setUnitId] = useState<string>("");
  const [mfaEnabled, setMfaEnabled] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email, name, rank: rank || undefined, password, role,
          unitId: unitId || undefined,
          mfaEnabled,
        }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.message || "สร้างผู้ใช้ไม่สำเร็จ");
      }
      setOpen(false);
      setEmail(""); setName(""); setRank(""); setPassword("");
      router.refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Error");
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="inline-flex items-center gap-2 rounded-sm bg-[#1e3a5f] hover:bg-[#142a45] border border-[#142a45] px-4 py-2 text-sm font-semibold text-white"
      >
        <UserPlus className="h-4 w-4" />
        เพิ่มผู้ใช้
      </button>

      {open && (
        <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4" onClick={() => setOpen(false)}>
          <div className="bg-white rounded-sm border border-slate-200 w-full max-w-md shadow-xl" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between px-5 py-3 border-b border-slate-100">
              <h2 className="text-sm font-semibold text-slate-900">เพิ่มผู้ใช้ใหม่</h2>
              <button onClick={() => setOpen(false)} className="text-slate-400 hover:text-slate-700">
                <X className="h-4 w-4" />
              </button>
            </div>
            <form onSubmit={submit} className="p-5 space-y-3">
              <Field label="อีเมล *">
                <input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} className={inputClass} placeholder="user@eop.test" />
              </Field>
              <Field label="ยศ">
                <input type="text" value={rank} onChange={(e) => setRank(e.target.value)} className={inputClass} placeholder="พ.ต.ท." />
              </Field>
              <Field label="ชื่อ-นามสกุล *">
                <input type="text" required value={name} onChange={(e) => setName(e.target.value)} className={inputClass} placeholder="วิชัย ใจดี" />
              </Field>
              <Field label="รหัสผ่าน (≥ 8 ตัว) *">
                <input type="password" required minLength={8} value={password} onChange={(e) => setPassword(e.target.value)} className={inputClass} />
              </Field>
              <div className="grid grid-cols-2 gap-3">
                <Field label="บทบาท">
                  <select value={role} onChange={(e) => setRole(e.target.value as typeof ROLES[number])} className={inputClass}>
                    {ROLES.map((r) => <option key={r} value={r}>{r}</option>)}
                  </select>
                </Field>
                <Field label="หน่วยงาน">
                  <select value={unitId} onChange={(e) => setUnitId(e.target.value)} className={inputClass}>
                    <option value="">— ไม่ระบุ —</option>
                    {units.map((u) => <option key={u.id} value={u.id}>{u.code} {u.name}</option>)}
                  </select>
                </Field>
              </div>
              <label className="flex items-center gap-2 text-xs text-slate-600">
                <input type="checkbox" checked={mfaEnabled} onChange={(e) => setMfaEnabled(e.target.checked)} className="accent-[#1e3a5f]" />
                เปิด MFA ตั้งแต่ต้น
              </label>

              {error && <div className="rounded-sm border border-rose-300 bg-rose-50 p-2.5 text-xs text-rose-700">{error}</div>}

              <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
                <button type="button" onClick={() => setOpen(false)} className="px-4 py-2 text-sm text-slate-600 hover:text-slate-900">ยกเลิก</button>
                <button type="submit" disabled={loading} className="inline-flex items-center gap-2 rounded-sm bg-[#1e3a5f] hover:bg-[#142a45] border border-[#142a45] px-4 py-2 text-sm font-semibold text-white disabled:opacity-50">
                  {loading && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
                  สร้างผู้ใช้
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}

export function UserToggle({ id, active, role }: { id: string; active: boolean; role: string }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const isAdmin = role === "ADMIN";

  async function toggle() {
    if (!isAdmin) return;
    setLoading(true);
    try {
      await fetch(`/api/users/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: active ? "deactivate" : "activate" }),
      });
      router.refresh();
    } finally {
      setLoading(false);
    }
  }

  return (
    <button
      onClick={toggle}
      disabled={!isAdmin || loading}
      className={`inline-flex items-center gap-1 text-[11px] font-medium ${active ? "text-emerald-700" : "text-slate-400"} ${isAdmin ? "hover:underline cursor-pointer" : "cursor-default"}`}
      title={isAdmin ? "คลิกเพื่อสลับสถานะ" : "เฉพาะ ADMIN เท่านั้นที่แก้ได้"}
    >
      <span className={`h-1.5 w-1.5 rounded-full ${active ? "bg-emerald-500" : "bg-slate-300"}`} />
      {loading ? "..." : active ? "ใช้งานได้" : "ปิดใช้งาน"}
    </button>
  );
}

const inputClass = "w-full rounded-sm border border-slate-300 px-3 py-1.5 text-sm focus:outline-none focus:border-[#1e3a5f] focus:ring-1 focus:ring-[#1e3a5f]";

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="block text-xs font-medium text-slate-700 mb-1">{label}</label>
      {children}
    </div>
  );
}
