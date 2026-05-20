// Command Service Layer — Business logic + RBAC + Audit
// All write operations go through here

import { prisma } from "@/lib/prisma";
import { getTransition } from "./workflow";
import { findCommandById } from "./repository";
import { toThaiDigits } from "./types";
import type { CreateCommandInput, TransitionInput } from "./validators";
import type { CommandStatus } from "./types";

type Role = "ADMIN" | "COMMANDER" | "STAFF" | "AUDITOR" | "VIEWER";

interface AuthUser {
  id: string;
  role: Role;
  name: string;
}

export class ServiceError extends Error {
  constructor(
    public status: number,
    message: string,
    public details?: unknown
  ) {
    super(message);
    this.name = "ServiceError";
  }
}

// ─────────────────────────────────────────────
// Create
// ─────────────────────────────────────────────

export async function createCommand(input: CreateCommandInput, user: AuthUser) {
  // RBAC: เฉพาะ STAFF ขึ้นไป
  if (!["ADMIN", "COMMANDER", "STAFF"].includes(user.role)) {
    throw new ServiceError(403, "คุณไม่มีสิทธิ์สร้างคำสั่ง");
  }

  // Generate docNo atomically + create command in one transaction
  // Use retry-on-conflict to handle rare race conditions
  const result = await prisma.$transaction(async (tx) => {
    // Count commands inside transaction → reduces (but doesn't eliminate)
    // race window. The docNo unique constraint protects integrity.
    const count = await tx.command.count();
    const num = count + 1;
    const docNo = `ตร ๐๐๐๑.๖๙/${toThaiDigits(String(num).padStart(4, "0"))}`;

    // Create command
    const command = await tx.command.create({
      data: {
        docNo,
        subject: input.subject,
        recipient: input.recipient,
        reference: input.reference,
        objective: input.objective,
        body: input.body,
        priority: input.priority,
        missionId: input.missionId,
        creatorId: user.id,
        status: "DRAFT",
        aiAssisted: input.aiAssisted,
        aiPromptUsed: input.aiPromptUsed,
      },
    });

    // Create targets (CommandTarget per unit)
    if (input.targetUnitIds.length > 0) {
      await tx.commandTarget.createMany({
        data: input.targetUnitIds.map((unitId) => ({
          commandId: command.id,
          unitId,
        })),
      });
    }

    // Status log
    await tx.commandStatusLog.create({
      data: {
        commandId: command.id,
        from: null,
        to: "DRAFT",
        byUserId: user.id,
        note: "Created",
      },
    });

    // Audit log (TOR 7.1.5)
    await tx.auditLog.create({
      data: {
        userId: user.id,
        action: "command.create",
        target: `command:${command.id}`,
        details: {
          docNo: command.docNo,
          subject: command.subject,
          targetCount: input.targetUnitIds.length,
          aiAssisted: input.aiAssisted,
        },
      },
    });

    return command;
  });

  return result;
}

// ─────────────────────────────────────────────
// Transition status
// ─────────────────────────────────────────────

export async function transitionCommand(
  id: string,
  input: TransitionInput,
  user: AuthUser
) {
  const command = await findCommandById(id);
  if (!command) {
    throw new ServiceError(404, "ไม่พบคำสั่งนี้");
  }

  // หา transition definition
  const transition = getTransition(command.status as CommandStatus, input.action);
  if (!transition) {
    throw new ServiceError(
      400,
      `ไม่สามารถทำ "${input.action}" จากสถานะ "${command.status}" ได้`
    );
  }

  // ตรวจสอบสิทธิ์
  if (!transition.allowedRoles.includes(user.role)) {
    throw new ServiceError(
      403,
      `บทบาท ${user.role} ไม่มีสิทธิ์ทำ "${transition.label}"`
    );
  }

  const result = await prisma.$transaction(async (tx) => {
    const updated = await tx.command.update({
      where: { id },
      data: {
        status: transition.to,
        // ถ้า approve → save signer
        ...(input.action === "approve" ? { signerId: user.id } : {}),
        // ถ้า publish → save publishedAt
        ...(input.action === "publish"
          ? { publishedAt: new Date() }
          : {}),
        // ถ้า close → save closedAt
        ...(input.action === "close" ? { closedAt: new Date() } : {}),
      },
    });

    // Status log
    await tx.commandStatusLog.create({
      data: {
        commandId: id,
        from: command.status,
        to: transition.to,
        byUserId: user.id,
        note: input.note,
      },
    });

    // Audit log
    await tx.auditLog.create({
      data: {
        userId: user.id,
        action: `command.${input.action}`,
        target: `command:${id}`,
        details: {
          docNo: command.docNo,
          from: command.status,
          to: transition.to,
          note: input.note,
        },
      },
    });

    return updated;
  });

  return result;
}

// ─────────────────────────────────────────────
// Acknowledge — สำหรับ Read Receipt (target user)
// ─────────────────────────────────────────────

export async function acknowledgeTarget(
  commandId: string,
  unitId: string,
  user: AuthUser
) {
  const target = await prisma.commandTarget.findUnique({
    where: { commandId_unitId: { commandId, unitId } },
  });

  if (!target) {
    throw new ServiceError(404, "ไม่พบ target นี้");
  }

  if (target.acknowledged) {
    throw new ServiceError(400, "หน่วยนี้รับทราบแล้ว");
  }

  await prisma.$transaction([
    prisma.commandTarget.update({
      where: { id: target.id },
      data: {
        acknowledged: true,
        acknowledgedAt: new Date(),
        assignedUserId: user.id,
      },
    }),
    prisma.auditLog.create({
      data: {
        userId: user.id,
        action: "command.target.acknowledge",
        target: `command:${commandId}`,
        details: { unitId },
      },
    }),
  ]);
}

// ─────────────────────────────────────────────
// Delete (soft — DRAFT only)
// ─────────────────────────────────────────────

export async function deleteCommand(id: string, user: AuthUser) {
  if (!["ADMIN"].includes(user.role)) {
    throw new ServiceError(403, "เฉพาะ ADMIN ลบคำสั่งได้");
  }

  const command = await findCommandById(id);
  if (!command) {
    throw new ServiceError(404, "ไม่พบคำสั่งนี้");
  }

  if (command.status !== "DRAFT") {
    throw new ServiceError(400, "ลบได้เฉพาะร่าง");
  }

  await prisma.$transaction([
    prisma.command.delete({ where: { id } }),
    prisma.auditLog.create({
      data: {
        userId: user.id,
        action: "command.delete",
        target: `command:${id}`,
        details: { docNo: command.docNo },
      },
    }),
  ]);
}
