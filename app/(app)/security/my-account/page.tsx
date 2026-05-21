// /security/my-account — บัญชีของฉัน (TOR ๗.๑.๒ + ๗.๑.๔ + ๗.๑.๕ + PDPA)

import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { PageHeader } from "@/components/page-header";
import {
  KeyRound,
  User as UserIcon,
  Monitor,
  History,
  FileLock,
  ShieldCheck,
  ShieldOff,
} from "lucide-react";
import { ChangePasswordForm } from "./change-password-form";
import { MfaSection } from "./mfa-section";
import { SessionsSection } from "./sessions-section";
import { ConsentSection } from "./consent-section";

export const dynamic = "force-dynamic";

export default async function MyAccountPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  const me = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: {
      id: true,
      email: true,
      name: true,
      rank: true,
      position: true,
      badgeNo: true,
      mfaEnabled: true,
      mfaEnabledAt: true,
      passwordChangedAt: true,
      lastLoginAt: true,
      createdAt: true,
      unit: { select: { code: true, name: true } },
    },
  });
  if (!me) redirect("/login");

  const [sessions, loginHistory, consents] = await Promise.all([
    prisma.session.findMany({
      where: { userId: me.id, expires: { gt: new Date() } },
      orderBy: { createdAt: "desc" },
    }),
    prisma.loginAttempt.findMany({
      where: { email: me.email },
      orderBy: { createdAt: "desc" },
      take: 15,
    }),
    prisma.consentRecord.findMany({
      where: { userId: me.id },
      orderBy: { grantedAt: "desc" },
    }),
  ]);

  // Find current session token from cookie? — for demo just show all
  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <PageHeader
        icon={KeyRound}
        eyebrow="Security · TOR 7.1"
        title="บัญชีของฉัน"
        description="MFA · Sessions · Login history · PDPA Consent"
      />

      {/* ─── Profile ─── */}
      <Section icon={<UserIcon className="h-5 w-5" />} title="ข้อมูลส่วนตัว">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
          <Field label="ชื่อ-ยศ" value={`${me.rank ?? ""} ${me.name}`.trim()} />
          <Field label="อีเมล" value={me.email} mono />
          <Field label="ตำแหน่ง" value={me.position ?? "—"} />
          <Field label="หมายเลข" value={me.badgeNo ?? "—"} mono />
          {me.unit && (
            <Field label="หน่วยงาน" value={`${me.unit.code} — ${me.unit.name}`} />
          )}
          <Field
            label="Login ล่าสุด"
            value={
              me.lastLoginAt
                ? new Date(me.lastLoginAt).toLocaleString("th-TH", {
                    dateStyle: "medium",
                    timeStyle: "short",
                  })
                : "—"
            }
          />
        </div>
      </Section>

      {/* ─── Password ─── */}
      <Section
        icon={<KeyRound className="h-5 w-5" />}
        title="รหัสผ่าน"
        subtitle={
          me.passwordChangedAt
            ? `เปลี่ยนล่าสุด ${new Date(me.passwordChangedAt).toLocaleDateString("th-TH", { dateStyle: "medium" })}`
            : "ยังไม่เคยเปลี่ยน"
        }
      >
        <ChangePasswordForm />
      </Section>

      {/* ─── MFA ─── */}
      <Section
        icon={me.mfaEnabled ? <ShieldCheck className="h-5 w-5 text-emerald-600" /> : <ShieldOff className="h-5 w-5 text-slate-400" />}
        title="MFA (Multi-Factor Authentication)"
        subtitle={
          me.mfaEnabled
            ? `เปิดใช้ตั้งแต่ ${me.mfaEnabledAt ? new Date(me.mfaEnabledAt).toLocaleDateString("th-TH", { dateStyle: "medium" }) : "—"}`
            : "ยังไม่ได้เปิดใช้ — แนะนำให้เปิดเพื่อความปลอดภัย"
        }
      >
        <MfaSection enabled={me.mfaEnabled} />
      </Section>

      {/* ─── Active Sessions ─── */}
      <Section
        icon={<Monitor className="h-5 w-5" />}
        title="Sessions ที่กำลังเปิด"
        subtitle={`${sessions.length} session`}
      >
        <SessionsSection sessions={sessions} />
      </Section>

      {/* ─── Login History ─── */}
      <Section icon={<History className="h-5 w-5" />} title="ประวัติการเข้าระบบ (15 ครั้งล่าสุด)">
        {loginHistory.length === 0 ? (
          <div className="text-sm text-slate-400 text-center py-4">ไม่มีประวัติ</div>
        ) : (
          <div className="space-y-1">
            {loginHistory.map((l) => (
              <div
                key={l.id}
                className={`flex items-center gap-2 text-[12px] rounded px-2 py-1.5 ${l.success ? "bg-emerald-50/50 text-emerald-900" : "bg-rose-50/50 text-rose-900"}`}
              >
                <span className="text-base">{l.success ? "✓" : "✗"}</span>
                <span className="font-mono text-[10px] flex-1 truncate">{l.ipAddress}</span>
                <span className="text-[10px] text-slate-500 hidden md:inline truncate max-w-[180px]">
                  {l.userAgent ?? "—"}
                </span>
                {!l.success && l.failReason && (
                  <span className="text-[10px] px-1.5 py-0.5 rounded bg-rose-100 text-rose-700">
                    {l.failReason}
                  </span>
                )}
                <span className="text-[10px] text-slate-500 tabular-nums">
                  {new Date(l.createdAt).toLocaleString("th-TH", {
                    dateStyle: "short",
                    timeStyle: "short",
                  })}
                </span>
              </div>
            ))}
          </div>
        )}
      </Section>

      {/* ─── PDPA Consent ─── */}
      <Section
        icon={<FileLock className="h-5 w-5" />}
        title="PDPA Consent"
        subtitle="การให้ความยินยอมตาม พ.ร.บ. คุ้มครองข้อมูลส่วนบุคคล"
      >
        <ConsentSection consents={consents} />
      </Section>
    </div>
  );
}

function Section({
  icon,
  title,
  subtitle,
  children,
}: {
  icon: React.ReactNode;
  title: string;
  subtitle?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-5">
      <div className="flex items-start gap-3 mb-4">
        <div className="text-slate-600">{icon}</div>
        <div className="flex-1 min-w-0">
          <h2 className="text-sm font-semibold text-slate-900">{title}</h2>
          {subtitle && <p className="text-[11px] text-slate-500 mt-0.5">{subtitle}</p>}
        </div>
      </div>
      {children}
    </div>
  );
}

function Field({ label, value, mono = false }: { label: string; value: string; mono?: boolean }) {
  return (
    <div>
      <div className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider mb-0.5">
        {label}
      </div>
      <div className={`text-sm text-slate-800 ${mono ? "font-mono text-[12px]" : ""}`}>
        {value}
      </div>
    </div>
  );
}
