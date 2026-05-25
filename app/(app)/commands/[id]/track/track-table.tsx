"use client";

// Per-unit tracking table with filter + drill-down

import { useState, useMemo } from "react";
import {
  ChevronRight,
  ChevronDown,
  Search,
  CheckCircle2,
  Circle,
  PlayCircle,
  FileCheck,
  Lock,
  Clock,
  Building2,
} from "lucide-react";
import type {
  KpiAssignment,
  KpiDefinition,
  UnitProgress,
  UnitStatus,
} from "@/lib/commands/types";
import { UNIT_STATUS_LABELS } from "@/lib/commands/types";
import type { OrgUnit } from "@/lib/police-org/types";

interface UnitRow extends UnitProgress {
  unit: OrgUnit | null;
}

interface Props {
  rows: UnitRow[];
  kpis: KpiDefinition[];
  assignments: KpiAssignment[];
  dueDate: string;
  effectiveDate: string;
}

const STATUS_ICONS: Record<UnitStatus, React.ComponentType<{ className?: string }>> = {
  PENDING: Circle,
  ACKNOWLEDGED: CheckCircle2,
  IN_PROGRESS: PlayCircle,
  REPORTED: FileCheck,
  CLOSED: Lock,
};

const STATUS_STYLES: Record<UnitStatus, string> = {
  PENDING: "text-slate-500 bg-slate-100 dark:bg-slate-800",
  ACKNOWLEDGED: "text-blue-700 dark:text-blue-300 bg-blue-50 dark:bg-blue-900/30",
  IN_PROGRESS: "text-amber-800 dark:text-amber-300 bg-amber-50 dark:bg-amber-900/30",
  REPORTED: "text-emerald-800 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-900/30",
  CLOSED: "text-slate-600 dark:text-slate-400 bg-slate-100 dark:bg-slate-800",
};

type FilterStatus = "all" | UnitStatus | "late";

export function TrackTable({ rows, kpis, assignments, dueDate, effectiveDate }: Props) {
  const [filter, setFilter] = useState<FilterStatus>("all");
  const [search, setSearch] = useState("");
  const [expanded, setExpanded] = useState<Set<string>>(new Set());

  // Proportional late: progress% < elapsedTime% - 10% grace
  const elapsedRatio = useMemo(() => {
    const start = new Date(effectiveDate).getTime();
    const end = new Date(dueDate).getTime();
    if (end <= start) return 1;
    return Math.min(1, Math.max(0, (Date.now() - start) / (end - start)));
  }, [effectiveDate, dueDate]);

  function unitProgressRatio(unitId: string): number {
    const quantKpis = kpis.filter((k) => k.type === "QUANTITATIVE");
    if (quantKpis.length === 0) return 1;
    let totalTarget = 0, totalCurrent = 0;
    for (const k of quantKpis) {
      const a = assignments.find((x) => x.kpiId === k.id && x.unitId === unitId);
      if (!a?.targetShare) continue;
      totalTarget += a.targetShare;
      totalCurrent += a.currentValue ?? 0;
    }
    return totalTarget === 0 ? 1 : Math.min(1, totalCurrent / totalTarget);
  }

  function isUnitLate(row: UnitRow): boolean {
    if (row.status === "REPORTED" || row.status === "CLOSED") return false;
    return unitProgressRatio(row.unitId) < elapsedRatio - 0.1;
  }

  const filtered = useMemo(() => {
    return rows.filter((r) => {
      const matchSearch =
        !search ||
        r.unit?.name?.toLowerCase().includes(search.toLowerCase()) ||
        r.unit?.code?.toLowerCase().includes(search.toLowerCase()) ||
        r.unit?.province?.includes(search);

      if (!matchSearch) return false;
      if (filter === "all") return true;
      if (filter === "late") return isUnitLate(r);
      return r.status === filter;
    });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [rows, filter, search, elapsedRatio, assignments, kpis]);

  function toggleExpand(unitId: string) {
    setExpanded((p) => {
      const n = new Set(p);
      if (n.has(unitId)) n.delete(unitId);
      else n.add(unitId);
      return n;
    });
  }

  const counts = {
    all: rows.length,
    PENDING: rows.filter((r) => r.status === "PENDING").length,
    ACKNOWLEDGED: rows.filter((r) => r.status === "ACKNOWLEDGED").length,
    IN_PROGRESS: rows.filter((r) => r.status === "IN_PROGRESS").length,
    REPORTED: rows.filter((r) => r.status === "REPORTED").length,
    late: rows.filter((r) => isUnitLate(r)).length,
  };

  return (
    <section className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-sm">
      <div className="border-b border-slate-100 dark:border-slate-800 px-4 py-3">
        <div className="flex items-center gap-2 mb-3">
          <Building2 className="h-4 w-4 text-slate-500" />
          <div className="text-sm font-semibold text-slate-700 dark:text-slate-200">
            ความคืบหน้ารายหน่วย
          </div>
          <div className="text-xs text-slate-500 dark:text-slate-400">
            (คลิกหน่วยเพื่อดูประวัติทั้งหมด + รายงาน)
          </div>
        </div>

        {/* Filters */}
        <div className="flex flex-wrap items-center gap-1.5">
          <FilterChip
            label="ทั้งหมด"
            count={counts.all}
            active={filter === "all"}
            onClick={() => setFilter("all")}
          />
          <FilterChip
            label="รอรับทราบ"
            count={counts.PENDING}
            active={filter === "PENDING"}
            onClick={() => setFilter("PENDING")}
            accent="slate"
          />
          <FilterChip
            label="รับทราบแล้ว"
            count={counts.ACKNOWLEDGED}
            active={filter === "ACKNOWLEDGED"}
            onClick={() => setFilter("ACKNOWLEDGED")}
            accent="blue"
          />
          <FilterChip
            label="กำลังปฏิบัติ"
            count={counts.IN_PROGRESS}
            active={filter === "IN_PROGRESS"}
            onClick={() => setFilter("IN_PROGRESS")}
            accent="amber"
          />
          <FilterChip
            label="ส่งผลแล้ว"
            count={counts.REPORTED}
            active={filter === "REPORTED"}
            onClick={() => setFilter("REPORTED")}
            accent="emerald"
          />
          {counts.late > 0 && (
            <FilterChip
              label="ล่าช้า"
              count={counts.late}
              active={filter === "late"}
              onClick={() => setFilter("late")}
              accent="red"
            />
          )}

          <div className="relative ml-auto">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="ค้นหาหน่วย..."
              className="rounded-sm border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 pl-8 pr-2 py-1 text-xs focus:border-[#1e3a5f] focus:outline-none w-48"
            />
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="divide-y divide-slate-100 dark:divide-slate-800">
        {filtered.length === 0 ? (
          <div className="text-center py-8 text-sm text-slate-400">
            ไม่พบหน่วยที่ตรงเงื่อนไข
          </div>
        ) : (
          filtered.map((r) => {
            const Icon = STATUS_ICONS[r.status];
            const isExpanded = expanded.has(r.unitId);
            const isLate = isUnitLate(r);
            const progRatio = unitProgressRatio(r.unitId);

            // Compute KPI percent for this unit
            const unitKpiProgress = kpis.map((k) => {
              const a = assignments.find(
                (x) => x.kpiId === k.id && x.unitId === r.unitId
              );
              const target = a?.targetShare;
              const current = a?.currentValue ?? 0;
              const percent =
                target && k.type === "QUANTITATIVE"
                  ? Math.min(100, Math.round((current / target) * 100))
                  : current > 0
                  ? 100
                  : 0;
              return { kpi: k, current, target, percent };
            });

            const avgPercent =
              unitKpiProgress.length === 0
                ? 0
                : Math.round(
                    unitKpiProgress.reduce((s, x) => s + x.percent, 0) /
                      unitKpiProgress.length
                  );

            return (
              <div key={r.unitId}>
                <button
                  type="button"
                  suppressHydrationWarning
                  onClick={() => toggleExpand(r.unitId)}
                  className="w-full text-left px-4 py-2.5 flex items-center gap-3 hover:bg-slate-50 dark:hover:bg-slate-800/50"
                >
                  <div className="shrink-0">
                    {isExpanded ? (
                      <ChevronDown className="h-3.5 w-3.5 text-slate-400" />
                    ) : (
                      <ChevronRight className="h-3.5 w-3.5 text-slate-400" />
                    )}
                  </div>

                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium text-slate-900 dark:text-slate-100">
                        {r.unit?.shortName ?? r.unit?.code ?? r.unitId}
                      </span>
                      {r.unit?.code && r.unit.code !== r.unit.shortName && (
                        <span className="text-[10px] text-slate-400">
                          {r.unit.code}
                        </span>
                      )}
                    </div>
                    <div className="text-[11px] text-slate-500 dark:text-slate-400">
                      {r.unit?.province ?? r.unit?.region ?? ""}
                      {r.acknowledgedAt && (
                        <>
                          {" "}
                          · รับทราบ{" "}
                          {new Date(r.acknowledgedAt).toLocaleString("th-TH", {
                            month: "short",
                            day: "numeric",
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </>
                      )}
                    </div>
                  </div>

                  {/* KPI mini bar */}
                  <div className="hidden md:block w-32 shrink-0">
                    <div className="flex items-center gap-1.5">
                      <div className="h-1.5 flex-1 rounded-sm bg-slate-100 dark:bg-slate-800 overflow-hidden">
                        <div
                          className={`h-full transition-all ${
                            avgPercent >= 75
                              ? "bg-emerald-600"
                              : avgPercent >= 40
                              ? "bg-amber-500"
                              : "bg-slate-400"
                          }`}
                          style={{ width: `${avgPercent}%` }}
                        />
                      </div>
                      <span className="text-[10px] tabular-nums text-slate-500 w-7 text-right">
                        {avgPercent}%
                      </span>
                    </div>
                  </div>

                  {isLate && (
                    <span className="inline-flex items-center gap-1 text-[10px] font-semibold px-1.5 py-0.5 rounded-sm bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300 shrink-0" title={`ความคืบหน้า ${Math.round(progRatio * 100)}% เทียบกับเวลาที่ผ่านไป ${Math.round(elapsedRatio * 100)}%`}>
                      <Clock className="h-2.5 w-2.5" />
                      ล่าช้า {Math.round(progRatio * 100)}%/{Math.round(elapsedRatio * 100)}%
                    </span>
                  )}
                  <span
                    className={`inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-1 rounded-sm shrink-0 ${STATUS_STYLES[r.status]}`}
                  >
                    <Icon className="h-3 w-3" />
                    {UNIT_STATUS_LABELS[r.status]}
                  </span>
                </button>

                {/* Drill-down */}
                {isExpanded && (
                  <div className="px-12 py-3 bg-slate-50 dark:bg-slate-800/40 space-y-3 border-l-4 border-[#b8860b]">
                    {/* KPI breakdown */}
                    <div>
                      <div className="text-[10px] font-semibold uppercase tracking-wider text-slate-500 mb-2">
                        ตัวชี้วัด
                      </div>
                      <div className="space-y-1.5">
                        {unitKpiProgress.map((u) => (
                          <div key={u.kpi.id} className="text-xs">
                            <div className="flex items-center justify-between gap-2">
                              <span className="text-slate-700 dark:text-slate-300">
                                {u.kpi.metric}
                              </span>
                              <span className="font-semibold tabular-nums">
                                {u.kpi.type === "QUANTITATIVE" ? (
                                  <>
                                    <span className="text-emerald-700 dark:text-emerald-400">
                                      {u.current.toLocaleString()}
                                    </span>
                                    {u.target && (
                                      <span className="text-slate-400">
                                        {" / "}
                                        {u.target.toLocaleString()}
                                      </span>
                                    )}{" "}
                                    <span className="text-slate-500">{u.kpi.unit ?? ""}</span>
                                  </>
                                ) : u.current > 0 ? (
                                  <span className="text-emerald-700 dark:text-emerald-400">
                                    ส่งแล้ว
                                  </span>
                                ) : (
                                  <span className="text-slate-400">ยังไม่ส่ง</span>
                                )}
                              </span>
                            </div>
                            {u.kpi.type === "QUANTITATIVE" && (
                              <div className="h-1 rounded-sm bg-slate-100 dark:bg-slate-700 overflow-hidden mt-0.5">
                                <div
                                  className={`h-full ${
                                    u.percent >= 75
                                      ? "bg-emerald-600"
                                      : u.percent >= 40
                                      ? "bg-amber-500"
                                      : "bg-slate-400"
                                  }`}
                                  style={{ width: `${u.percent}%` }}
                                />
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Reports list */}
                    {r.reports.length > 0 && (
                      <div>
                        <div className="text-[10px] font-semibold uppercase tracking-wider text-slate-500 mb-2">
                          รายงาน ({r.reports.length})
                        </div>
                        <div className="space-y-1.5">
                          {r.reports.map((rep) => (
                            <div
                              key={rep.id}
                              className="rounded-sm border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 p-2 text-xs"
                            >
                              <div className="flex items-center justify-between gap-2 mb-1">
                                <span className="font-medium text-slate-900 dark:text-slate-100">
                                  {rep.reportedByName}
                                </span>
                                <span className="text-[10px] text-slate-500">
                                  {new Date(rep.reportedAt).toLocaleString("th-TH")}
                                </span>
                              </div>
                              <div className="text-slate-600 dark:text-slate-400">
                                ค่าที่ส่ง:{" "}
                                {rep.kpiValues.map((v) => {
                                  const k = kpis.find((kk) => kk.id === v.kpiId);
                                  return (
                                    <span key={v.kpiId} className="mr-2">
                                      {k?.metric ?? v.kpiId}:{" "}
                                      <strong>{v.value.toLocaleString()}</strong>{" "}
                                      <span className="text-slate-400">{k?.unit ?? ""}</span>
                                    </span>
                                  );
                                })}
                              </div>
                              {rep.notes && (
                                <div className="text-slate-500 italic mt-1">"{rep.notes}"</div>
                              )}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Timeline */}
                    <div>
                      <div className="text-[10px] font-semibold uppercase tracking-wider text-slate-500 mb-2">
                        ไทม์ไลน์
                      </div>
                      <div className="space-y-1 text-xs">
                        {r.acknowledgedAt && (
                          <div>
                            <span className="text-blue-700 dark:text-blue-400">✓ รับทราบ</span>{" "}
                            <span className="text-slate-500">
                              {new Date(r.acknowledgedAt).toLocaleString("th-TH")} ·{" "}
                              {r.acknowledgedByName}
                            </span>
                          </div>
                        )}
                        {r.startedAt && (
                          <div>
                            <span className="text-amber-700 dark:text-amber-400">▶ เริ่มปฏิบัติ</span>{" "}
                            <span className="text-slate-500">
                              {new Date(r.startedAt).toLocaleString("th-TH")} · {r.startedByName}
                            </span>
                          </div>
                        )}
                        {r.reports.length > 0 && (
                          <div>
                            <span className="text-emerald-700 dark:text-emerald-400">
                              📋 ส่งผลแล้ว {r.reports.length} ครั้ง
                            </span>{" "}
                            <span className="text-slate-500">
                              ล่าสุด{" "}
                              {new Date(
                                r.reports[r.reports.length - 1].reportedAt
                              ).toLocaleString("th-TH")}
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>
    </section>
  );
}

interface FilterChipProps {
  label: string;
  count: number;
  active: boolean;
  onClick: () => void;
  accent?: "slate" | "blue" | "amber" | "emerald" | "red";
}

function FilterChip({ label, count, active, onClick, accent = "slate" }: FilterChipProps) {
  const activeColors = {
    slate: "bg-slate-700 text-white",
    blue: "bg-blue-600 text-white",
    amber: "bg-amber-600 text-white",
    emerald: "bg-emerald-600 text-white",
    red: "bg-red-600 text-white",
  }[accent];

  return (
    <button
      type="button"
      suppressHydrationWarning
      onClick={onClick}
      className={`text-xs px-2.5 py-1 rounded-sm border transition-colors ${
        active
          ? `${activeColors} border-transparent`
          : "border-slate-300 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300"
      }`}
    >
      {label}
      {count > 0 && (
        <span className={`ml-1.5 text-[10px] ${active ? "opacity-90" : "text-slate-500"}`}>
          {count}
        </span>
      )}
    </button>
  );
}
