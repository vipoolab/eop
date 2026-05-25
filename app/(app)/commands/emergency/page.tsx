// /commands/emergency — Emergency Operations Center (EOC) dashboard
//
// Pinned active EMERGENCY commands, real-time status, notification fan-out,
// escalation log. Red/amber palette.

import Link from "next/link";
import {
  AlertOctagon,
  Siren,
  Zap,
  Radio,
  MapPin,
  Clock,
  AlertTriangle,
  CheckCircle2,
  Building2,
  Send,
  Plus,
  Sparkles,
} from "lucide-react";
import { PageHeader } from "@/components/page-header";
import { listCommands } from "@/lib/commands/store";
import { getUnit } from "@/lib/police-org/store";
import type {
  Command,
  EmergencyTriggerType,
  NotificationChannel,
} from "@/lib/commands/types";
import {
  CHANNEL_LABELS,
  STATUS_LABELS as NOTIF_STATUS_LABELS,
} from "@/lib/commands/emergency";
import { computeTrackingStats } from "@/lib/commands/workflow";

export const dynamic = "force-dynamic";

const TRIGGER_ICONS: Record<EmergencyTriggerType, React.ComponentType<{ className?: string }>> = {
  เหตุก่อการร้าย: Siren,
  ภัยพิบัติ: AlertTriangle,
  การชุมนุมรุนแรง: AlertOctagon,
  เหตุคนร้ายติดอาวุธ: Zap,
  อาชญากรรมต่อเนื่อง: AlertTriangle,
  อื่นๆ: AlertOctagon,
};

const CHANNEL_ICONS: Record<NotificationChannel, React.ComponentType<{ className?: string }>> = {
  EMAIL: Send,
  LINE: Send,
  SMS: Send,
  PUSH: Send,
  RADIO: Radio,
};

function formatElapsed(triggeredAt: string): string {
  const ms = Date.now() - new Date(triggeredAt).getTime();
  const minutes = Math.floor(ms / 60000);
  if (minutes < 1) return "เมื่อสักครู่";
  if (minutes < 60) return `${minutes} นาทีที่แล้ว`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours} ชั่วโมง ${minutes % 60} นาทีที่แล้ว`;
  const days = Math.floor(hours / 24);
  return `${days} วัน ${hours % 24} ชั่วโมงที่แล้ว`;
}

export default function EmergencyDashboardPage() {
  const all = listCommands();
  const emergencies = all
    .filter(
      (c) =>
        c.priority === "EMERGENCY" &&
        c.status !== "CLOSED" &&
        c.status !== "REJECTED"
    )
    .sort((a, b) => {
      const ta = a.emergency?.triggeredAt ?? a.createdAt;
      const tb = b.emergency?.triggeredAt ?? b.createdAt;
      return tb.localeCompare(ta);
    });

  const totalActiveUnits = emergencies.reduce(
    (s, c) => s + (c.unitProgress ?? []).length,
    0
  );
  const totalNotifications = emergencies.reduce(
    (s, c) => s + (c.notifications ?? []).length,
    0
  );
  const totalEscalations = emergencies.reduce(
    (s, c) => s + (c.escalations ?? []).length,
    0
  );

  return (
    <div className="space-y-6">
      {/* Big red EOC banner */}
      <div className="rounded-sm border-2 border-red-700 bg-gradient-to-r from-red-700 to-red-600 dark:from-red-800 dark:to-red-700 text-white px-6 py-5 shadow-lg">
        <div className="flex items-start gap-4">
          <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-sm bg-white/15 border-2 border-white/30 animate-pulse">
            <Siren className="h-7 w-7" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-[11px] font-bold uppercase tracking-[0.15em] text-red-100 mb-1">
              Emergency Operations Center
            </div>
            <h1 className="text-2xl font-bold leading-tight">
              ศูนย์ปฏิบัติการฉุกเฉิน (EOC)
            </h1>
            <p className="text-sm text-red-50/90 mt-1.5 max-w-2xl">
              ติดตามเหตุฉุกเฉินทั้งหมดแบบ real-time — สั่งกำลังเสริม
              ตรวจสอบสถานะการแจ้งเตือน และ Escalation
            </p>
          </div>
          <Link
            href="/commands/new?priority=EMERGENCY"
            className="shrink-0 inline-flex items-center gap-1.5 rounded-sm bg-white text-red-700 hover:bg-red-50 text-sm font-bold px-4 py-2.5 shadow"
          >
            <Plus className="h-4 w-4" />
            สั่งการฉุกเฉินใหม่
          </Link>
        </div>

        {/* Top metrics */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-2 mt-5 pt-4 border-t border-white/20">
          <EocStat label="เหตุฉุกเฉินที่ active" value={emergencies.length} />
          <EocStat label="หน่วยที่กำลังปฏิบัติ" value={totalActiveUnits} />
          <EocStat label="แจ้งเตือนที่ส่งแล้ว" value={totalNotifications} />
          <EocStat
            label="Escalation"
            value={totalEscalations}
            highlight={totalEscalations > 0}
          />
        </div>
      </div>

      {/* Empty state */}
      {emergencies.length === 0 ? (
        <section className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-sm p-12 flex flex-col items-center text-center">
          <div className="h-16 w-16 rounded-sm bg-emerald-100 flex items-center justify-center mb-3">
            <CheckCircle2 className="h-8 w-8 text-emerald-600" />
          </div>
          <div className="text-base font-semibold text-slate-900 dark:text-slate-100">
            ไม่มีเหตุฉุกเฉิน active ในขณะนี้
          </div>
          <div className="text-sm text-slate-500 mt-1 max-w-md">
            หากเกิดเหตุการณ์สำคัญ ผู้บัญชาการสามารถสั่งการเร่งด่วน
            (EMERGENCY) ได้จากปุ่มด้านบน — ระบบจะข้ามขั้นตอนอนุมัติและส่งคำสั่งทันที
          </div>
        </section>
      ) : (
        <div className="space-y-5">
          {emergencies.map((cmd) => (
            <EmergencyCard key={cmd.id} command={cmd} />
          ))}
        </div>
      )}
    </div>
  );
}

function EocStat({
  label,
  value,
  highlight,
}: {
  label: string;
  value: number;
  highlight?: boolean;
}) {
  return (
    <div className="bg-white/10 border border-white/20 rounded-sm px-3 py-2.5">
      <div className="text-[10px] uppercase tracking-wider text-red-100 font-semibold">
        {label}
      </div>
      <div
        className={`text-2xl font-bold leading-tight mt-0.5 ${
          highlight ? "text-amber-200" : "text-white"
        }`}
      >
        {value}
      </div>
    </div>
  );
}

function EmergencyCard({ command }: { command: Command }) {
  const em = command.emergency;
  const Icon = em ? TRIGGER_ICONS[em.triggerType] : AlertOctagon;
  const trackingStats = computeTrackingStats(command);
  const notifs = command.notifications ?? [];
  const escalations = command.escalations ?? [];

  const notifByStatus = notifs.reduce<Record<string, number>>((acc, n) => {
    acc[n.status] = (acc[n.status] ?? 0) + 1;
    return acc;
  }, {});

  // unit head badges
  const unitInfo = (command.unitProgress ?? []).map((u) => ({
    unitId: u.unitId,
    name: getUnit(u.unitId)?.shortName ?? u.unitId,
    status: u.status,
  }));

  return (
    <article className="rounded-sm border-2 border-red-500 dark:border-red-700 bg-white dark:bg-slate-900 overflow-hidden shadow-md">
      {/* Header strip */}
      <div className="bg-red-50 dark:bg-red-900/30 border-b border-red-200 dark:border-red-800/60 px-5 py-3">
        <div className="flex items-start gap-3">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-sm bg-red-600 text-white border border-red-700 shadow">
            <Icon className="h-6 w-6" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap mb-1">
              <span className="text-[10px] font-bold uppercase tracking-wider bg-red-600 text-white px-1.5 py-0.5 rounded-sm">
                EMERGENCY
              </span>
              {em && (
                <span className="text-[11px] font-semibold text-red-800 dark:text-red-200">
                  {em.triggerType}
                </span>
              )}
              {em?.autoDispatched && (
                <span className="text-[10px] font-semibold bg-amber-200 text-amber-900 dark:bg-amber-900/50 dark:text-amber-200 px-1.5 py-0.5 rounded-sm">
                  AUTO-DISPATCH
                </span>
              )}
              {command.letter.docNumber && (
                <span className="text-[11px] font-mono text-slate-600 dark:text-slate-400">
                  {command.letter.docNumber}
                </span>
              )}
            </div>
            <Link
              href={`/commands/${command.id}`}
              className="block text-base font-bold text-slate-900 dark:text-slate-100 hover:underline leading-tight"
            >
              {command.letter.subject}
            </Link>
            {em && (
              <div className="flex items-center gap-3 text-[11px] text-slate-700 dark:text-slate-300 mt-1.5 flex-wrap">
                {em.location && (
                  <span className="inline-flex items-center gap-1">
                    <MapPin className="h-3 w-3 text-red-600" />
                    {em.location}
                  </span>
                )}
                <span className="inline-flex items-center gap-1">
                  <Clock className="h-3 w-3 text-red-600" />
                  {formatElapsed(em.triggeredAt)}
                </span>
                <span className="inline-flex items-center gap-1">
                  <Building2 className="h-3 w-3 text-red-600" />
                  {(command.effectiveUnitIds ?? []).length} หน่วยปฏิบัติ
                </span>
              </div>
            )}
          </div>
        </div>
        {em?.description && (
          <div className="mt-2 ml-15 pl-15 text-sm text-slate-700 dark:text-slate-300 italic">
            "{em.description}"
          </div>
        )}
      </div>

      <div className="p-5 grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Units engaged */}
        <section>
          <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-2 flex items-center gap-1.5">
            <Building2 className="h-3.5 w-3.5" />
            หน่วยที่เกี่ยวข้อง ({unitInfo.length})
          </h3>
          <ul className="space-y-1.5">
            {unitInfo.map((u) => (
              <li
                key={u.unitId}
                className="flex items-center justify-between gap-2 text-xs border border-slate-200 dark:border-slate-700 rounded-sm px-2 py-1.5"
              >
                <span className="font-medium text-slate-800 dark:text-slate-200">
                  {u.name}
                </span>
                <UnitStatusBadge status={u.status} />
              </li>
            ))}
          </ul>
          <div className="mt-3 pt-3 border-t border-slate-100 dark:border-slate-800 text-[11px] text-slate-600 dark:text-slate-400">
            รับทราบ <strong>{trackingStats.ackPercent}%</strong> · ส่งผล{" "}
            <strong>{trackingStats.reportPercent}%</strong>
          </div>
        </section>

        {/* Notifications */}
        <section>
          <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-2 flex items-center gap-1.5">
            <Send className="h-3.5 w-3.5" />
            การแจ้งเตือน ({notifs.length})
          </h3>
          <div className="space-y-1.5">
            {(["READ", "DELIVERED", "SENT", "FAILED"] as const).map((s) => {
              const count = notifByStatus[s] ?? 0;
              if (count === 0) return null;
              const color =
                s === "READ"
                  ? "text-emerald-700 bg-emerald-50 border-emerald-200 dark:bg-emerald-900/30 dark:text-emerald-300 dark:border-emerald-800"
                  : s === "DELIVERED"
                  ? "text-blue-700 bg-blue-50 border-blue-200 dark:bg-blue-900/30 dark:text-blue-300 dark:border-blue-800"
                  : s === "SENT"
                  ? "text-slate-700 bg-slate-50 border-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700"
                  : "text-red-700 bg-red-50 border-red-200 dark:bg-red-900/30 dark:text-red-300 dark:border-red-800";
              return (
                <div
                  key={s}
                  className={`flex items-center justify-between gap-2 text-xs border rounded-sm px-2 py-1.5 ${color}`}
                >
                  <span className="font-medium">
                    {NOTIF_STATUS_LABELS[s]}
                  </span>
                  <span className="font-bold tabular-nums">{count}</span>
                </div>
              );
            })}
          </div>
          {notifs.length > 0 && (
            <div className="mt-3 flex flex-wrap gap-1">
              {Array.from(
                new Set(notifs.map((n) => n.channel))
              ).map((ch) => {
                const ChIcon = CHANNEL_ICONS[ch];
                return (
                  <span
                    key={ch}
                    className="inline-flex items-center gap-1 text-[10px] font-semibold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 px-1.5 py-0.5 rounded-sm"
                  >
                    <ChIcon className="h-2.5 w-2.5" />
                    {CHANNEL_LABELS[ch]}
                  </span>
                );
              })}
            </div>
          )}
        </section>

        {/* Escalation + actions */}
        <section className="space-y-3">
          <div>
            <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-2 flex items-center gap-1.5">
              <AlertTriangle className="h-3.5 w-3.5" />
              Escalation ({escalations.length})
            </h3>
            {escalations.length === 0 ? (
              <div className="text-[11px] text-slate-500 italic border border-dashed border-slate-200 dark:border-slate-700 rounded-sm px-2 py-2">
                ไม่มี escalation — ทุกหน่วยตอบรับในเวลา
              </div>
            ) : (
              <ul className="space-y-1.5">
                {escalations.map((e) => (
                  <li
                    key={e.id}
                    className="text-[11px] border border-amber-300 bg-amber-50 dark:bg-amber-900/20 dark:border-amber-800 rounded-sm px-2 py-1.5"
                  >
                    <div className="font-semibold text-amber-900 dark:text-amber-200">
                      ↑ {e.toUnitName}
                    </div>
                    <div className="text-amber-800 dark:text-amber-300 leading-snug">
                      {e.note}
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>

          {/* Actions */}
          <div className="pt-2 border-t border-slate-100 dark:border-slate-800 space-y-1.5">
            <Link
              href={`/commands/${command.id}`}
              className="block w-full text-center text-xs font-semibold rounded-sm bg-red-600 hover:bg-red-700 text-white px-3 py-2"
            >
              <Sparkles className="inline h-3.5 w-3.5 mr-1" />
              ส่งคำสั่งเพิ่มเติม
            </Link>
            <Link
              href={`/commands/new?priority=EMERGENCY`}
              className="block w-full text-center text-xs font-semibold rounded-sm border border-red-300 text-red-700 hover:bg-red-50 dark:border-red-800 dark:text-red-300 dark:hover:bg-red-900/30 px-3 py-2"
            >
              ขอกำลังเสริม
            </Link>
          </div>
        </section>
      </div>
    </article>
  );
}

function UnitStatusBadge({ status }: { status: string }) {
  const map: Record<string, { label: string; cls: string }> = {
    PENDING: {
      label: "รอรับทราบ",
      cls: "bg-slate-100 text-slate-700 border-slate-300 dark:bg-slate-800 dark:text-slate-300",
    },
    ACKNOWLEDGED: {
      label: "รับทราบ",
      cls: "bg-blue-100 text-blue-800 border-blue-300 dark:bg-blue-900/40 dark:text-blue-300",
    },
    IN_PROGRESS: {
      label: "ปฏิบัติ",
      cls: "bg-amber-100 text-amber-800 border-amber-300 dark:bg-amber-900/40 dark:text-amber-300",
    },
    REPORTED: {
      label: "ส่งผลแล้ว",
      cls: "bg-emerald-100 text-emerald-800 border-emerald-300 dark:bg-emerald-900/40 dark:text-emerald-300",
    },
    CLOSED: {
      label: "ปิด",
      cls: "bg-slate-100 text-slate-600 border-slate-300 dark:bg-slate-800 dark:text-slate-400",
    },
  };
  const m = map[status] ?? map.PENDING;
  return (
    <span
      className={`text-[10px] font-semibold uppercase tracking-wider border rounded-sm px-1.5 py-0.5 ${m.cls}`}
    >
      {m.label}
    </span>
  );
}
