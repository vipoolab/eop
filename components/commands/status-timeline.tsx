// Status timeline — shows the 7-step lifecycle horizontally

import { CheckCircle2, Circle } from "lucide-react";
import type { CommandStatus } from "@/lib/commands/types";
import { STATUS_FLOW, STATUS_LABELS } from "@/lib/commands/types";

interface Props {
  currentStatus: CommandStatus;
  /** Show "REJECTED" badge if status is REJECTED */
}

export function StatusTimeline({ currentStatus }: Props) {
  if (currentStatus === "REJECTED") {
    return (
      <div className="rounded-sm border border-red-300 bg-red-50 dark:bg-red-900/20 px-4 py-3 text-sm font-semibold text-red-900 dark:text-red-200">
        ❌ คำสั่งถูกตีกลับ — กลับเป็นร่าง รอแก้ไขแล้วเสนอใหม่
      </div>
    );
  }

  const currentIdx = STATUS_FLOW.indexOf(currentStatus);

  return (
    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-sm p-3">
      <div className="flex items-center gap-1 overflow-x-auto">
        {STATUS_FLOW.map((s, idx) => {
          const done = idx < currentIdx;
          const active = idx === currentIdx;
          return (
            <div key={s} className="flex items-center shrink-0">
              <div
                className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-sm ${
                  active
                    ? "bg-[#1e3a5f] text-white"
                    : done
                    ? "text-emerald-700 dark:text-emerald-400"
                    : "text-slate-400 dark:text-slate-600"
                }`}
              >
                {done ? (
                  <CheckCircle2 className="h-3.5 w-3.5" />
                ) : active ? (
                  <div className="relative flex h-3.5 w-3.5">
                    <span className="absolute inline-flex h-full w-full rounded-full bg-[#d4a017] opacity-75 animate-ping" />
                    <span className="relative inline-flex h-3.5 w-3.5 rounded-full bg-[#d4a017]" />
                  </div>
                ) : (
                  <Circle className="h-3.5 w-3.5" />
                )}
                <span className="text-xs font-semibold whitespace-nowrap">
                  {STATUS_LABELS[s]}
                </span>
              </div>
              {idx < STATUS_FLOW.length - 1 && (
                <div className={`h-px w-3 mx-1 ${done ? "bg-emerald-500" : "bg-slate-200 dark:bg-slate-700"}`} />
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
