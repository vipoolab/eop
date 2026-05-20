// Smart Notification + Auto-Escalation — TOR 4.7
// Channels: in-app · email · LINE · SMS
// Auto-escalate if not acknowledged within deadline

import { prisma } from "@/lib/prisma";
import type { Prisma } from "@/lib/generated/prisma";

export type Channel = "in_app" | "email" | "line" | "sms";

export type NotificationKind =
  | "command.assigned"
  | "command.due_soon"
  | "command.overdue"
  | "command.escalated"
  | "incident.alert"
  | "ack.required";

export interface NotificationInput {
  userId: string;
  kind: NotificationKind;
  title: string;
  body: string;
  link?: string;
  /** Channels to send through (in priority order) */
  channels: Channel[];
  /** Reference target (e.g. "command:abc123") */
  target?: string;
  /** Priority — affects auto-escalation timing */
  priority?: "LOW" | "NORMAL" | "HIGH" | "URGENT" | "CRITICAL";
}

/**
 * Send notification via multiple channels.
 * In production this would integrate with:
 * - Email: SendGrid / AWS SES
 * - LINE: LINE Notify API or LINE Messaging API
 * - SMS: Thailand SMS provider (Twilio / Thaibulksms)
 *
 * For Pre-PoC demo: log to audit trail + in-app message
 */
export async function sendNotification(input: NotificationInput) {
  const results: Array<{ channel: Channel; status: "sent" | "queued" | "skipped" }> = [];

  for (const channel of input.channels) {
    try {
      switch (channel) {
        case "in_app":
          // In production: write to notifications table + websocket push
          results.push({ channel, status: "sent" });
          break;

        case "email":
          // Stub: queue to email worker
          // await sgMail.send({ ... })
          results.push({ channel, status: "queued" });
          break;

        case "line": {
          // Stub: LINE Notify
          // const token = process.env.LINE_NOTIFY_TOKEN;
          // await fetch("https://notify-api.line.me/api/notify", { ... })
          results.push({
            channel,
            status: process.env.LINE_NOTIFY_TOKEN ? "queued" : "skipped",
          });
          break;
        }

        case "sms":
          // Stub: SMS provider
          results.push({
            channel,
            status: process.env.SMS_API_KEY ? "queued" : "skipped",
          });
          break;
      }
    } catch {
      results.push({ channel, status: "skipped" });
    }
  }

  // Audit log every notification attempt
  await prisma.auditLog.create({
    data: {
      userId: input.userId,
      action: `notification.${input.kind}`,
      target: input.target ?? `user:${input.userId}`,
      details: {
        title: input.title,
        body: input.body.slice(0, 200),
        link: input.link,
        priority: input.priority,
        channels: results,
      },
    },
  });

  return { sent: results.filter((r) => r.status === "sent").length, results };
}

// ─────────────────────────────────────────────
// Auto-Escalation — TOR 4.7
// Run via cron: scan commands not acknowledged past deadline
// ─────────────────────────────────────────────

const ESCALATION_RULES = {
  LOW: { ackHours: 168, escalateHours: 336 }, // 1w / 2w
  NORMAL: { ackHours: 72, escalateHours: 168 }, // 3d / 1w
  HIGH: { ackHours: 24, escalateHours: 72 }, // 1d / 3d
  URGENT: { ackHours: 8, escalateHours: 24 }, // 8h / 1d
  CRITICAL: { ackHours: 2, escalateHours: 8 }, // 2h / 8h
} as const;

export async function runEscalationCheck() {
  const since = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

  const commands = await prisma.command.findMany({
    where: {
      status: "PUBLISHED",
      publishedAt: { gte: since, not: null },
    },
    include: {
      targets: {
        where: { acknowledged: false },
        include: { unit: { select: { code: true, name: true } } },
      },
      creator: { select: { id: true, name: true, rank: true } },
    },
  });

  const escalations: Array<{
    commandId: string;
    docNo: string;
    targetUnit: string;
    reason: "due_soon" | "overdue";
  }> = [];

  // Collect audit log entries to batch insert at end
  const auditLogs: Prisma.AuditLogCreateManyInput[] = [];

  for (const cmd of commands) {
    if (!cmd.publishedAt) continue;
    const ageHours =
      (Date.now() - cmd.publishedAt.getTime()) / (60 * 60 * 1000);
    const rule = ESCALATION_RULES[cmd.priority];

    for (const target of cmd.targets) {
      if (ageHours > rule.escalateHours) {
        escalations.push({
          commandId: cmd.id,
          docNo: cmd.docNo,
          targetUnit: target.unit.code,
          reason: "overdue",
        });

        auditLogs.push({
          userId: cmd.creator.id,
          action: "notification.command.escalated",
          target: `command:${cmd.id}`,
          details: {
            title: `Auto-Escalation: ${cmd.docNo}`,
            unit: target.unit.code,
            channels: ["in_app", "email"],
            priority: cmd.priority,
          },
        });
      } else if (ageHours > rule.ackHours) {
        escalations.push({
          commandId: cmd.id,
          docNo: cmd.docNo,
          targetUnit: target.unit.code,
          reason: "due_soon",
        });

        auditLogs.push({
          userId: cmd.creator.id,
          action: "notification.command.due_soon",
          target: `command:${cmd.id}`,
          details: {
            title: `Due Soon: ${cmd.docNo}`,
            unit: target.unit.code,
            channels: ["in_app"],
            priority: cmd.priority,
          },
        });
      }
    }
  }

  // Batch insert all audit logs in one query
  if (auditLogs.length > 0) {
    await prisma.auditLog.createMany({ data: auditLogs });
  }

  return { scanned: commands.length, escalations };
}
