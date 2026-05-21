// /reports/exec-summary — Executive Summary AI (TOR 6.2 / 8.10.10)
// AI สรุปสถานการณ์ระบบทั้งหมดให้ผู้บริหาร

import Link from "next/link";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { PageHeader } from "@/components/page-header";
import {
  FileText,
  ArrowLeft,
  Sparkles,
  Calendar,
  TrendingUp,
  Users as UsersIcon,
} from "lucide-react";
import { ExecSummaryGenerator } from "./generator";

export const dynamic = "force-dynamic";

type Role = "ADMIN" | "COMMANDER" | "STAFF" | "AUDITOR" | "VIEWER";

const SCOPE_LABEL: Record<string, string> = {
  NATIONAL: "ระดับชาติ",
  REGION: "ระดับภาค",
  UNIT: "ระดับหน่วย",
};

export default async function ExecSummaryListPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");
  const role = session.user.role as Role;
  if (!["ADMIN", "COMMANDER", "AUDITOR"].includes(role)) redirect("/");

  const summaries = await prisma.executiveSummary.findMany({
    orderBy: { generatedAt: "desc" },
    take: 30,
    include: {
      generatedBy: { select: { name: true, rank: true } },
      unit: { select: { code: true, name: true } },
    },
  });

  // Pre-load aggregates for context
  const [
    activeMissions,
    openIncidents,
    pendingCommands,
    redKpis,
  ] = await Promise.all([
    prisma.mission.count({ where: { status: { in: ["ACTIVE", "IN_PROGRESS"] } } }),
    prisma.incident.count({ where: { status: "open" } }),
    prisma.command.count({ where: { status: { in: ["SUBMITTED", "APPROVED", "PUBLISHED"] } } }),
    prisma.kpi.count({ where: { status: "red" } }),
  ]);

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      <Link
        href="/reports"
        className="inline-flex items-center gap-1 text-sm text-slate-600 hover:text-slate-900"
      >
        <ArrowLeft className="h-4 w-4" />
        กลับยังรายงาน & สรุป
      </Link>

      <PageHeader
        icon={FileText}
        eyebrow="Reports · Executive Summary"
        title="สรุปสำหรับผู้บริหาร (AI)"
        description="AI ดึงข้อมูลจาก Mission · KPI · Command · Incident มาสร้างสรุป 1 หน้า"
        live
      />

      {/* Current snapshot stats */}
      <div className="grid grid-cols-4 gap-3">
        <Stat label="Mission ใช้งาน" value={activeMissions} color="blue" icon={<TrendingUp className="h-4 w-4" />} />
        <Stat label="เหตุการณ์เปิด" value={openIncidents} color="rose" icon={<Sparkles className="h-4 w-4" />} />
        <Stat label="คำสั่งรอ" value={pendingCommands} color="amber" icon={<Calendar className="h-4 w-4" />} />
        <Stat label="KPI Red" value={redKpis} color="violet" icon={<UsersIcon className="h-4 w-4" />} />
      </div>

      {/* Generator client */}
      <ExecSummaryGenerator />

      {/* History */}
      <div>
        <h2 className="text-sm font-semibold text-slate-700 uppercase tracking-wider mb-3">
          ประวัติ ({summaries.length})
        </h2>
        {summaries.length === 0 ? (
          <div className="rounded-xl border border-dashed border-slate-300 bg-slate-50 p-12 text-center">
            <FileText className="h-10 w-10 text-slate-300 mx-auto mb-3" />
            <p className="text-sm text-slate-500">
              ยังไม่มี Executive Summary — กดสร้างใหม่ด้านบน
            </p>
          </div>
        ) : (
          <div className="space-y-2">
            {summaries.map((s) => (
              <div
                key={s.id}
                className="rounded-lg border border-slate-200 bg-white p-4 hover:border-slate-300 hover:shadow-sm transition-all"
              >
                <div className="flex items-start gap-3 mb-2">
                  <FileText className="h-4 w-4 text-blue-500 shrink-0 mt-0.5" />
                  <div className="flex-1 min-w-0">
                    <h3 className="text-sm font-semibold text-slate-900">{s.title}</h3>
                    <div className="text-[11px] text-slate-500 flex flex-wrap gap-2 mt-0.5">
                      <span>{SCOPE_LABEL[s.scope] ?? s.scope}</span>
                      <span>·</span>
                      <span>{s.period}</span>
                      {s.unit && (
                        <>
                          <span>·</span>
                          <span>{s.unit.code} — {s.unit.name}</span>
                        </>
                      )}
                      <span>·</span>
                      <span>
                        {new Date(s.generatedAt).toLocaleString("th-TH", {
                          dateStyle: "medium",
                          timeStyle: "short",
                        })}
                      </span>
                    </div>
                  </div>
                  <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-100 text-slate-600">
                    {s.tokensUsed} tokens
                  </span>
                </div>
                <p className="text-sm text-slate-700 whitespace-pre-wrap line-clamp-4">
                  {s.summaryText}
                </p>
                {s.concerns.length > 0 && (
                  <div className="mt-2 pt-2 border-t border-slate-100">
                    <div className="text-[10px] font-semibold text-rose-700 uppercase tracking-wider mb-1">
                      ⚠️ ประเด็นที่กังวล
                    </div>
                    <ul className="text-[12px] text-slate-700 space-y-0.5 list-disc list-inside">
                      {s.concerns.slice(0, 3).map((c, i) => (
                        <li key={i}>{c}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

const STAT_COLORS = {
  blue: "bg-blue-50 text-blue-700 border-blue-200",
  rose: "bg-rose-50 text-rose-700 border-rose-200",
  amber: "bg-amber-50 text-amber-700 border-amber-200",
  violet: "bg-violet-50 text-violet-700 border-violet-200",
} as const;

function Stat({
  label,
  value,
  color,
  icon,
}: {
  label: string;
  value: number;
  color: keyof typeof STAT_COLORS;
  icon: React.ReactNode;
}) {
  return (
    <div className={`rounded-sm border ${STAT_COLORS[color]} p-3`}>
      <div className="flex items-center justify-between mb-1">
        <div className="text-[10px] font-semibold uppercase tracking-wider opacity-80">
          {label}
        </div>
        <div className="opacity-60">{icon}</div>
      </div>
      <div className="text-2xl font-semibold tabular-nums">{value}</div>
    </div>
  );
}
