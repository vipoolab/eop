// /commands/[id]/track — owner tracking dashboard

import Link from "next/link";
import { notFound } from "next/navigation";
import {
  ArrowLeft,
  TrendingUp,
  Target,
  Building2,
  Clock,
  CheckCircle2,
  PlayCircle,
  FileCheck,
  AlertTriangle,
} from "lucide-react";
import { PageHeader } from "@/components/page-header";
import { getCommand } from "@/lib/commands/store";
import { computeTrackingStats, computeKpiRollups } from "@/lib/commands/workflow";
import { getUnit } from "@/lib/police-org/store";
import { TrackTable } from "./track-table";

export const dynamic = "force-dynamic";

export default async function TrackPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const cmd = getCommand(id);
  if (!cmd) notFound();

  const stats = computeTrackingStats(cmd);
  const kpiRollups = computeKpiRollups(cmd);

  // Enrich unit progress with org data
  const rows = (cmd.unitProgress ?? []).map((up) => {
    const unit = getUnit(up.unitId);
    return { ...up, unit };
  });

  const now = Date.now();
  const due = new Date(cmd.dueDate).getTime();
  const daysLeft = Math.ceil((due - now) / (24 * 60 * 60 * 1000));
  const overdue = daysLeft < 0;

  return (
    <div className="space-y-5">
      <Link
        href={`/commands/${cmd.id}`}
        className="inline-flex items-center gap-1 text-sm text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100"
      >
        <ArrowLeft className="h-4 w-4" />
        กลับ รายละเอียดคำสั่ง
      </Link>

      <PageHeader
        icon={TrendingUp}
        eyebrow="ติดตามคำสั่ง"
        title={`การติดตามผล: ${cmd.letter.subject}`}
        description={`เลขที่ ${cmd.letter.docNumber ?? "—"} · ${cmd.effectiveUnitIds.length} หน่วยรับผล`}
      />

      {/* Time + status banner */}
      <div
        className={`rounded-sm border-2 p-4 ${
          overdue
            ? "border-red-300 bg-red-50 dark:bg-red-900/20"
            : daysLeft <= 3
            ? "border-amber-300 bg-amber-50 dark:bg-amber-900/20"
            : "border-emerald-300 bg-emerald-50 dark:bg-emerald-900/20"
        }`}
      >
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-2 text-sm">
            <Clock className="h-4 w-4" />
            {overdue ? (
              <span className="font-semibold text-red-900 dark:text-red-200">
                ⚠ เลยกำหนดมา {Math.abs(daysLeft)} วัน
              </span>
            ) : (
              <span className="font-semibold text-slate-900 dark:text-slate-100">
                เหลืออีก {daysLeft} วันก่อนครบกำหนด
              </span>
            )}
          </div>
          <div className="text-xs text-slate-700 dark:text-slate-300">
            {new Date(cmd.effectiveDate).toLocaleDateString("th-TH")} →{" "}
            {new Date(cmd.dueDate).toLocaleDateString("th-TH")}
          </div>
        </div>
      </div>

      {/* Big numbers */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        <BigStat
          icon={Building2}
          label="หน่วยรับผล"
          value={stats.total}
          accent="slate"
        />
        <BigStat
          icon={CheckCircle2}
          label="รับทราบ"
          value={`${stats.total - stats.pending}/${stats.total}`}
          percent={stats.ackPercent}
          accent="blue"
        />
        <BigStat
          icon={PlayCircle}
          label="กำลังปฏิบัติ"
          value={stats.inProgress}
          accent="amber"
        />
        <BigStat
          icon={FileCheck}
          label="ส่งผลแล้ว"
          value={`${stats.reported}/${stats.total}`}
          percent={stats.reportPercent}
          accent="emerald"
        />
        <BigStat
          icon={AlertTriangle}
          label="ล่าช้า"
          value={stats.late}
          accent={stats.late > 0 ? "red" : "slate"}
        />
      </div>

      {/* KPI rollup section */}
      <section className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-sm">
        <div className="border-b border-slate-100 dark:border-slate-800 px-4 py-3 flex items-center gap-2">
          <Target className="h-4 w-4 text-[#b8860b]" />
          <div className="text-sm font-semibold text-slate-700 dark:text-slate-200">
            ตัวชี้วัด (KPI) รวมทุกหน่วย
          </div>
        </div>
        <div className="divide-y divide-slate-100 dark:divide-slate-800">
          {kpiRollups.map((k) => (
            <div key={k.kpiId} className="px-4 py-3">
              <div className="flex items-center justify-between gap-2 mb-1.5">
                <div className="flex items-center gap-2 min-w-0">
                  <span
                    className={`text-[10px] font-semibold uppercase px-1.5 py-0.5 rounded-sm shrink-0 ${
                      k.type === "QUANTITATIVE"
                        ? "bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-300"
                        : "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-300"
                    }`}
                  >
                    {k.type === "QUANTITATIVE" ? "ปริมาณ" : "คุณภาพ"}
                  </span>
                  <span className="text-sm font-semibold text-slate-900 dark:text-slate-100 truncate">
                    {k.metric}
                  </span>
                </div>
                {k.type === "QUANTITATIVE" ? (
                  <span className="text-sm font-bold tabular-nums shrink-0">
                    <span className="text-emerald-700 dark:text-emerald-400">
                      {(k.achievedTotal ?? 0).toLocaleString()}
                    </span>
                    {k.targetTotal && (
                      <>
                        <span className="text-slate-400"> / </span>
                        <span className="text-slate-700 dark:text-slate-300">
                          {k.targetTotal.toLocaleString()}
                        </span>
                      </>
                    )}{" "}
                    <span className="text-xs text-slate-500">{k.unit ?? ""}</span>
                  </span>
                ) : (
                  <span className="text-sm font-bold tabular-nums shrink-0 text-emerald-700 dark:text-emerald-400">
                    {k.reportingUnits} / {k.totalUnits} หน่วย
                  </span>
                )}
              </div>
              {k.type === "QUANTITATIVE" && k.percent !== undefined && (
                <div className="h-2 rounded-sm bg-slate-100 dark:bg-slate-800 overflow-hidden">
                  <div
                    className={`h-full transition-all ${
                      k.percent >= 75
                        ? "bg-emerald-600"
                        : k.percent >= 40
                        ? "bg-amber-500"
                        : "bg-slate-400"
                    }`}
                    style={{ width: `${k.percent}%` }}
                  />
                </div>
              )}
              <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">
                {k.reportingUnits} จาก {k.totalUnits} หน่วยส่งผลแล้ว
                {k.percent !== undefined && (
                  <>
                    {" · "}
                    คืบหน้า <strong>{k.percent}%</strong>
                  </>
                )}
              </div>
            </div>
          ))}
          {kpiRollups.length === 0 && (
            <div className="px-4 py-8 text-sm text-slate-400 text-center">
              ไม่มี KPI
            </div>
          )}
        </div>
      </section>

      {/* Per-unit drill-down table */}
      <TrackTable rows={rows} kpis={cmd.kpis} assignments={cmd.assignments} dueDate={cmd.dueDate} effectiveDate={cmd.effectiveDate} />
    </div>
  );
}

interface BigStatProps {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: string | number;
  percent?: number;
  accent: "slate" | "blue" | "amber" | "emerald" | "red";
}

function BigStat({ icon: Icon, label, value, percent, accent }: BigStatProps) {
  const colors = {
    slate: { bg: "bg-slate-600 dark:bg-slate-700", text: "text-slate-900 dark:text-slate-100" },
    blue: { bg: "bg-blue-600", text: "text-blue-900 dark:text-blue-100" },
    amber: { bg: "bg-amber-600", text: "text-amber-900 dark:text-amber-100" },
    emerald: { bg: "bg-emerald-600", text: "text-emerald-900 dark:text-emerald-100" },
    red: { bg: "bg-red-600", text: "text-red-900 dark:text-red-100" },
  }[accent];
  return (
    <div className="rounded-sm border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-3">
      <div className="flex items-center gap-2 mb-1.5">
        <div className={`h-7 w-7 rounded-sm ${colors.bg} flex items-center justify-center`}>
          <Icon className="h-3.5 w-3.5 text-white" />
        </div>
        <div className="text-[10px] font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
          {label}
        </div>
      </div>
      <div className={`text-2xl font-bold leading-none ${colors.text}`}>
        {value}
      </div>
      {percent !== undefined && (
        <div className="mt-1.5">
          <div className="h-1 rounded-sm bg-slate-100 dark:bg-slate-800 overflow-hidden">
            <div
              className={`h-full ${colors.bg}`}
              style={{ width: `${percent}%` }}
            />
          </div>
          <div className="text-[10px] text-slate-500 mt-0.5 text-right">{percent}%</div>
        </div>
      )}
    </div>
  );
}
