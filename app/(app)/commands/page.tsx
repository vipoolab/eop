// /commands — list of all commands

import Link from "next/link";
import {
  FileEdit,
  Plus,
  Sparkles,
  FileText,
  Clock,
  CheckCircle2,
  Siren,
} from "lucide-react";
import { PageHeader } from "@/components/page-header";
import { listCommands, getCommandStats } from "@/lib/commands/store";
import { getUnit } from "@/lib/police-org/store";
import type { Command, CommandStatus } from "@/lib/commands/types";
import { STATUS_LABELS } from "@/lib/commands/types";
import { computeUnitLateStatuses, computeElapsedRatio } from "@/lib/commands/workflow";

export const dynamic = "force-dynamic";

const STATUS_STYLES: Record<CommandStatus, string> = {
  DRAFT: "bg-slate-100 text-slate-700 border-slate-300 dark:bg-slate-800 dark:text-slate-200 dark:border-slate-700",
  SUBMITTED: "bg-amber-50 text-amber-800 border-amber-300 dark:bg-amber-900/30 dark:text-amber-300 dark:border-amber-700",
  APPROVED: "bg-emerald-50 text-emerald-800 border-emerald-300 dark:bg-emerald-900/30 dark:text-emerald-300 dark:border-emerald-700",
  DISPATCHED: "bg-blue-50 text-blue-800 border-blue-300 dark:bg-blue-900/30 dark:text-blue-300 dark:border-blue-700",
  IN_PROGRESS: "bg-amber-50 text-amber-800 border-amber-300 dark:bg-amber-900/30 dark:text-amber-300 dark:border-amber-700",
  REPORTED: "bg-emerald-50 text-emerald-800 border-emerald-300 dark:bg-emerald-900/30 dark:text-emerald-300 dark:border-emerald-700",
  CLOSED: "bg-slate-50 text-slate-600 border-slate-300 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700",
  REJECTED: "bg-red-50 text-red-800 border-red-300 dark:bg-red-900/30 dark:text-red-300 dark:border-red-700",
};

// Sort: EMERGENCY (active) first, then URGENT (active), then by createdAt desc.
function compareCmds(a: Command, b: Command): number {
  const aEmergency =
    a.priority === "EMERGENCY" && a.status !== "CLOSED" && a.status !== "REJECTED";
  const bEmergency =
    b.priority === "EMERGENCY" && b.status !== "CLOSED" && b.status !== "REJECTED";
  if (aEmergency !== bEmergency) return aEmergency ? -1 : 1;
  const aUrgent =
    a.priority === "URGENT" && a.status !== "CLOSED" && a.status !== "REJECTED";
  const bUrgent =
    b.priority === "URGENT" && b.status !== "CLOSED" && b.status !== "REJECTED";
  if (aUrgent !== bUrgent) return aUrgent ? -1 : 1;
  return b.createdAt.localeCompare(a.createdAt);
}

export default function CommandsListPage() {
  const cmds = [...listCommands()].sort(compareCmds);
  const stats = getCommandStats();
  const emergencyCount = cmds.filter(
    (c) =>
      c.priority === "EMERGENCY" &&
      c.status !== "CLOSED" &&
      c.status !== "REJECTED"
  ).length;

  return (
    <div className="space-y-6">
      <PageHeader
        icon={FileEdit}
        eyebrow="ร่างหนังสือสั่งการ"
        title="ระบบสั่งการ"
        description="ร่างหนังสือสั่งการด้วย AI สอดคล้องกับยุทธศาสตร์ทั้ง 3 ระดับ พร้อมระบุหน่วยรับคำสั่ง วันที่ และตัวชี้วัด"
        live
        actions={
          <div className="flex gap-2">
            {emergencyCount > 0 && (
              <Link
                href="/commands/emergency"
                className="inline-flex items-center gap-1.5 rounded-sm bg-red-600 hover:bg-red-700 text-white text-sm font-bold px-4 py-2 transition-colors shadow animate-pulse"
              >
                <Siren className="h-4 w-4" />
                ดู EOC ({emergencyCount})
              </Link>
            )}
            <Link
              href="/commands/new"
              className="inline-flex items-center gap-1.5 rounded-sm bg-[#1e3a5f] hover:bg-[#142a45] text-white text-sm font-medium px-4 py-2 transition-colors"
            >
              <Plus className="h-4 w-4" />
              ร่างหนังสือใหม่
            </Link>
          </div>
        }
      />

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-7 gap-3">
        <StatCard
          label="เหตุฉุกเฉิน"
          value={emergencyCount}
          icon={Siren}
          color="red"
        />
        <StatCard label="ทั้งหมด" value={stats.total} icon={FileText} color="navy" />
        <StatCard label={STATUS_LABELS.DRAFT} value={stats.byStatus.DRAFT} icon={FileEdit} color="slate" />
        <StatCard
          label={STATUS_LABELS.SUBMITTED}
          value={stats.byStatus.SUBMITTED}
          icon={Sparkles}
          color="amber"
        />
        <StatCard label={STATUS_LABELS.DISPATCHED} value={stats.byStatus.DISPATCHED} icon={Sparkles} color="blue" />
        <StatCard label={STATUS_LABELS.IN_PROGRESS} value={stats.byStatus.IN_PROGRESS} icon={Clock} color="amber" />
        <StatCard label={STATUS_LABELS.CLOSED} value={stats.byStatus.CLOSED} icon={CheckCircle2} color="emerald" />
      </div>

      {/* List */}
      <section className="bg-white border border-slate-200 rounded-sm overflow-hidden">
        <div className="border-b border-slate-100 px-5 py-3">
          <h2 className="font-semibold text-slate-900 text-sm">
            คำสั่งล่าสุด ({cmds.length})
          </h2>
        </div>
        {cmds.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <div className="h-16 w-16 rounded-sm bg-slate-100 flex items-center justify-center mb-3">
              <FileEdit className="h-8 w-8 text-slate-400" />
            </div>
            <div className="text-sm font-semibold text-slate-700">
              ยังไม่มีหนังสือสั่งการในระบบ
            </div>
            <div className="text-xs text-slate-500 mt-1">
              เริ่มร่างหนังสือแรก ด้วยการพิมพ์เจตนาเป็นภาษาไทยทั่วไป — AI จะร่างให้ตามรูปแบบราชการ
            </div>
            <Link
              href="/commands/new"
              className="mt-4 inline-flex items-center gap-1.5 rounded-sm bg-[#1e3a5f] hover:bg-[#142a45] text-white text-sm font-medium px-4 py-2"
            >
              <Plus className="h-4 w-4" />
              ร่างหนังสือใหม่
            </Link>
          </div>
        ) : (
          <ul className="divide-y divide-slate-100">
            {cmds.map((c) => {
              const targetUnits = c.targetUnitIds
                .map((id) => getUnit(id))
                .filter(Boolean);
              const lateUnits = (c.status === "IN_PROGRESS" || c.status === "DISPATCHED")
                ? computeUnitLateStatuses(c).filter((s) => s.isLate).length
                : 0;
              const elapsedPct = Math.round(computeElapsedRatio(c) * 100);
              const isActiveEmergency =
                c.priority === "EMERGENCY" &&
                c.status !== "CLOSED" &&
                c.status !== "REJECTED";
              return (
                <li
                  key={c.id}
                  className={
                    isActiveEmergency
                      ? "border-l-4 border-l-red-600 bg-red-50/40 hover:bg-red-50 dark:bg-red-900/10 dark:hover:bg-red-900/20"
                      : "hover:bg-slate-50 dark:hover:bg-slate-800/40"
                  }
                >
                  <Link
                    href={`/commands/${c.id}`}
                    className="block px-5 py-4"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2 mb-1 flex-wrap">
                          {isActiveEmergency && (
                            <span className="inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded-sm bg-red-600 text-white animate-pulse">
                              <Siren className="h-3 w-3" />
                              EMERGENCY
                            </span>
                          )}
                          {c.priority === "URGENT" &&
                            c.status !== "CLOSED" &&
                            c.status !== "REJECTED" && (
                              <span className="text-[10px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded-sm bg-amber-500 text-white">
                                URGENT
                              </span>
                            )}
                          <span
                            className={`text-[10px] font-semibold uppercase tracking-wider px-1.5 py-0.5 rounded-sm border ${STATUS_STYLES[c.status]}`}
                          >
                            {STATUS_LABELS[c.status]}
                          </span>
                          {c.letter.docNumber && (
                            <span className="text-[11px] font-mono text-slate-500">
                              {c.letter.docNumber}
                            </span>
                          )}
                          {lateUnits > 0 && (
                            <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded-sm bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300">
                              ⚠ {lateUnits} หน่วยล่าช้า
                            </span>
                          )}
                        </div>
                        <div className="text-sm font-semibold text-slate-900 line-clamp-1">
                          {c.letter.subject}
                        </div>
                        <div className="text-xs text-slate-500 mt-1">
                          {c.createdByTitle} {c.createdByName.split(" ").slice(1).join(" ")} · {new Date(c.createdAt).toLocaleString("th-TH")}
                        </div>
                        <div className="flex items-center gap-3 text-[11px] text-slate-500 mt-1.5">
                          <span>
                            {targetUnits.length} หน่วยรับ (
                            {c.cascadeMode === "CASCADE" ? "+กระจาย" : "ตรง"}) ·
                            ส่งผลถึง {c.effectiveUnitIds.length} หน่วย
                          </span>
                          <span>·</span>
                          <span>{c.kpis.length} KPI</span>
                          <span>·</span>
                          <span>
                            แผน {c.alignment.actionPlanItemIds.length}/{c.alignment.masterPlanItemIds.length}/{c.alignment.nationalStrategyItemIds.length} (L3/L2/L1)
                          </span>
                        </div>
                      </div>
                      <div className="text-right shrink-0 text-[11px] text-slate-500 space-y-1">
                        <div>
                          {new Date(c.effectiveDate).toLocaleDateString("th-TH")} → {new Date(c.dueDate).toLocaleDateString("th-TH")}
                        </div>
                        {(c.status === "IN_PROGRESS" || c.status === "DISPATCHED") && (
                          <div className="flex items-center gap-1.5 justify-end">
                            <div className="w-20 h-1.5 rounded-sm bg-slate-100 dark:bg-slate-700 overflow-hidden">
                              <div
                                className={`h-full rounded-sm ${lateUnits > 0 ? "bg-red-500" : "bg-emerald-500"}`}
                                style={{ width: `${elapsedPct}%` }}
                              />
                            </div>
                            <span className={`text-[10px] font-medium ${lateUnits > 0 ? "text-red-600 dark:text-red-400" : "text-slate-500"}`}>
                              {elapsedPct}%
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                  </Link>
                </li>
              );
            })}
          </ul>
        )}
      </section>
    </div>
  );
}

interface StatCardProps {
  label: string;
  value: number;
  icon: React.ComponentType<{ className?: string }>;
  color: "navy" | "slate" | "blue" | "amber" | "emerald" | "red";
}

function StatCard({ label, value, icon: Icon, color }: StatCardProps) {
  const colors = {
    navy: "bg-[#1e3a5f] text-white",
    slate: "bg-slate-500 text-white",
    blue: "bg-blue-600 text-white",
    amber: "bg-amber-600 text-white",
    emerald: "bg-emerald-600 text-white",
    red: "bg-red-600 text-white",
  };
  const ring = color === "red" && value > 0 ? "border-red-400 ring-2 ring-red-300/40" : "border-slate-200";
  return (
    <div className={`rounded-sm border bg-white p-3 flex items-center gap-3 ${ring}`}>
      <div className={`h-9 w-9 rounded-sm flex items-center justify-center ${colors[color]} ${color === "red" && value > 0 ? "animate-pulse" : ""}`}>
        <Icon className="h-4 w-4" />
      </div>
      <div className="min-w-0">
        <div className="text-[10px] font-semibold uppercase tracking-wider text-slate-500">
          {label}
        </div>
        <div className={`text-xl font-bold leading-none mt-0.5 ${color === "red" && value > 0 ? "text-red-700" : "text-slate-900"}`}>
          {value}
        </div>
      </div>
    </div>
  );
}
