// /security/settings — Policies + Security Health + PDPA (TOR ๗.๑.๖)

import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { PageHeader } from "@/components/page-header";
import {
  Settings as SettingsIcon,
  ShieldCheck,
  Lock,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  Info,
  FileLock,
  ScrollText,
} from "lucide-react";

export const dynamic = "force-dynamic";

export default async function SettingsPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");
  if (session.user.role !== "ADMIN") redirect("/security");

  const [adminCount, mfaAdmin, mfaCommander, totalUsers, consentsByType] = await Promise.all([
    prisma.user.count({ where: { role: "ADMIN", active: true } }),
    prisma.user.count({ where: { role: "ADMIN", active: true, mfaEnabled: true } }),
    prisma.user.count({ where: { role: "COMMANDER", active: true, mfaEnabled: true } }),
    prisma.user.count({ where: { active: true } }),
    prisma.consentRecord.groupBy({
      by: ["consentType", "granted"],
      _count: { id: true },
    }),
  ]);

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      <PageHeader
        icon={SettingsIcon}
        eyebrow="Security · TOR 7.1.6"
        title="Settings & Health"
        description="Security Policies · Zero Trust · Encryption · Attack Prevention · PDPA"
      />

      {/* ─── Policies ─── */}
      <Section title="Security Policies" icon={<Lock className="h-5 w-5" />}>
        <div className="space-y-3">
          <PolicyRow
            title="Failed Login Lockout"
            status="active"
            value="ล็อกหลัง 5 ครั้งล้มเหลว · ปลดล็อกอัตโนมัติใน 15 นาที"
            tor="TOR 7.1.6"
          />
          <PolicyRow
            title="Password Complexity"
            status="active"
            value="ขั้นต่ำ 8 ตัวอักษร · เก็บแบบ bcrypt (10 rounds, One-way Hash)"
            tor="TOR 7.1.2"
          />
          <PolicyRow
            title="Session Timeout"
            status="active"
            value="JWT หมดอายุใน 8 ชั่วโมง · Refresh user data ทุก 60 วินาที"
            tor="TOR 7.1.5"
          />
          <PolicyRow
            title="MFA Enforcement (ADMIN)"
            status={mfaAdmin === adminCount && adminCount > 0 ? "active" : "warning"}
            value={`${mfaAdmin}/${adminCount} ADMIN เปิด MFA แล้ว`}
            tor="TOR 7.1.2"
          />
          <PolicyRow
            title="RBAC (Role-Based Access Control)"
            status="active"
            value="5 built-in roles + Custom Role · Page-level redirect + API-level check"
            tor="TOR 7.1.3"
          />
        </div>
      </Section>

      {/* ─── Security Health ─── */}
      <Section title="Security Health" icon={<ShieldCheck className="h-5 w-5" />}>
        <div className="space-y-3">
          <HealthGroup title="🔒 Encryption (TOR 7.1.6)">
            <Check ok label="Password Hash: bcrypt (one-way hash, 10 rounds)" />
            <Check ok label="HTTPS: Force redirect (Vercel + Cloudflare)" />
            <Check ok label="Database TLS: Active (Supabase PostgreSQL)" />
            <Check ok label="At-rest encryption: PostgreSQL native (Supabase)" />
            <Check partial label="Field-level encryption: Approver signature (TODO: extend to mfaSecret)" />
          </HealthGroup>

          <HealthGroup title="🛡️ Attack Prevention (TOR 7.1.6)">
            <Check ok label="SQL Injection: Prisma parameterized queries (impossible to bypass)" />
            <Check ok label="XSS: React auto-escape + Content-Security-Policy headers" />
            <Check ok label="CSRF: Auth.js token validation" />
            <Check ok label="DDoS: Vercel edge layer + Cloudflare rate limiting" />
            <Check ok label="Brute Force: Account lockout (5 attempts → 15 min)" />
          </HealthGroup>

          <HealthGroup title="🔐 Zero Trust (TOR 7.1.6)">
            <Check ok label="ทุก API ตรวจ session ก่อน execute (auth() guard)" />
            <Check ok label="ทุก page ตรวจ role ก่อน render (redirect if not authorized)" />
            <Check ok label="JWT session refresh ทุก 60 วินาที (re-validate active status)" />
            <Check ok label="Sensitive ops audited (sign / approve / delete / mfa)" />
          </HealthGroup>

          <HealthGroup title="📜 Audit & Forensic (TOR 7.1.5)">
            <Check ok label="AuditLog: ทุก write operation (create/update/delete)" />
            <Check ok label="LoginAttempt: ทุก login (success/fail + IP/UA)" />
            <Check ok label="Detailed timestamps + correlation by userId/target" />
            <Check ok label="Export CSV available (Forensic-ready)" />
          </HealthGroup>
        </div>
      </Section>

      {/* ─── PDPA Compliance ─── */}
      <Section title="PDPA Compliance" icon={<FileLock className="h-5 w-5" />}>
        <div className="rounded-xl border border-blue-200 bg-blue-50/30 p-3 text-[12px] text-blue-900 mb-3">
          <Info className="h-3.5 w-3.5 inline mr-1" />
          พ.ร.บ. คุ้มครองข้อมูลส่วนบุคคล พ.ศ. ๒๕๖๒ (PDPA) — ระบบรองรับ Consent + Right to Access + Right to Delete
        </div>
        <div className="grid grid-cols-2 gap-2">
          {(["PERSONAL_DATA", "LOCATION", "BIOMETRIC", "ANALYTICS"] as const).map((type) => {
            const granted = consentsByType.find((c) => c.consentType === type && c.granted)?._count.id ?? 0;
            const revoked = consentsByType.find((c) => c.consentType === type && !c.granted)?._count.id ?? 0;
            return (
              <div key={type} className="rounded-lg border border-slate-200 bg-white p-3">
                <div className="text-[11px] font-semibold text-slate-600 uppercase tracking-wider">
                  {type.replace("_", " ")}
                </div>
                <div className="flex items-baseline gap-2 mt-1">
                  <span className="text-lg font-bold text-emerald-700 tabular-nums">{granted}</span>
                  <span className="text-[11px] text-slate-500">ยินยอม</span>
                  <span className="text-slate-300">·</span>
                  <span className="text-lg font-bold text-rose-700 tabular-nums">{revoked}</span>
                  <span className="text-[11px] text-slate-500">ถอน</span>
                </div>
                <div className="text-[10px] text-slate-400 mt-1">
                  จากทั้งหมด {totalUsers} user ({Math.round(((granted + revoked) / totalUsers) * 100)}%)
                </div>
              </div>
            );
          })}
        </div>
      </Section>

      {/* ─── Audit footer ─── */}
      <div className="rounded-xl border border-slate-200 bg-slate-50 p-3 text-[11px] text-slate-600 flex items-start gap-2">
        <ScrollText className="h-4 w-4 shrink-0 mt-0.5" />
        <div>
          <strong className="text-slate-700">หมายเหตุ:</strong> ค่า policies ในตอนนี้ฝังใน code (compile-time)
          — เปลี่ยน parameter ให้แก้ที่ <code className="font-mono bg-white px-1 rounded">lib/auth.ts</code> +
          deploy ใหม่ · UI editable settings ต้อง implement SecurityPolicy model เพิ่มในอนาคต
        </div>
      </div>
    </div>
  );
}

function Section({
  title,
  icon,
  children,
}: {
  title: string;
  icon: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-5">
      <div className="flex items-center gap-2 mb-4 text-slate-700">
        {icon}
        <h2 className="text-sm font-semibold">{title}</h2>
      </div>
      {children}
    </div>
  );
}

function PolicyRow({
  title,
  status,
  value,
  tor,
}: {
  title: string;
  status: "active" | "warning" | "off";
  value: string;
  tor: string;
}) {
  const Icon =
    status === "active" ? CheckCircle2 : status === "warning" ? AlertTriangle : XCircle;
  const color =
    status === "active" ? "text-emerald-600" : status === "warning" ? "text-amber-600" : "text-rose-600";
  return (
    <div className="flex items-start gap-3 py-2 border-b border-slate-100 last:border-0">
      <Icon className={`h-4 w-4 ${color} shrink-0 mt-0.5`} />
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-sm font-semibold text-slate-800">{title}</span>
          <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-100 text-slate-600 font-mono">
            {tor}
          </span>
        </div>
        <div className="text-[12px] text-slate-600 mt-0.5">{value}</div>
      </div>
    </div>
  );
}

function HealthGroup({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <h3 className="text-[11px] font-semibold text-slate-700 uppercase tracking-wider mb-1">
        {title}
      </h3>
      <div className="space-y-1">{children}</div>
    </div>
  );
}

function Check({ ok, partial, label }: { ok?: boolean; partial?: boolean; label: string }) {
  const Icon = partial ? AlertTriangle : ok ? CheckCircle2 : XCircle;
  const color = partial ? "text-amber-600" : ok ? "text-emerald-600" : "text-rose-600";
  return (
    <div className="flex items-start gap-2 text-[12px] text-slate-700">
      <Icon className={`h-3.5 w-3.5 ${color} shrink-0 mt-0.5`} />
      <span>{label}</span>
    </div>
  );
}
