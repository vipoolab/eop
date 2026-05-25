// Notification timeline — list of all fan-out notification logs for a command.
// Groups by channel, shows status icons.

import {
  Send,
  Mail,
  MessageCircle,
  Radio,
  Smartphone,
  CheckCircle2,
  Check,
  Eye,
  XCircle,
} from "lucide-react";
import type { Command, NotificationChannel } from "@/lib/commands/types";
import { CHANNEL_LABELS, STATUS_LABELS } from "@/lib/commands/emergency";

const CHANNEL_ICONS: Record<NotificationChannel, React.ComponentType<{ className?: string }>> = {
  EMAIL: Mail,
  LINE: MessageCircle,
  SMS: Smartphone,
  PUSH: Send,
  RADIO: Radio,
};

const STATUS_VISUAL = {
  SENT: { icon: Check, color: "text-slate-500", bg: "bg-slate-100 text-slate-700" },
  DELIVERED: { icon: CheckCircle2, color: "text-blue-600", bg: "bg-blue-50 text-blue-800 border-blue-200" },
  READ: { icon: Eye, color: "text-emerald-600", bg: "bg-emerald-50 text-emerald-800 border-emerald-200" },
  FAILED: { icon: XCircle, color: "text-red-600", bg: "bg-red-50 text-red-800 border-red-200" },
};

interface Props {
  command: Command;
}

export function NotificationTimeline({ command }: Props) {
  const notifs = command.notifications ?? [];
  if (notifs.length === 0) {
    return (
      <section className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-sm p-4">
        <div className="flex items-center gap-2 text-sm font-semibold text-slate-700 dark:text-slate-200 mb-2">
          <Send className="h-4 w-4" />
          การแจ้งเตือน
        </div>
        <div className="text-xs text-slate-500 italic border border-dashed border-slate-200 rounded-sm p-3 text-center">
          ไม่มีการแจ้งเตือนสำหรับคำสั่งนี้
        </div>
      </section>
    );
  }

  const counts = notifs.reduce<Record<string, number>>((acc, n) => {
    acc[n.status] = (acc[n.status] ?? 0) + 1;
    return acc;
  }, {});

  // Sort: most recent first
  const sorted = [...notifs].sort((a, b) => b.sentAt.localeCompare(a.sentAt));

  return (
    <section className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-sm p-4">
      <div className="flex items-center justify-between gap-2 mb-3 flex-wrap">
        <div className="flex items-center gap-2 text-sm font-semibold text-slate-700 dark:text-slate-200">
          <Send className="h-4 w-4" />
          การแจ้งเตือน ({notifs.length})
        </div>
        <div className="flex flex-wrap gap-1.5">
          {(["READ", "DELIVERED", "SENT", "FAILED"] as const).map((s) => {
            const n = counts[s] ?? 0;
            if (n === 0) return null;
            const v = STATUS_VISUAL[s];
            return (
              <span
                key={s}
                className={`text-[10px] font-semibold px-1.5 py-0.5 rounded-sm border ${v.bg}`}
              >
                {STATUS_LABELS[s]} {n}
              </span>
            );
          })}
        </div>
      </div>

      <div className="space-y-1.5 max-h-96 overflow-y-auto pr-1">
        {sorted.map((n) => {
          const ChIcon = CHANNEL_ICONS[n.channel];
          const v = STATUS_VISUAL[n.status];
          const SIcon = v.icon;
          return (
            <div
              key={n.id}
              className="flex items-start gap-2.5 border border-slate-200 dark:border-slate-700 rounded-sm px-3 py-2"
            >
              <div className="shrink-0 h-7 w-7 rounded-sm bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-600 dark:text-slate-300">
                <ChIcon className="h-3.5 w-3.5" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-xs font-semibold text-slate-800 dark:text-slate-200">
                    {CHANNEL_LABELS[n.channel]}
                  </span>
                  <span className="text-[11px] text-slate-500 dark:text-slate-400 truncate">
                    → {n.recipient}
                  </span>
                </div>
                <div className="text-[11px] text-slate-600 dark:text-slate-400 leading-snug mt-0.5 line-clamp-2">
                  {n.message}
                </div>
                <div className="text-[10px] text-slate-400 dark:text-slate-500 mt-0.5">
                  ส่ง {new Date(n.sentAt).toLocaleString("th-TH")}
                  {n.readAt && (
                    <span className="ml-2">
                      · อ่าน {new Date(n.readAt).toLocaleString("th-TH")}
                    </span>
                  )}
                </div>
              </div>
              <div
                className={`shrink-0 inline-flex items-center gap-1 text-[10px] font-semibold uppercase tracking-wider border rounded-sm px-1.5 py-0.5 ${v.bg}`}
              >
                <SIcon className="h-3 w-3" />
                {STATUS_LABELS[n.status]}
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}
