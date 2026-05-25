// Emergency mode + Smart Notification helpers
// ---------------------------------------------
// All notifications are MOCK — we don't actually integrate with email/LINE
// providers, we just create log entries that the UI uses to show a realistic
// fan-out timeline.

import type {
  Command,
  CommandPriority,
  EscalationReason,
  NotificationChannel,
  NotificationLog,
} from "./types";

// ── Channel matrix ────────────────────────────
// EMERGENCY blasts on every loud channel. URGENT goes to "modern" channels.
// NORMAL stays in email (formal record).

export const EMERGENCY_CHANNELS: NotificationChannel[] = [
  "EMAIL",
  "LINE",
  "SMS",
  "RADIO",
];
export const URGENT_CHANNELS: NotificationChannel[] = ["EMAIL", "LINE"];
export const NORMAL_CHANNELS: NotificationChannel[] = ["EMAIL"];

export function getChannelsForPriority(
  p: CommandPriority | undefined
): NotificationChannel[] {
  if (p === "EMERGENCY") return EMERGENCY_CHANNELS;
  if (p === "URGENT") return URGENT_CHANNELS;
  return NORMAL_CHANNELS;
}

// ── ID generators ─────────────────────────────

export function genNotificationId(): string {
  return `notif-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

export function genEscalationId(): string {
  return `esc-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

// ── Channel labels for UI ─────────────────────

export const CHANNEL_LABELS: Record<NotificationChannel, string> = {
  EMAIL: "อีเมล",
  LINE: "LINE",
  SMS: "SMS",
  PUSH: "Push",
  RADIO: "วิทยุสื่อสาร",
};

export const STATUS_LABELS = {
  SENT: "ส่งแล้ว",
  DELIVERED: "ถึงแล้ว",
  READ: "อ่านแล้ว",
  FAILED: "ส่งล้มเหลว",
} as const;

export const PRIORITY_BADGE_STYLES: Record<CommandPriority, string> = {
  EMERGENCY:
    "bg-red-600 text-white border-red-700 dark:bg-red-700 dark:border-red-800 animate-pulse",
  URGENT:
    "bg-amber-500 text-white border-amber-600 dark:bg-amber-600 dark:border-amber-700",
  NORMAL:
    "bg-slate-100 text-slate-700 border-slate-300 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700",
};

export const ESCALATION_REASON_LABELS: Record<EscalationReason, string> = {
  NO_ACK_TIMEOUT: "หน่วยไม่รับทราบในเวลา",
  OVERDUE_REPORT: "ไม่ส่งรายงานตามกำหนด",
  MANUAL: "Escalate ด้วยมือ",
};

// ── Notification factory ──────────────────────

/**
 * Create realistic mock notification logs for an emergency/urgent dispatch.
 * One log per (target unit × channel). Status is randomized to mimic real-world
 * fan-out (e.g. SMS DELIVERED but not READ yet, RADIO might FAIL on one unit).
 */
export function createNotificationsForDispatch(
  cmd: Command,
  unitNames: Record<string, string>
): NotificationLog[] {
  const channels = getChannelsForPriority(cmd.priority);
  const now = Date.now();
  const out: NotificationLog[] = [];
  const subjectShort = cmd.letter.subject.replace(/^เรื่อง\s*/, "");
  const message =
    cmd.priority === "EMERGENCY"
      ? `เร่งด่วนสูงสุด — ${subjectShort} กรุณารับทราบและเริ่มปฏิบัติทันที`
      : `${subjectShort} กรุณารับทราบ`;

  for (const unitId of cmd.effectiveUnitIds) {
    const recipient = unitNames[unitId] ?? unitId;
    for (const channel of channels) {
      out.push({
        id: genNotificationId(),
        channel,
        recipient,
        recipientId: unitId,
        sentAt: new Date(now).toISOString(),
        status: "SENT",
        message,
      });
    }
  }
  return out;
}

// ── Escalation detection ──────────────────────

/**
 * Find target units that have not acknowledged within a threshold for an
 * EMERGENCY command — they're candidates for escalation up the chain.
 *
 * Threshold is short: 30 minutes for EMERGENCY, 4 hours for URGENT, 24h normal.
 */
export function detectEscalations(
  cmd: Command
): { unitId: string; reason: "NO_ACK_TIMEOUT" }[] {
  const dispatched = cmd.dispatchedAt ? new Date(cmd.dispatchedAt).getTime() : null;
  if (!dispatched) return [];

  const elapsedMs = Date.now() - dispatched;
  const thresholdMs =
    cmd.priority === "EMERGENCY"
      ? 30 * 60 * 1000
      : cmd.priority === "URGENT"
      ? 4 * 60 * 60 * 1000
      : 24 * 60 * 60 * 1000;
  if (elapsedMs < thresholdMs) return [];

  const out: { unitId: string; reason: "NO_ACK_TIMEOUT" }[] = [];
  for (const u of cmd.unitProgress ?? []) {
    if (u.status === "PENDING" && !u.acknowledgedAt) {
      // Skip if already escalated
      const alreadyEscalated = (cmd.escalations ?? []).some(
        (e) => e.fromUnitId === u.unitId && e.reason === "NO_ACK_TIMEOUT"
      );
      if (!alreadyEscalated) {
        out.push({ unitId: u.unitId, reason: "NO_ACK_TIMEOUT" });
      }
    }
  }
  return out;
}
