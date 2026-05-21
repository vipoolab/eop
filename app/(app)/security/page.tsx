// /security — Security Hub (TOR ๗.๑)

import Link from "next/link";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { PageHeader } from "@/components/page-header";
import {
  ShieldAlert,
  KeyRound,
  Users as UsersIcon,
  ScrollText,
  Settings as SettingsIcon,
  ArrowRight,
  Activity,
  AlertTriangle,
} from "lucide-react";
import { timeAgo } from "@/lib/time";

export const dynamic = "force-dynamic";

type Role = "ADMIN" | "COMMANDER" | "STAFF" | "AUDITOR" | "VIEWER";

export default async function SecurityHubPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");
  const role = session.user.role as Role;
  if (!["ADMIN", "COMMANDER", "AUDITOR"].includes(role)) redirect("/security/my-account");

  const now = new Date();
  const todayStart = new Date(now.setHours(0, 0, 0, 0));

  const [
    activeSessions,
    failedLoginsToday,
    totalUsers,
    mfaUsers,
    lockedUsers,
    recentAudit,
  ] = await Promise.all([
    prisma.session.count({ where: { expires: { gt: new Date() } } }),
    prisma.loginAttempt.count({
      where: { success: false, createdAt: { gte: todayStart } },
    }),
    prisma.user.count({ where: { active: true } }),
    prisma.user.count({ where: { active: true, mfaEnabled: true } }),
    prisma.user.count({
      where: { lockedUntil: { gt: new Date() } },
    }),
    prisma.auditLog.findMany({
      orderBy: { createdAt: "desc" },
      take: 10,
      include: { user: { select: { name: true, rank: true } } },
    }),
  ]);

  const mfaCoverage = totalUsers > 0 ? Math.round((mfaUsers / totalUsers) * 100) : 0;

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      <PageHeader
        icon={ShieldAlert}
        eyebrow="Infrastructure & Security · TOR 5.4.7"
        title="ภาพรวมความปลอดภัย"
        description="สถานะ Session · MFA · Login attempts · Activity ทั้งระบบ"
      />

      {/* Top stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <Stat
          icon={<Activity className="h-5 w-5" />}
          label="Active Sessions"
          value={activeSessions}
          accent="blue"
        />
        <Stat
          icon={<AlertTriangle className="h-5 w-5" />}
          label="Failed Login วันนี้"
          value={failedLoginsToday}
          accent={failedLoginsToday > 5 ? "rose" : "slate"}
        />
        <Stat
          icon={<KeyRound className="h-5 w-5" />}
          label="MFA Coverage"
          value={`${mfaCoverage}%`}
          accent={mfaCoverage >= 70 ? "emerald" : "amber"}
          subtitle={`${mfaUsers}/${totalUsers} user`}
        />
        <Stat
          icon={<ShieldAlert className="h-5 w-5" />}
          label="บัญชีถูกล็อก"
          value={lockedUsers}
          accent={lockedUsers > 0 ? "rose" : "emerald"}
        />
      </div>

      {/* Nav cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        <NavCard
          href="/security/my-account"
          icon={<KeyRound className="h-5 w-5" />}
          color="blue"
          title="บัญชีของฉัน"
          desc="MFA · Sessions · Login history · PDPA"
        />
        {role === "ADMIN" && (
          <NavCard
            href="/security/users-roles"
            icon={<UsersIcon className="h-5 w-5" />}
            color="violet"
            title="บัญชี & สิทธิ์"
            desc="User CRUD · Roles · Permissions"
          />
        )}
        {(role === "ADMIN" || role === "AUDITOR") && (
          <NavCard
            href="/security/logs"
            icon={<ScrollText className="h-5 w-5" />}
            color="amber"
            title="Activity & Logs"
            desc="Activity log · Login attempts · Export CSV"
          />
        )}
        {role === "ADMIN" && (
          <NavCard
            href="/security/settings"
            icon={<SettingsIcon className="h-5 w-5" />}
            color="emerald"
            title="Settings & Health"
            desc="Policies · Zero Trust · Encryption · Attack prevention"
          />
        )}
      </div>

      {/* Recent activity */}
      <div>
        <h2 className="text-sm font-semibold text-slate-700 uppercase tracking-wider mb-3">
          กิจกรรมล่าสุด ({recentAudit.length})
        </h2>
        <div className="rounded-xl border border-slate-200 bg-white divide-y divide-slate-100">
          {recentAudit.length === 0 ? (
            <div className="p-6 text-center text-sm text-slate-500">
              ยังไม่มีกิจกรรม
            </div>
          ) : (
            recentAudit.map((a) => (
              <div key={a.id} className="p-3 flex items-center gap-3">
                <Activity className="h-4 w-4 text-slate-400 shrink-0" />
                <div className="flex-1 min-w-0">
                  <div className="text-sm text-slate-800 truncate">
                    <code className="text-[11px] bg-slate-100 px-1.5 py-0.5 rounded mr-1">
                      {a.action}
                    </code>
                    {a.user && (
                      <span className="text-slate-600">
                        {a.user.rank ?? ""} {a.user.name}
                      </span>
                    )}
                  </div>
                  {a.target && (
                    <div className="text-[10px] text-slate-400 font-mono truncate">
                      {a.target}
                    </div>
                  )}
                </div>
                <span className="text-[11px] text-slate-500 shrink-0">
                  {timeAgo(a.createdAt)}
                </span>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}

const STAT_COLORS = {
  blue: "bg-blue-50 text-blue-700 border-blue-200",
  rose: "bg-rose-50 text-rose-700 border-rose-200",
  amber: "bg-amber-50 text-amber-700 border-amber-200",
  emerald: "bg-emerald-50 text-emerald-700 border-emerald-200",
  slate: "bg-slate-50 text-slate-700 border-slate-200",
} as const;

function Stat({
  icon,
  label,
  value,
  accent,
  subtitle,
}: {
  icon: React.ReactNode;
  label: string;
  value: number | string;
  accent: keyof typeof STAT_COLORS;
  subtitle?: string;
}) {
  return (
    <div className={`rounded-sm border ${STAT_COLORS[accent]} p-3`}>
      <div className="flex items-center justify-between mb-1">
        <div className="text-[10px] font-semibold uppercase tracking-wider opacity-80">
          {label}
        </div>
        <div className="opacity-60">{icon}</div>
      </div>
      <div className="text-2xl font-semibold tabular-nums">{value}</div>
      {subtitle && (
        <div className="text-[10px] opacity-70 mt-0.5">{subtitle}</div>
      )}
    </div>
  );
}

const CARD_COLORS = {
  blue: "border-blue-200 hover:border-blue-400 bg-blue-50/30",
  violet: "border-violet-200 hover:border-violet-400 bg-violet-50/30",
  amber: "border-amber-200 hover:border-amber-400 bg-amber-50/30",
  emerald: "border-emerald-200 hover:border-emerald-400 bg-emerald-50/30",
} as const;

const ICON_BG = {
  blue: "bg-blue-100 text-blue-700",
  violet: "bg-violet-100 text-violet-700",
  amber: "bg-amber-100 text-amber-700",
  emerald: "bg-emerald-100 text-emerald-700",
} as const;

function NavCard({
  href,
  icon,
  color,
  title,
  desc,
}: {
  href: string;
  icon: React.ReactNode;
  color: keyof typeof CARD_COLORS;
  title: string;
  desc: string;
}) {
  return (
    <Link
      href={href}
      className={`group block rounded-xl border-2 ${CARD_COLORS[color]} p-4 hover:shadow-md transition-all`}
    >
      <div className="flex items-start gap-3">
        <div
          className={`flex h-10 w-10 items-center justify-center rounded-lg ${ICON_BG[color]} shrink-0`}
        >
          {icon}
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="text-sm font-semibold text-slate-900">{title}</h3>
          <p className="text-[11px] text-slate-600 mt-0.5">{desc}</p>
        </div>
        <ArrowRight className="h-4 w-4 text-slate-400 group-hover:translate-x-1 transition-transform" />
      </div>
    </Link>
  );
}
