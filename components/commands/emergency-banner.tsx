// Emergency banner — shown above command detail when priority=EMERGENCY.
// Big red strip with trigger info + location + elapsed time.

import { Siren, MapPin, Clock, Zap } from "lucide-react";
import type { Command, CommandPriority } from "@/lib/commands/types";

interface Props {
  command: Command;
}

function formatElapsed(at: string): string {
  const ms = Date.now() - new Date(at).getTime();
  const minutes = Math.floor(ms / 60000);
  if (minutes < 1) return "เมื่อสักครู่";
  if (minutes < 60) return `${minutes} นาทีที่แล้ว`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours} ชั่วโมง ${minutes % 60} นาทีที่แล้ว`;
  const days = Math.floor(hours / 24);
  return `${days} วัน ${hours % 24} ชั่วโมงที่แล้ว`;
}

export function PriorityBadge({ priority }: { priority: CommandPriority | undefined }) {
  if (!priority || priority === "NORMAL") return null;
  if (priority === "EMERGENCY") {
    return (
      <span className="inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider px-2 py-1 rounded-sm bg-red-600 text-white animate-pulse">
        <Siren className="h-3 w-3" />
        EMERGENCY
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider px-2 py-1 rounded-sm bg-amber-500 text-white">
      <Zap className="h-3 w-3" />
      URGENT
    </span>
  );
}

export function EmergencyBanner({ command }: Props) {
  const em = command.emergency;
  if (!em || command.priority !== "EMERGENCY") return null;

  return (
    <div className="rounded-sm border-2 border-red-600 bg-gradient-to-r from-red-700 to-red-600 text-white px-5 py-4 shadow-md">
      <div className="flex items-start gap-3">
        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-sm bg-white/15 border border-white/30 animate-pulse">
          <Siren className="h-6 w-6" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap mb-1">
            <span className="text-[10px] font-bold uppercase tracking-[0.15em] bg-white text-red-700 px-1.5 py-0.5 rounded-sm">
              EMERGENCY
            </span>
            <span className="text-sm font-bold">{em.triggerType}</span>
            {em.autoDispatched && (
              <span className="text-[10px] font-semibold bg-amber-300 text-amber-900 px-1.5 py-0.5 rounded-sm">
                AUTO-DISPATCH (ข้ามขั้นตอนอนุมัติ)
              </span>
            )}
          </div>
          <div className="text-base font-semibold leading-snug">
            {em.description}
          </div>
          <div className="flex items-center gap-4 mt-2 text-[12px] text-red-50/95 flex-wrap">
            {em.location && (
              <span className="inline-flex items-center gap-1.5">
                <MapPin className="h-3.5 w-3.5" />
                {em.location}
              </span>
            )}
            <span className="inline-flex items-center gap-1.5">
              <Clock className="h-3.5 w-3.5" />
              เกิดเหตุ {formatElapsed(em.triggeredAt)}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
