"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  Loader2,
  Plus,
  Search as SearchIcon,
  ShieldCheck,
  ShieldOff,
  Pause,
  Play,
  KeyRound,
  Trash2,
  AlertCircle,
  CheckCircle2,
  Lock as LockIcon,
  Crown,
} from "lucide-react";

interface User {
  id: string;
  email: string;
  name: string;
  rank: string | null;
  role: string;
  active: boolean;
  mfaEnabled: boolean;
  lastLoginAt: string | null;
  lockedUntil: string | null;
  failedLoginCount: number;
  mustChangePassword: boolean;
  unit: { code: string; name: string } | null;
}

interface UnitOpt {
  id: string;
  code: string;
  name: string;
}

interface RoleRow {
  id: string;
  code: string;
  name: string;
  description: string | null;
  isSystem: boolean;
  active: boolean;
  userCount: number;
  permissionCount: number;
  permissions: { code: string; action: string; resource: string }[];
}

const ROLE_LABEL: Record<string, string> = {
  ADMIN: "ผู้ดูแลระบบ",
  COMMANDER: "ผู้บังคับบัญชา",
  STAFF: "เจ้าหน้าที่ปฏิบัติ",
  AUDITOR: "ผู้ตรวจสอบ",
  VIEWER: "ผู้อ่าน",
};

const ROLE_COLORS: Record<string, string> = {
  ADMIN: "bg-rose-100 text-rose-700 border-rose-200",
  COMMANDER: "bg-violet-100 text-violet-700 border-violet-200",
  STAFF: "bg-blue-100 text-blue-700 border-blue-200",
  AUDITOR: "bg-amber-100 text-amber-700 border-amber-200",
  VIEWER: "bg-slate-100 text-slate-700 border-slate-200",
};

export function UsersRolesView({
  users,
  units,
  roles,
}: {
  users: User[];
  units: UnitOpt[];
  roles: RoleRow[];
}) {
  const [tab, setTab] = useState<"users" | "roles">("users");

  return (
    <div className="space-y-4">
      {/* Tabs */}
      <div className="flex gap-1 border-b border-slate-200">
        <TabButton active={tab === "users"} onClick={() => setTab("users")}>
          ผู้ใช้งาน ({users.length})
        </TabButton>
        <TabButton active={tab === "roles"} onClick={() => setTab("roles")}>
          บทบาท & สิทธิ์ ({roles.length + 5})
        </TabButton>
      </div>

      {tab === "users" ? <UsersTab users={users} units={units} /> : <RolesTab roles={roles} />}
    </div>
  );
}

function TabButton({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      className={`px-4 py-2 text-sm font-semibold border-b-2 -mb-px transition-colors ${
        active
          ? "text-slate-900 border-slate-900"
          : "text-slate-500 border-transparent hover:text-slate-700"
      }`}
    >
      {children}
    </button>
  );
}

// ─── Users Tab ────────────────────────────────────────
function UsersTab({ users, units }: { users: User[]; units: UnitOpt[] }) {
  const router = useRouter();
  const [search, setSearch] = useState("");
  const [showCreate, setShowCreate] = useState(false);
  const [busyId, setBusyId] = useState<string | null>(null);

  const filtered = users.filter((u) => {
    if (!search) return true;
    const q = search.toLowerCase();
    return (
      u.name.toLowerCase().includes(q) ||
      u.email.toLowerCase().includes(q) ||
      (u.rank?.toLowerCase().includes(q) ?? false) ||
      u.role.toLowerCase().includes(q)
    );
  });

  async function action(userId: string, op: string) {
    setBusyId(userId);
    try {
      const res = await fetch(`/api/users/${userId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: op }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) throw new Error(data.message);
      router.refresh();
    } catch (e) {
      alert(e instanceof Error ? e.message : "เกิดข้อผิดพลาด");
    } finally {
      setBusyId(null);
    }
  }

  async function unlock(userId: string) {
    setBusyId(userId);
    try {
      const res = await fetch(`/api/users/${userId}/unlock`, { method: "POST" });
      const data = await res.json();
      if (!res.ok || !data.success) throw new Error(data.message);
      router.refresh();
    } catch (e) {
      alert(e instanceof Error ? e.message : "ปลดล็อกไม่สำเร็จ");
    } finally {
      setBusyId(null);
    }
  }

  async function resetPassword(userId: string, email: string) {
    const newPwd = prompt(`Reset password ของ ${email}\nกรอกรหัสผ่านใหม่ (≥ 8 ตัว):`);
    if (!newPwd || newPwd.length < 8) return;
    setBusyId(userId);
    try {
      const res = await fetch(`/api/users/${userId}/reset-password`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ newPassword: newPwd, mustChangeOnNext: true }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) throw new Error(data.message);
      alert(`✓ รีเซ็ตรหัสผ่านสำเร็จ — แจ้ง user รหัสใหม่: ${newPwd}\n(บังคับเปลี่ยนเมื่อ login ครั้งหน้า)`);
      router.refresh();
    } catch (e) {
      alert(e instanceof Error ? e.message : "Reset ไม่สำเร็จ");
    } finally {
      setBusyId(null);
    }
  }

  async function cancelUser(userId: string, email: string) {
    if (!confirm(`ยกเลิกบัญชี ${email} ถาวร? (soft delete — บัญชี active=false)`)) return;
    await action(userId, "deactivate");
  }

  return (
    <div className="space-y-3">
      {/* Toolbar */}
      <div className="flex items-center gap-2 flex-wrap">
        <div className="flex-1 relative max-w-md">
          <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <input
            type="search"
            placeholder="ค้นหา ชื่อ / อีเมล / ยศ / role..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full rounded-md border border-slate-300 pl-9 pr-3 py-1.5 text-sm"
          />
        </div>
        <button
          onClick={() => setShowCreate(!showCreate)}
          className="inline-flex items-center gap-1 rounded-md bg-slate-900 text-white px-3 py-1.5 text-sm font-semibold hover:bg-slate-700"
        >
          <Plus className="h-4 w-4" />
          เพิ่มบัญชี
        </button>
      </div>

      {showCreate && <CreateUserForm units={units} onDone={() => { setShowCreate(false); router.refresh(); }} />}

      {/* User list */}
      <div className="space-y-2">
        {filtered.length === 0 ? (
          <div className="rounded-xl border border-dashed border-slate-300 bg-slate-50 p-8 text-center text-sm text-slate-500">
            ไม่พบบัญชีที่ค้นหา
          </div>
        ) : (
          filtered.map((u) => {
            const locked = u.lockedUntil && new Date(u.lockedUntil) > new Date();
            return (
              <div
                key={u.id}
                className={`rounded-lg border ${
                  !u.active ? "border-slate-200 bg-slate-50 opacity-60" : locked ? "border-rose-200 bg-rose-50/30" : "border-slate-200 bg-white"
                } p-3`}
              >
                <div className="flex items-start gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap mb-1">
                      <span className="text-sm font-semibold text-slate-900">
                        {u.rank ? `${u.rank} ` : ""}{u.name}
                      </span>
                      <span
                        className={`text-[10px] px-1.5 py-0.5 rounded border font-semibold ${ROLE_COLORS[u.role] ?? "bg-slate-100 text-slate-700"}`}
                      >
                        {ROLE_LABEL[u.role] ?? u.role}
                      </span>
                      {u.mfaEnabled ? (
                        <span className="text-[10px] px-1.5 py-0.5 rounded bg-emerald-50 text-emerald-700 border border-emerald-200 inline-flex items-center gap-1">
                          <ShieldCheck className="h-3 w-3" /> MFA
                        </span>
                      ) : (
                        <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-100 text-slate-500 inline-flex items-center gap-1">
                          <ShieldOff className="h-3 w-3" /> No MFA
                        </span>
                      )}
                      {!u.active && (
                        <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-200 text-slate-600">ระงับ</span>
                      )}
                      {locked && (
                        <span className="text-[10px] px-1.5 py-0.5 rounded bg-rose-100 text-rose-700 inline-flex items-center gap-1">
                          <LockIcon className="h-3 w-3" /> ล็อก
                        </span>
                      )}
                      {u.mustChangePassword && (
                        <span className="text-[10px] px-1.5 py-0.5 rounded bg-amber-100 text-amber-700">
                          ต้องเปลี่ยนรหัส
                        </span>
                      )}
                    </div>
                    <div className="text-[11px] text-slate-500 flex flex-wrap gap-2">
                      <span className="font-mono">{u.email}</span>
                      {u.unit && (
                        <>
                          <span>·</span>
                          <span>{u.unit.code} — {u.unit.name}</span>
                        </>
                      )}
                      {u.lastLoginAt && (
                        <>
                          <span>·</span>
                          <span>
                            Login ล่าสุด {new Date(u.lastLoginAt).toLocaleString("th-TH", {
                              dateStyle: "short",
                              timeStyle: "short",
                            })}
                          </span>
                        </>
                      )}
                      {u.failedLoginCount > 0 && (
                        <>
                          <span>·</span>
                          <span className="text-rose-700">
                            ล้มเหลว {u.failedLoginCount} ครั้ง
                          </span>
                        </>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-1 flex-wrap">
                    {locked && (
                      <button
                        onClick={() => unlock(u.id)}
                        disabled={busyId === u.id}
                        className="text-[11px] px-2 py-1 rounded border border-emerald-300 text-emerald-700 bg-emerald-50 hover:bg-emerald-100 disabled:opacity-50"
                        title="ปลดล็อก"
                      >
                        ปลดล็อก
                      </button>
                    )}
                    {u.active ? (
                      <button
                        onClick={() => action(u.id, "deactivate")}
                        disabled={busyId === u.id}
                        className="text-[11px] px-2 py-1 rounded border border-amber-300 text-amber-700 bg-amber-50 hover:bg-amber-100 disabled:opacity-50 inline-flex items-center gap-1"
                        title="ระงับ"
                      >
                        <Pause className="h-3 w-3" />
                        ระงับ
                      </button>
                    ) : (
                      <button
                        onClick={() => action(u.id, "activate")}
                        disabled={busyId === u.id}
                        className="text-[11px] px-2 py-1 rounded border border-emerald-300 text-emerald-700 bg-emerald-50 hover:bg-emerald-100 disabled:opacity-50 inline-flex items-center gap-1"
                        title="เปิดใช้"
                      >
                        <Play className="h-3 w-3" />
                        เปิดใช้
                      </button>
                    )}
                    <button
                      onClick={() => resetPassword(u.id, u.email)}
                      disabled={busyId === u.id}
                      className="text-[11px] px-2 py-1 rounded border border-slate-300 hover:bg-slate-100 disabled:opacity-50 inline-flex items-center gap-1"
                      title="Reset Password"
                    >
                      <KeyRound className="h-3 w-3" />
                      Reset
                    </button>
                    {u.mfaEnabled && (
                      <button
                        onClick={() => action(u.id, "disable_mfa")}
                        disabled={busyId === u.id}
                        className="text-[11px] px-2 py-1 rounded border border-slate-300 hover:bg-slate-100 disabled:opacity-50"
                        title="บังคับปิด MFA"
                      >
                        Force Off MFA
                      </button>
                    )}
                    {busyId === u.id && <Loader2 className="h-3 w-3 animate-spin text-slate-400" />}
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}

// ─── Create User Form (inline) ────────────────────────
function CreateUserForm({
  units,
  onDone,
}: {
  units: UnitOpt[];
  onDone: () => void;
}) {
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [rank, setRank] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState<string>("STAFF");
  const [unitId, setUnitId] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const res = await fetch("/api/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email,
          name,
          rank: rank || undefined,
          password,
          role,
          unitId: unitId || undefined,
        }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) throw new Error(data.message);
      onDone();
    } catch (e) {
      setError(e instanceof Error ? e.message : "สร้างไม่สำเร็จ");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={submit} className="rounded-xl border-2 border-blue-200 bg-blue-50/40 p-4 space-y-2">
      <h3 className="text-sm font-semibold text-blue-900 mb-1">+ เพิ่มบัญชีใหม่</h3>
      {error && (
        <div className="rounded-md bg-rose-50 border border-rose-200 p-2 text-xs text-rose-700 flex items-start gap-2">
          <AlertCircle className="h-3.5 w-3.5 shrink-0 mt-0.5" />
          {error}
        </div>
      )}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
        <input type="email" placeholder="อีเมล" value={email} onChange={(e) => setEmail(e.target.value)} required className="rounded-md border border-slate-300 px-3 py-1.5 text-sm bg-white" />
        <input type="text" placeholder="ชื่อ-สกุล" value={name} onChange={(e) => setName(e.target.value)} required className="rounded-md border border-slate-300 px-3 py-1.5 text-sm bg-white" />
        <input type="text" placeholder="ยศ (เช่น พ.ต.ท.)" value={rank} onChange={(e) => setRank(e.target.value)} className="rounded-md border border-slate-300 px-3 py-1.5 text-sm bg-white" />
        <input type="password" placeholder="รหัสผ่าน (≥8)" value={password} onChange={(e) => setPassword(e.target.value)} required minLength={8} className="rounded-md border border-slate-300 px-3 py-1.5 text-sm bg-white" />
        <select value={role} onChange={(e) => setRole(e.target.value)} className="rounded-md border border-slate-300 px-3 py-1.5 text-sm bg-white">
          {Object.entries(ROLE_LABEL).map(([k, v]) => (
            <option key={k} value={k}>{k} — {v}</option>
          ))}
        </select>
        <select value={unitId} onChange={(e) => setUnitId(e.target.value)} className="rounded-md border border-slate-300 px-3 py-1.5 text-sm bg-white">
          <option value="">(ไม่ระบุหน่วย)</option>
          {units.map((u) => (
            <option key={u.id} value={u.id}>{u.code} — {u.name}</option>
          ))}
        </select>
      </div>
      <div className="flex gap-2">
        <button type="submit" disabled={loading} className="inline-flex items-center gap-1 rounded-md bg-slate-900 text-white px-3 py-1.5 text-sm font-semibold hover:bg-slate-700 disabled:opacity-50">
          {loading && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
          <CheckCircle2 className="h-3.5 w-3.5" />
          สร้างบัญชี
        </button>
        <button type="button" onClick={onDone} className="text-sm text-slate-600 hover:text-slate-900 px-2">
          ยกเลิก
        </button>
      </div>
    </form>
  );
}

// ─── Roles Tab ────────────────────────────────────────
const BUILT_IN_ROLES = [
  { code: "ADMIN", name: "ผู้ดูแลระบบ", desc: "Full access — จัดการระบบ + ผู้ใช้ + Settings" },
  { code: "COMMANDER", name: "ผู้บังคับบัญชา", desc: "บริหารงาน + อนุมัติ + ลงนาม + ดู Dashboards" },
  { code: "STAFF", name: "เจ้าหน้าที่ปฏิบัติ", desc: "บันทึก/รายงานผลงาน + ใช้เครื่องมือพื้นฐาน" },
  { code: "AUDITOR", name: "ผู้ตรวจสอบ", desc: "ดู Logs/Reports + ตรวจรายงาน Compliance (read-only)" },
  { code: "VIEWER", name: "ผู้อ่าน", desc: "อ่านอย่างเดียว ดู Dashboard" },
];

function RolesTab({ roles }: { roles: RoleRow[] }) {
  return (
    <div className="space-y-3">
      <div className="rounded-xl border border-blue-200 bg-blue-50 p-3 text-[12px] text-blue-900">
        💡 ระบบใช้ RBAC 5 บทบาท (Built-in) — ฝัง permission ใน code (auth check ที่ทุก API/หน้า) +
        ตาราง <code className="font-mono bg-white px-1 rounded">Role</code> สำหรับ Custom Roles
      </div>

      {/* Built-in roles */}
      <div>
        <h3 className="text-sm font-semibold text-slate-700 mb-2">Built-in Roles (5)</h3>
        <div className="space-y-2">
          {BUILT_IN_ROLES.map((r) => (
            <div key={r.code} className="rounded-lg border border-slate-200 bg-white p-3">
              <div className="flex items-center gap-2 flex-wrap mb-1">
                <Crown className="h-4 w-4 text-amber-500" />
                <span className={`text-[11px] px-1.5 py-0.5 rounded border font-semibold ${ROLE_COLORS[r.code]}`}>
                  {r.code}
                </span>
                <span className="text-sm font-semibold text-slate-900">{r.name}</span>
                <span className="text-[10px] text-slate-400 ml-auto">Built-in (แก้ไม่ได้)</span>
              </div>
              <p className="text-[12px] text-slate-600">{r.desc}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Custom roles */}
      {roles.length > 0 && (
        <div>
          <h3 className="text-sm font-semibold text-slate-700 mb-2">Custom Roles ({roles.length})</h3>
          <div className="space-y-2">
            {roles.map((r) => (
              <div key={r.id} className="rounded-lg border border-slate-200 bg-white p-3">
                <div className="flex items-center gap-2 flex-wrap mb-1">
                  <span className="text-sm font-semibold text-slate-900">{r.name}</span>
                  <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-100 text-slate-600 font-mono">
                    {r.code}
                  </span>
                  {r.isSystem && (
                    <span className="text-[10px] px-1.5 py-0.5 rounded bg-violet-50 text-violet-700">SYSTEM</span>
                  )}
                  <span className="text-[10px] text-slate-400 ml-auto">
                    {r.userCount} user · {r.permissionCount} permission
                  </span>
                </div>
                {r.description && (
                  <p className="text-[12px] text-slate-600 mb-2">{r.description}</p>
                )}
                {r.permissions.length > 0 && (
                  <div className="flex flex-wrap gap-1">
                    {r.permissions.slice(0, 12).map((p) => (
                      <span
                        key={p.code}
                        className="text-[10px] px-1.5 py-0.5 rounded bg-slate-100 text-slate-700 font-mono"
                      >
                        {p.resource}:{p.action}
                      </span>
                    ))}
                    {r.permissions.length > 12 && (
                      <span className="text-[10px] text-slate-500">
                        +{r.permissions.length - 12} อื่น
                      </span>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
