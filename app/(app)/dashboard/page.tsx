// Dashboard — TOR 5.4.4 (4.9) + 5.7 + 6.1
// Real DB data for KPI + activities; demo chart data for trend visualization

import Link from "next/link";
import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { KpiCard } from "@/components/kpi-card";
import { CommandLineChart } from "@/components/charts/command-line-chart";
import { UnitBarChart } from "@/components/charts/unit-bar-chart";
import { StatusPieChart } from "@/components/charts/status-pie-chart";
import { IncidentMap } from "@/components/charts/incident-map";
import { AlertCircle, CheckCircle2, FileEdit, Sparkles, LogIn } from "lucide-react";
import {
  STATUS_LABELS,
  type CommandStatus,
} from "@/features/commands/types";

export const dynamic = "force-dynamic";

const activityIcons: Record<string, React.ReactNode> = {
  command: <FileEdit className="h-4 w-4" />,
  login: <LogIn className="h-4 w-4" />,
  ai: <Sparkles className="h-4 w-4" />,
  audit: <CheckCircle2 className="h-4 w-4" />,
  default: <AlertCircle className="h-4 w-4" />,
};

const activityColors: Record<string, string> = {
  command: "bg-blue-100 text-blue-700",
  login: "bg-emerald-100 text-emerald-700",
  ai: "bg-violet-100 text-violet-700",
  audit: "bg-amber-100 text-amber-700",
  default: "bg-slate-100 text-slate-600",
};

function iconKey(action: string) {
  if (action.startsWith("command.")) return "command";
  if (action.startsWith("auth.")) return "login";
  if (action.startsWith("ai.")) return "ai";
  if (action.startsWith("audit.")) return "audit";
  return "default";
}

function timeAgo(date: Date): string {
  const diff = Date.now() - date.getTime();
  const min = Math.floor(diff / 60000);
  if (min < 1) return "เมื่อสักครู่";
  if (min < 60) return `${min} นาทีที่แล้ว`;
  const hr = Math.floor(min / 60);
  if (hr < 24) return `${hr} ชั่วโมงที่แล้ว`;
  const day = Math.floor(hr / 24);
  if (day < 30) return `${day} วันที่แล้ว`;
  return date.toLocaleDateString("th-TH");
}

export default async function DashboardPage() {
  const session = await auth();
  if (!session?.user) redirect("/login");

  // ─── Fetch real data ──────────────────────────────
  const [
    totalCommands,
    activeCommands,
    closedCommands,
    publishedCommands,
    statusGroups,
    totalUsers,
    activeAlerts,
    recentAudit,
  ] = await Promise.all([
    prisma.command.count(),
    prisma.command.count({
      where: {
        status: {
          in: [
            "SUBMITTED",
            "APPROVED",
            "PUBLISHED",
            "ACKNOWLEDGED",
            "IN_PROGRESS",
            "REPORTED",
            "AUDITED",
          ],
        },
      },
    }),
    prisma.command.count({ where: { status: "CLOSED" } }),
    prisma.command.count({
      where: {
        status: { in: ["PUBLISHED", "ACKNOWLEDGED", "IN_PROGRESS"] },
      },
    }),
    prisma.command.groupBy({
      by: ["status"],
      _count: { id: true },
    }),
    prisma.user.count({ where: { active: true } }),
    prisma.command.count({
      where: { priority: { in: ["URGENT", "CRITICAL"] } },
    }),
    prisma.auditLog.findMany({
      take: 8,
      orderBy: { createdAt: "desc" },
      include: {
        user: { select: { name: true, rank: true } },
      },
    }),
  ]);

  const completionRate =
    totalCommands > 0
      ? Math.round((closedCommands / totalCommands) * 1000) / 10
      : 0;

  return (
    <div className="space-y-6 max-w-[1600px] mx-auto">
      {/* Header */}
      <div className="flex items-end justify-between">
        <div>
          <h2 className="text-2xl font-semibold text-slate-900 tracking-tight">
            แดชบอร์ดภาพรวม
          </h2>
          <p className="text-sm text-slate-500 mt-1">
            สวัสดี {session.user.rank} {session.user.name} ·
            ภาพรวมการปฏิบัติงานปัจจุบัน
          </p>
        </div>
        <span className="inline-flex items-center gap-1.5 rounded-full bg-white text-slate-600 text-xs font-medium px-3 py-1 border border-slate-200 shadow-sm">
          <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
          Real-time
        </span>
      </div>

      {/* KPI Cards — REAL DATA */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        <KpiCard
          label="คำสั่งทั้งหมด"
          value={totalCommands}
          change={0}
          sub="จากฐานข้อมูล"
        />
        <KpiCard
          label="กำลังดำเนินการ"
          value={activeCommands}
          change={0}
          sub="ระหว่างวงจร 9 สถานะ"
        />
        <KpiCard
          label="ปิดสมบูรณ์แล้ว"
          value={closedCommands}
          change={0}
          sub={`อัตรา ${completionRate}%`}
        />
        <KpiCard
          label="เผยแพร่/รับทราบ"
          value={publishedCommands}
          change={0}
          sub="คำสั่งที่ถึงหน่วยรับ"
        />
        <KpiCard
          label="ผู้ใช้งานในระบบ"
          value={totalUsers}
          change={0}
          sub="ผู้ใช้ที่ active"
        />
        <KpiCard
          label="คำสั่งด่วน"
          value={activeAlerts}
          change={0}
          sub="ลำดับ ด่วน/ด่วนที่สุด"
        />
      </div>

      {/* Charts row 1: Line + Pie */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 rounded-xl border border-slate-200 bg-white p-5">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="font-semibold text-slate-900">
                แนวโน้มคำสั่งรายเดือน
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                12 เดือนย้อนหลัง
              </p>
            </div>
          </div>
          <CommandLineChart />
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-5">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="font-semibold text-slate-900">
                สัดส่วนสถานะคำสั่ง
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                แยกตามสถานะปัจจุบัน
              </p>
            </div>
          </div>
          {/* Real status counts */}
          <div className="space-y-2">
            {statusGroups
              .sort((a, b) => b._count.id - a._count.id)
              .map((g) => {
                const pct =
                  totalCommands > 0
                    ? Math.round((g._count.id / totalCommands) * 100)
                    : 0;
                return (
                  <div
                    key={g.status}
                    className="flex items-center gap-2 text-xs"
                  >
                    <span className="w-20 text-slate-700">
                      {STATUS_LABELS[g.status as CommandStatus]}
                    </span>
                    <div className="flex-1 h-2 rounded-full bg-slate-100 overflow-hidden">
                      <div
                        className="h-full bg-blue-500 rounded-full transition-all"
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                    <span className="w-10 text-right font-mono text-slate-600">
                      {g._count.id}
                    </span>
                  </div>
                );
              })}
            {statusGroups.length === 0 && (
              <p className="text-xs text-slate-400 italic">ยังไม่มีข้อมูล</p>
            )}
          </div>
          <div className="mt-4 pt-3 border-t border-slate-100">
            <StatusPieChart />
            </div>
        </div>
      </div>

      {/* Charts row 2: Bar + Map */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="rounded-xl border border-slate-200 bg-white p-5">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="font-semibold text-slate-900">
                คำสั่งแยกตามหน่วยงาน
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                แยกตาม 6 หน่วยงานหลัก
              </p>
            </div>
          </div>
          <UnitBarChart />
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-5">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="font-semibold text-slate-900">
                แผนที่เหตุการณ์สำคัญ
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                GIS Heatmap แสดงเหตุการณ์
              </p>
            </div>
          </div>
          <IncidentMap />
        </div>
      </div>

      {/* Recent activities — REAL AUDIT LOG */}
      <div className="rounded-xl border border-slate-200 bg-white p-5">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="font-semibold text-slate-900">
              กิจกรรมล่าสุด
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              บันทึกกิจกรรมล่าสุดจากระบบ
            </p>
          </div>
          <Link
            href="/security/audit"
            className="text-xs text-blue-700 font-medium hover:underline"
          >
            ดูทั้งหมด
          </Link>
        </div>
        <div className="space-y-3">
          {recentAudit.length === 0 ? (
            <p className="text-sm text-slate-500 italic">ยังไม่มีกิจกรรม</p>
          ) : (
            recentAudit.map((act) => {
              const k = iconKey(act.action);
              return (
                <div
                  key={act.id}
                  className="flex items-start gap-3 p-3 rounded-lg hover:bg-slate-50 transition-colors"
                >
                  <div
                    className={`h-8 w-8 rounded-lg flex items-center justify-center shrink-0 ${
                      activityColors[k] ?? activityColors.default
                    }`}
                  >
                    {activityIcons[k] ?? activityIcons.default}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-slate-900 truncate">
                      <span className="font-mono text-xs text-slate-500 mr-2">
                        {act.action}
                      </span>
                      {act.target}
                    </p>
                    <div className="flex items-center gap-2 mt-1 text-xs text-slate-500">
                      <span>
                        {act.user
                          ? `${act.user.rank ?? ""} ${act.user.name}`
                          : "ระบบ"}
                      </span>
                      <span>•</span>
                      <span>{timeAgo(act.createdAt)}</span>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}
