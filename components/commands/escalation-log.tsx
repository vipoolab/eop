// Escalation log section — visible when command has at least one escalation entry.

import { AlertTriangle, ArrowUp } from "lucide-react";
import type { Command } from "@/lib/commands/types";
import { ESCALATION_REASON_LABELS } from "@/lib/commands/emergency";

interface Props {
  command: Command;
}

export function EscalationLogSection({ command }: Props) {
  const escs = command.escalations ?? [];
  if (escs.length === 0) return null;

  return (
    <section className="bg-amber-50 dark:bg-amber-900/20 border border-amber-300 dark:border-amber-800/60 rounded-sm p-4">
      <div className="flex items-center gap-2 text-sm font-semibold text-amber-900 dark:text-amber-200 mb-3">
        <AlertTriangle className="h-4 w-4" />
        Escalation ({escs.length})
      </div>
      <ul className="space-y-2">
        {[...escs]
          .sort((a, b) => b.triggeredAt.localeCompare(a.triggeredAt))
          .map((e) => (
            <li
              key={e.id}
              className="border border-amber-200 dark:border-amber-800 bg-white dark:bg-slate-900 rounded-sm px-3 py-2"
            >
              <div className="flex items-center gap-2 text-xs font-semibold text-amber-900 dark:text-amber-200">
                <ArrowUp className="h-3.5 w-3.5" />
                {ESCALATION_REASON_LABELS[e.reason]}
                <span className="text-slate-500 dark:text-slate-400 font-normal">
                  · {new Date(e.triggeredAt).toLocaleString("th-TH")}
                </span>
              </div>
              <div className="text-sm text-slate-800 dark:text-slate-200 mt-1 leading-snug">
                Escalate ขึ้น <strong>{e.toUnitName}</strong>
              </div>
              <div className="text-[11px] text-slate-600 dark:text-slate-400 italic mt-0.5">
                {e.note}
              </div>
            </li>
          ))}
      </ul>
    </section>
  );
}
