// Compact unit progress table — shows per-unit status grid

import Link from "next/link";
import {
  Circle,
  CheckCircle2,
  PlayCircle,
  FileCheck,
  Lock,
  Clock,
} from "lucide-react";
import type { Command, UnitStatus } from "@/lib/commands/types";
import { UNIT_STATUS_LABELS } from "@/lib/commands/types";
import { getUnit } from "@/lib/police-org/store";

interface Props {
  command: Command;
  /** Show only first N units (rest in "ดูทั้งหมด") */
  preview?: number;
  /** Link to drill-down tracking page (if true, show "ดูการติดตามแบบเต็ม") */
  showTrackLink?: boolean;
}

const STATUS_ICONS: Record<UnitStatus, React.ComponentType<{ className?: string }>> = {
  PENDING: Circle,
  ACKNOWLEDGED: CheckCircle2,
  IN_PROGRESS: PlayCircle,
  REPORTED: FileCheck,
  CLOSED: Lock,
};

const STATUS_STYLES: Record<UnitStatus, string> = {
  PENDING: "text-slate-400 bg-slate-100 dark:bg-slate-800",
  ACKNOWLEDGED: "text-blue-700 dark:text-blue-300 bg-blue-50 dark:bg-blue-900/30",
  IN_PROGRESS:
    "text-amber-800 dark:text-amber-300 bg-amber-50 dark:bg-amber-900/30",
  REPORTED:
    "text-emerald-800 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-900/30",
  CLOSED: "text-slate-600 dark:text-slate-400 bg-slate-100 dark:bg-slate-800",
};

export function UnitProgressTable({ command, preview, showTrackLink }: Props) {
  const now = Date.now();
  const due = new Date(command.dueDate).getTime();
  const overdue = now > due;

  const rows = (command.unitProgress ?? []).map((up) => {
    const unit = getUnit(up.unitId);
    const isLate =
      overdue && up.status !== "REPORTED" && up.status !== "CLOSED";
    return { up, unit, isLate };
  });

  const display = preview ? rows.slice(0, preview) : rows;
  const remaining = preview ? Math.max(0, rows.length - preview) : 0;

  return (
    <div className="rounded-sm border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900">
      <div className="border-b border-slate-100 dark:border-slate-800 px-4 py-2.5 flex items-center justify-between">
        <div className="text-sm font-semibold text-slate-700 dark:text-slate-200">
          ความคืบหน้ารายหน่วย ({rows.length})
        </div>
        {showTrackLink && (
          <Link
            href={`/commands/${command.id}/track`}
            className="text-xs text-[#1e3a5f] dark:text-blue-400 hover:underline"
          >
            ดูแดชบอร์ดติดตามแบบเต็ม →
          </Link>
        )}
      </div>
      <div className="divide-y divide-slate-100 dark:divide-slate-800">
        {display.map(({ up, unit, isLate }) => {
          const Icon = STATUS_ICONS[up.status];
          return (
            <div
              key={up.unitId}
              className="px-4 py-2.5 flex items-center justify-between gap-3 hover:bg-slate-50 dark:hover:bg-slate-800/50"
            >
              <div className="min-w-0 flex-1">
                <div className="text-sm font-medium text-slate-900 dark:text-slate-100">
                  {unit?.shortName ?? unit?.code ?? up.unitId}
                </div>
                <div className="text-[11px] text-slate-500 dark:text-slate-400">
                  {unit?.province
                    ? `${unit.province}`
                    : unit?.region ?? ""}
                </div>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                {isLate && (
                  <span className="inline-flex items-center gap-1 text-[10px] font-semibold px-1.5 py-0.5 rounded-sm bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300">
                    <Clock className="h-2.5 w-2.5" />
                    ล่าช้า
                  </span>
                )}
                <span
                  className={`inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-1 rounded-sm ${STATUS_STYLES[up.status]}`}
                >
                  <Icon className="h-3 w-3" />
                  {UNIT_STATUS_LABELS[up.status]}
                </span>
                {up.reports.length > 0 && (
                  <span className="text-[11px] text-slate-500">
                    📋 {up.reports.length}
                  </span>
                )}
              </div>
            </div>
          );
        })}
        {remaining > 0 && (
          <div className="px-4 py-2 text-xs text-slate-500 text-center bg-slate-50 dark:bg-slate-800/30">
            และอีก {remaining} หน่วย — กด "ดูแดชบอร์ดติดตามแบบเต็ม" เพื่อดูทั้งหมด
          </div>
        )}
      </div>
    </div>
  );
}
