// Compliance Dashboard — ภาพรวมสำหรับผู้บริหาร (ผบ.ตร./สยศ.ตร.)

import Link from "next/link";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { PageHeader } from "@/components/page-header";
import {
  ShieldCheck,
  Clock,
  TrendingUp,
  TrendingDown,
  Minus,
  ArrowRight,
  CheckCircle2,
  AlertCircle,
} from "lucide-react";
import {
  STANDARD_LABELS,
  STANDARD_COLORS,
  STATUS_LABELS,
  STATUS_COLORS,
  URGENCY_COLORS,
  getDeadlineUrgency,
  calculateReportScore,
  type ComplianceStandard,
  type ReportStatus,
} from "@/features/compliance/types";

export const dynamic = "force-dynamic";

const ALL_STANDARDS: ComplianceStandard[] = ["GOR_POR_ROR", "ITA", "PMQA", "GOV4_0"];

export default async function ComplianceDashboardPage() {
  const session = await auth();
  if (!session?.user) redirect("/login");

  // All reports with answers + template
  const allReports = await prisma.complianceReport.findMany({
    include: {
      template: {
        select: { code: true, name: true, standard: true, items: { select: { weight: true } } },
      },
      answers: { select: { selfScore: true, reviewerScore: true, itemId: true } },
      unit: { select: { code: true, name: true } },
    },
    orderBy: { createdAt: "desc" },
  });

  // Compute score % for each report
  const reportsScored = allReports.map((r) => {
    const itemMap = new Map<string, number>();
    r.template.items.forEach((it, i) => {
      // We don't have item.id here, but we can match by index — but answers reference itemId not index
      // Skip this approach — use stored r.score/r.maxScore
      itemMap.set(String(i), it.weight);
    });
    const percent = r.score && r.maxScore ? (r.score / r.maxScore) * 100 : 0;
    return { ...r, percent };
  });

  // Group latest report per standard (for current year)
  const currentByStd = new Map<ComplianceStandard, typeof reportsScored[number]>();
  for (const r of reportsScored) {
    const std = r.template.standard as ComplianceStandard;
    if (!currentByStd.has(std)) currentByStd.set(std, r);
  }

  // Find previous report per standard for trend comparison
  function prevPercent(std: ComplianceStandard): number | null {
    const list = reportsScored.filter(
      (r) => r.template.standard === std && r.status === "APPROVED"
    );
    if (list.length < 2) return null;
    return list[1].percent;
  }

  // Upcoming deadlines (not APPROVED, has dueDate, sorted by dueDate)
  const upcoming = reportsScored
    .filter((r) => r.dueDate && r.status !== "APPROVED")
    .sort((a, b) => (a.dueDate!.getTime() - b.dueDate!.getTime()))
    .slice(0, 5);

  // Overall stats
  const stats = {
    total: reportsScored.length,
    draft: reportsScored.filter((r) => r.status === "DRAFT").length,
    inReview: reportsScored.filter((r) => r.status === "SUBMITTED" || r.status === "REVIEWED").length,
    approved: reportsScored.filter((r) => r.status === "APPROVED").length,
  };

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      <PageHeader
        icon={ShieldCheck}
        eyebrow="Compliance Overview"
        title="ภาพรวมการประเมินมาตรฐานราชการ"
        description="คะแนน 4 มาตรฐาน + กำหนดส่งใกล้ + Trend ปีก่อน"
        actions={
          <Link
            href="/compliance/reports"
            className="inline-flex items-center gap-1 text-sm text-slate-600 hover:text-slate-900"
          >
            ดูทุกรายงาน <ArrowRight className="h-4 w-4" />
          </Link>
        }
      />

      {/* Overall stats */}
      <div className="grid grid-cols-4 gap-3">
        <StatCard label="ทั้งหมด" value={stats.total} accent="slate" />
        <StatCard label="กำลังกรอก" value={stats.draft} accent="blue" />
        <StatCard label="ตรวจ/รออนุมัติ" value={stats.inReview} accent="amber" />
        <StatCard label="ส่งภายนอกแล้ว" value={stats.approved} accent="emerald" />
      </div>

      {/* 4 Standards cards */}
      <div>
        <h2 className="text-sm font-semibold text-slate-700 uppercase tracking-wider mb-3">
          คะแนนตามมาตรฐาน
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
          {ALL_STANDARDS.map((std) => {
            const r = currentByStd.get(std);
            const prev = prevPercent(std);
            const trend = r && prev !== null ? r.percent - prev : null;
            return (
              <div
                key={std}
                className={`rounded-xl border-2 p-4 transition-all ${
                  r ? "border-slate-200 bg-white hover:border-slate-300" : "border-dashed border-slate-300 bg-slate-50"
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <span className={`text-[10px] px-1.5 py-0.5 rounded border font-semibold ${STANDARD_COLORS[std]}`}>
                    {STANDARD_LABELS[std]}
                  </span>
                  {trend !== null && (
                    <span className={`text-[10px] inline-flex items-center gap-0.5 ${
                      trend > 0 ? "text-emerald-700" : trend < 0 ? "text-rose-700" : "text-slate-500"
                    }`}>
                      {trend > 0 ? <TrendingUp className="h-3 w-3" /> :
                       trend < 0 ? <TrendingDown className="h-3 w-3" /> :
                       <Minus className="h-3 w-3" />}
                      {trend > 0 ? "+" : ""}{trend.toFixed(0)}%
                    </span>
                  )}
                </div>
                {r ? (
                  <>
                    <div className={`text-4xl font-bold tabular-nums mb-1 ${
                      r.percent >= 80 ? "text-emerald-700" :
                      r.percent >= 60 ? "text-amber-700" :
                      "text-rose-700"
                    }`}>
                      {Math.round(r.percent)}%
                    </div>
                    <div className="text-[11px] text-slate-600 mb-2 truncate">
                      {r.period}
                    </div>
                    <span className={`text-[10px] px-1.5 py-0.5 rounded border font-semibold ${STATUS_COLORS[r.status as ReportStatus]}`}>
                      {STATUS_LABELS[r.status as ReportStatus]}
                    </span>
                    <Link
                      href={`/compliance/reports/${r.id}`}
                      className="block mt-2 text-[10px] text-blue-600 hover:underline"
                    >
                      เปิดดู →
                    </Link>
                  </>
                ) : (
                  <div className="text-center py-2">
                    <div className="text-2xl text-slate-300 mb-1">—</div>
                    <div className="text-[11px] text-slate-500">ยังไม่ได้ทำ</div>
                    <Link
                      href="/compliance/reports/new"
                      className="block mt-2 text-[10px] text-blue-600 hover:underline"
                    >
                      สร้างรายงาน →
                    </Link>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Upcoming deadlines */}
      <div>
        <h2 className="text-sm font-semibold text-slate-700 uppercase tracking-wider mb-3 flex items-center gap-2">
          <Clock className="h-4 w-4" />
          กำหนดส่งใกล้ ({upcoming.length})
        </h2>
        {upcoming.length === 0 ? (
          <div className="rounded-xl border border-slate-200 bg-white p-8 text-center">
            <CheckCircle2 className="h-8 w-8 text-emerald-400 mx-auto mb-2" />
            <p className="text-sm text-slate-500">ไม่มีรายงานที่ใกล้ครบกำหนด</p>
          </div>
        ) : (
          <div className="space-y-2">
            {upcoming.map((r) => {
              const std = r.template.standard as ComplianceStandard;
              const d = getDeadlineUrgency(r.dueDate);
              return (
                <Link
                  key={r.id}
                  href={`/compliance/reports/${r.id}`}
                  className="block rounded-lg border border-slate-200 bg-white p-3 hover:border-slate-300 hover:shadow-sm transition-all"
                >
                  <div className="flex items-center gap-3 flex-wrap">
                    <span className={`text-[10px] px-1.5 py-0.5 rounded border font-semibold ${URGENCY_COLORS[d.urgency]}`}>
                      ⏰ {d.label}
                    </span>
                    <span className={`text-[10px] px-1.5 py-0.5 rounded border font-semibold ${STANDARD_COLORS[std]}`}>
                      {STANDARD_LABELS[std]}
                    </span>
                    <span className="text-sm text-slate-800 flex-1 truncate">{r.template.name}</span>
                    <span className="text-[11px] text-slate-500 tabular-nums">
                      {new Date(r.dueDate!).toLocaleDateString("th-TH", { day: "numeric", month: "short", year: "2-digit" })}
                    </span>
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

const STAT_COLORS = {
  slate: "bg-slate-50 text-slate-700 border-slate-200",
  blue: "bg-blue-50 text-blue-700 border-blue-200",
  amber: "bg-amber-50 text-amber-700 border-amber-200",
  emerald: "bg-emerald-50 text-emerald-700 border-emerald-200",
} as const;

function StatCard({ label, value, accent }: { label: string; value: number; accent: keyof typeof STAT_COLORS }) {
  return (
    <div className={`rounded-sm border ${STAT_COLORS[accent]} p-3`}>
      <div className="text-[11px] font-semibold uppercase tracking-wider opacity-80">{label}</div>
      <div className="text-2xl font-semibold tabular-nums mt-1">{value}</div>
    </div>
  );
}
