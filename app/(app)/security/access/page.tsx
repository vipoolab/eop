// User & Access Management — real users from DB

import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { PageHeader } from "@/components/page-header";
import { Users, Shield, KeyRound, ShieldCheck } from "lucide-react";

export const dynamic = "force-dynamic";

const ROLE_META: Record<
  string,
  { label: string; color: string; description: string }
> = {
  ADMIN: {
    label: "ผู้ดูแลระบบ",
    color: "bg-rose-50 text-rose-700 border-rose-200",
    description: "สิทธิ์เต็มในการจัดการระบบ",
  },
  COMMANDER: {
    label: "ผู้บังคับบัญชา",
    color: "bg-[#1e3a5f] text-white border-[#142a45]",
    description: "อนุมัติคำสั่ง + ลายเซ็นอิเล็กทรอนิกส์",
  },
  STAFF: {
    label: "เจ้าหน้าที่",
    color: "bg-emerald-50 text-emerald-700 border-emerald-200",
    description: "ร่างและส่งคำสั่งเพื่อพิจารณา",
  },
  AUDITOR: {
    label: "ผู้ตรวจสอบ",
    color: "bg-[#b8860b]/15 text-[#92400e] border-[#b8860b]/30",
    description: "ตรวจสอบผลการปฏิบัติงาน",
  },
  VIEWER: {
    label: "ผู้ดูข้อมูล",
    color: "bg-slate-100 text-slate-700 border-slate-300",
    description: "ดูข้อมูลอย่างเดียว",
  },
};

export default async function AccessPage() {
  const session = await auth();
  if (!session?.user) redirect("/login");

  const [users, units] = await Promise.all([
    prisma.user.findMany({
      include: { unit: { select: { code: true, name: true } } },
      orderBy: [{ role: "asc" }, { name: "asc" }],
    }),
    prisma.unit.findMany({ orderBy: { code: "asc" } }),
  ]);

  const byRole = users.reduce<Record<string, number>>((acc, u) => {
    acc[u.role] = (acc[u.role] ?? 0) + 1;
    return acc;
  }, {});

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      <PageHeader
        icon={Users}
        eyebrow="Security & Compliance"
        title="ผู้ใช้และการจัดการสิทธิ์"
        description="Role-Based Access Control (RBAC) + Multi-Factor Authentication (MFA) + Single Sign-On (SSO)"
      />

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <StatCard icon={Users} label="ผู้ใช้ทั้งหมด" value={users.length} />
        <StatCard
          icon={ShieldCheck}
          label="MFA เปิดใช้"
          value={users.filter((u) => u.mfaEnabled).length}
        />
        <StatCard icon={Shield} label="บทบาท" value={Object.keys(byRole).length} />
        <StatCard icon={KeyRound} label="หน่วยงาน" value={units.length} />
      </div>

      <div className="rounded-sm border border-slate-200 bg-white p-5">
        <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-500 mb-3">
          การกระจายบทบาท (RBAC)
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-5 gap-2">
          {Object.entries(ROLE_META).map(([role, meta]) => (
            <div key={role} className={`rounded-sm border p-3 ${meta.color}`}>
              <div className="text-[10px] font-semibold uppercase tracking-wider opacity-80">
                {meta.label}
              </div>
              <div className="text-xl font-semibold tabular-nums mt-1">
                {byRole[role] ?? 0}
              </div>
              <div className="text-[10px] mt-1 opacity-75 leading-tight">
                {meta.description}
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="rounded-sm border border-slate-200 bg-white overflow-hidden">
        <div className="px-5 py-3 border-b border-slate-100">
          <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-500">
            รายชื่อผู้ใช้ ({users.length})
          </h3>
        </div>
        <table className="w-full text-sm">
          <thead className="bg-slate-50 text-[10px] uppercase tracking-wider text-slate-500">
            <tr>
              <th className="text-left px-5 py-2.5 font-semibold">ผู้ใช้</th>
              <th className="text-left px-5 py-2.5 font-semibold">หน่วยงาน</th>
              <th className="text-left px-5 py-2.5 font-semibold">บทบาท</th>
              <th className="text-center px-5 py-2.5 font-semibold">MFA</th>
              <th className="text-center px-5 py-2.5 font-semibold">สถานะ</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {users.map((u) => {
              const meta = ROLE_META[u.role] ?? ROLE_META.VIEWER;
              return (
                <tr key={u.id} className="hover:bg-slate-50">
                  <td className="px-5 py-3">
                    <div className="flex items-center gap-3">
                      <div className="h-8 w-8 rounded-sm bg-[#1e3a5f] flex items-center justify-center text-white text-[11px] font-bold">
                        {u.name.split(" ").map((n) => n[0]).slice(0, 2).join("")}
                      </div>
                      <div>
                        <div className="text-sm font-medium text-slate-900">
                          {u.rank} {u.name}
                        </div>
                        <div className="text-[11px] font-mono text-slate-500">
                          {u.email}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="px-5 py-3 text-xs text-slate-700">
                    {u.unit ? (
                      <span>
                        <span className="font-mono text-[11px]">{u.unit.code}</span>{" "}
                        — {u.unit.name}
                      </span>
                    ) : (
                      "—"
                    )}
                  </td>
                  <td className="px-5 py-3">
                    <span className={`inline-flex items-center px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wider rounded-sm border ${meta.color}`}>
                      {meta.label}
                    </span>
                  </td>
                  <td className="px-5 py-3 text-center">
                    {u.mfaEnabled ? (
                      <ShieldCheck className="h-4 w-4 text-emerald-600 inline" />
                    ) : (
                      <span className="text-[11px] text-slate-400">—</span>
                    )}
                  </td>
                  <td className="px-5 py-3 text-center">
                    <span className={`inline-flex items-center gap-1 text-[11px] font-medium ${u.active ? "text-emerald-700" : "text-slate-400"}`}>
                      <span className={`h-1.5 w-1.5 rounded-full ${u.active ? "bg-emerald-500" : "bg-slate-300"}`} />
                      {u.active ? "ใช้งานได้" : "ปิดใช้งาน"}
                    </span>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <div className="rounded-sm border border-[#1e3a5f]/20 bg-[#1e3a5f]/5 p-4 text-xs text-slate-700 leading-relaxed">
        <strong className="text-[#1e3a5f]">ระบบรักษาความปลอดภัย</strong> —
        รหัสผ่านถูก one-way hash ด้วย bcrypt · Session ใช้ JWT (อายุ 8 ชั่วโมง) ·
        รองรับ MFA ผ่าน Authenticator App · พร้อมเชื่อม Single Sign-On (SAML 2.0 / OIDC)
        ของหน่วยงาน
      </div>
    </div>
  );
}

function StatCard({
  icon: Icon,
  label,
  value,
}: {
  icon: typeof Users;
  label: string;
  value: number;
}) {
  return (
    <div className="rounded-sm border border-slate-200 bg-white p-4">
      <div className="flex items-center justify-between mb-1">
        <div className="text-[10px] font-semibold uppercase tracking-wider text-slate-500">
          {label}
        </div>
        <Icon className="h-4 w-4 text-slate-400" />
      </div>
      <div className="text-2xl font-semibold text-slate-900 tabular-nums">
        {value}
      </div>
    </div>
  );
}
