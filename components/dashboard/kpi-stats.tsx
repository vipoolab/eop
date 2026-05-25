"use client";

import { useMemo } from "react";
import {
  FileEdit,
  CheckCircle2,
  AlertTriangle,
  Activity,
  Sparkles,
} from "lucide-react";
import type { DataPoint } from "@/lib/dashboard/mock-data";

interface Props {
  data: DataPoint[];
}

export function KpiStats({ data }: Props) {
  const totals = useMemo(() => {
    let issued = 0,
      completed = 0,
      late = 0,
      incidents = 0,
      arrests = 0;
    for (const d of data) {
      issued += d.commandsIssued;
      completed += d.commandsCompleted;
      late += d.commandsLate;
      incidents += d.incidents;
      arrests += d.arrests;
    }
    return {
      issued,
      completed,
      late,
      incidents,
      arrests,
      completionRate: issued > 0 ? (completed / issued) * 100 : 0,
      lateRate: issued > 0 ? (late / issued) * 100 : 0,
    };
  }, [data]);

  return (
    <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
      <BigStat label="คำสั่งทั้งหมด" value={totals.issued.toLocaleString()} icon={FileEdit} color="navy" />
      <BigStat
        label="ปฏิบัติเสร็จสิ้น"
        value={`${totals.completionRate.toFixed(1)}%`}
        sublabel={`${totals.completed.toLocaleString()} / ${totals.issued.toLocaleString()}`}
        icon={CheckCircle2}
        color="emerald"
      />
      <BigStat
        label="ล่าช้า"
        value={`${totals.lateRate.toFixed(1)}%`}
        sublabel={`${totals.late.toLocaleString()} คำสั่ง`}
        icon={AlertTriangle}
        color={totals.lateRate > 15 ? "red" : "amber"}
      />
      <BigStat label="เหตุการณ์" value={totals.incidents.toLocaleString()} icon={Activity} color="blue" />
      <BigStat label="ผู้ถูกจับกุม" value={totals.arrests.toLocaleString()} icon={Sparkles} color="purple" />
    </div>
  );
}

interface BigStatProps {
  label: string;
  value: string;
  sublabel?: string;
  icon: React.ComponentType<{ className?: string }>;
  color: "navy" | "blue" | "emerald" | "amber" | "red" | "purple";
}

function BigStat({ label, value, sublabel, icon: Icon, color }: BigStatProps) {
  const colorMap = {
    navy: "bg-[#1e3a5f] text-white",
    blue: "bg-blue-600 text-white",
    emerald: "bg-emerald-600 text-white",
    amber: "bg-amber-600 text-white",
    red: "bg-red-600 text-white",
    purple: "bg-purple-600 text-white",
  };
  return (
    <div className="rounded-sm border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 p-3.5">
      <div className="flex items-center gap-2 mb-1.5">
        <div className={`h-8 w-8 rounded-sm flex items-center justify-center shrink-0 ${colorMap[color]}`}>
          <Icon className="h-4 w-4" />
        </div>
        <div className="text-[10px] font-semibold uppercase tracking-wider text-slate-500 leading-tight">
          {label}
        </div>
      </div>
      <div className="text-2xl font-bold text-slate-900 dark:text-slate-100 leading-none tabular-nums">
        {value}
      </div>
      {sublabel && <div className="text-[10px] text-slate-500 mt-1">{sublabel}</div>}
    </div>
  );
}
