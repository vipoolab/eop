// Command Service Layer — Business logic + RBAC + Audit
// All write operations go through here
// Updated for schema v3 — supports DigitalSignature, CommandComment, CommandAttachment,
// CommandTargetKpi, parentCommandId, emergencyMode, caseType, templateId

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
// Create — TOR 4.1 (start), 4.4 (sub), 4.7 (emergency), 4.8 (template)
// ─────────────────────────────────────────────

export async function createCommand(input: CreateCommandInput, user: AuthUser) {
  // RBAC: เฉพาะ STAFF ขึ้นไป
  if (!["ADMIN", "COMMANDER", "STAFF"].includes(user.role)) {
    throw new ServiceError(403, "คุณไม่มีสิทธิ์สร้างคำสั่ง");
  }

  // RBAC: Emergency mode ต้อง COMMANDER ขึ้นไป (TOR 4.7)
  if (input.emergencyMode && !["ADMIN", "COMMANDER"].includes(user.role)) {
    throw new ServiceError(403, "โหมดฉุกเฉินต้องเป็น COMMANDER ขึ้นไป");
  }

  // Validate parentCommand exists (if sub-command)
  if (input.parentCommandId) {
    const parent = await prisma.command.findUnique({
      where: { id: input.parentCommandId },
      select: { id: true, status: true },
    });
    if (!parent) {
      throw new ServiceError(404, "ไม่พบคำสั่งแม่ที่อ้างถึง");
    }
    if (!["APPROVED", "PUBLISHED", "ACKNOWLEDGED", "IN_PROGRESS"].includes(parent.status)) {
      throw new ServiceError(
        400,
        "คำสั่งแม่ต้องอยู่ในสถานะ APPROVED ขึ้นไป จึงจะสร้างคำสั่งย่อยได้"
      );
    }
  }

  // Generate docNo atomically + create command in one transaction
  const result = await prisma.$transaction(async (tx) => {
    const count = await tx.command.count();
    const num = count + 1;
    const docNo = `ตร ๐๐๐๑.๖๙/${toThaiDigits(String(num).padStart(4, "0"))}`;

    // Emergency mode bypass: status starts at PUBLISHED (skip DRAFT/SUBMITTED/APPROVED)
    const initialStatus: CommandStatus = input.emergencyMode ? "PUBLISHED" : "DRAFT";

    const command = await tx.command.create({
      data: {
        docNo,
        subject: input.subject,
        recipient: input.recipient,
        reference: input.reference,
        objective: input.objective,
        body: input.body,
        priority: input.priority,
        caseType: input.caseType,
        emergencyMode: input.emergencyMode,
        emergencyReason: input.emergencyReason,
        parentCommandId: input.parentCommandId,
        templateId: input.templateId,
        missionId: input.missionId,
        agendaId: input.agendaId,
        effectiveDate: input.effectiveDate,
        dueDate: input.dueDate,
        creatorId: user.id,
        // Emergency mode → auto-sign by creator + auto-published
        ...(input.emergencyMode
          ? { signerId: user.id, publishedAt: new Date() }
          : {}),
        status: initialStatus,
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
        to: initialStatus,
        byUserId: user.id,
        note: input.emergencyMode
          ? `โหมดฉุกเฉิน bypass: ${input.emergencyReason ?? ""}`
          : "Created",
      },
    });

    // For emergency mode, also create the auto-signature
    if (input.emergencyMode) {
      await tx.digitalSignature.create({
        data: {
          commandId: command.id,
          signerId: user.id,
          signatureType: "E_SIGN",
          signatureData: `emergency-auto-sign:${command.docNo}`,
        },
      });
    }

    // Audit log (TOR 7.1.5)
    await tx.auditLog.create({
      data: {
        userId: user.id,
        action: input.emergencyMode ? "command.create.emergency" : "command.create",
        target: `command:${command.id}`,
        details: {
          docNo: command.docNo,
          subject: command.subject,
          targetCount: input.targetUnitIds.length,
          aiAssisted: input.aiAssisted,
          emergencyMode: input.emergencyMode,
          parentCommandId: input.parentCommandId,
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

    // Create DigitalSignature on approve (TOR 4.1 e-Signature)
    if (input.action === "approve") {
      await tx.digitalSignature.create({
        data: {
          commandId: id,
          signerId: user.id,
          signatureType: "E_SIGN",
          signatureData: input.signatureData ?? `e-sign:${command.docNo}:${user.id}`,
          certificateRef: input.certificateRef,
        },
      });
    }

    // ─── Auto-Flow on close: sweep CommandTargetKpi with actualValue
    //                        → ensure KpiResult exists (TOR 5.4.4 → 5.4.1) ───
    let autoFlowSummary: { kpiResultsCreated: number; kpisRecomputed: string[] } | null = null;
    if (input.action === "close") {
      const ctks = await tx.commandTargetKpi.findMany({
        where: {
          commandTarget: { commandId: id },
          actualValue: { not: null },
        },
        include: {
          kpi: { select: { id: true, target: true } },
          commandTarget: {
            include: { unit: { select: { id: true, name: true } } },
          },
        },
      });

      const period = derivePeriod(updated.publishedAt ?? updated.createdAt);
      const kpisTouched = new Set<string>();
      let created = 0;

      for (const ctk of ctks) {
        if (ctk.actualValue === null) continue;
        const result = await tx.kpiResult.upsert({
          where: {
            kpiId_area_period_unitId: {
              kpiId: ctk.kpiId,
              area: ctk.commandTarget.unit.name,
              period,
              unitId: ctk.commandTarget.unit.id,
            },
          },
          create: {
            kpiId: ctk.kpiId,
            area: ctk.commandTarget.unit.name,
            period,
            unitId: ctk.commandTarget.unit.id,
            actual: ctk.actualValue,
            target: ctk.targetValue,
            reportedById: user.id,
          },
          update: {
            actual: ctk.actualValue,
            target: ctk.targetValue,
            reportedById: user.id,
          },
        });
        if (result) created += 1;
        kpisTouched.add(ctk.kpiId);
      }

      // Recompute each touched KPI
      for (const kpiId of kpisTouched) {
        const allResults = await tx.kpiResult.findMany({
          where: { kpiId },
          select: { actual: true, target: true },
        });
        const sumActual = allResults.reduce((s, r) => s + r.actual, 0);
        const sumTarget = allResults.reduce((s, r) => s + r.target, 0);
        const achievementPct = sumTarget > 0 ? (sumActual / sumTarget) * 100 : 0;
        const newStatus: "green" | "yellow" | "red" =
          achievementPct >= 90 ? "green" : achievementPct >= 70 ? "yellow" : "red";
        await tx.kpi.update({
          where: { id: kpiId },
          data: { actual: sumActual, status: newStatus },
        });
      }

      autoFlowSummary = {
        kpiResultsCreated: created,
        kpisRecomputed: [...kpisTouched],
      };
    }

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
          ...(autoFlowSummary ? { autoFlow: autoFlowSummary } : {}),
        },
      },
    });

    return updated;
  });

  return result;
}

// ─────────────────────────────────────────────
// Add comment — TOR 4.1 review/approve workflow
// ─────────────────────────────────────────────

export async function addCommandComment(
  commandId: string,
  input: { commentType: "REVIEW" | "APPROVE" | "REJECT" | "REVISE" | "INFO"; body: string },
  user: AuthUser
) {
  if (!["ADMIN", "COMMANDER", "STAFF"].includes(user.role)) {
    throw new ServiceError(403, "ไม่มีสิทธิ์แสดงความคิดเห็น");
  }

  const command = await prisma.command.findUnique({
    where: { id: commandId },
    select: { id: true, docNo: true },
  });
  if (!command) throw new ServiceError(404, "ไม่พบคำสั่งนี้");

  const comment = await prisma.$transaction(async (tx) => {
    const c = await tx.commandComment.create({
      data: {
        commandId,
        authorId: user.id,
        commentType: input.commentType,
        body: input.body,
      },
    });

    await tx.auditLog.create({
      data: {
        userId: user.id,
        action: "command.comment",
        target: `command:${commandId}`,
        details: { commentType: input.commentType, docNo: command.docNo },
      },
    });

    return c;
  });

  return comment;
}

// ─────────────────────────────────────────────
// Add attachment — สิ่งที่ส่งมาด้วย (TOR หนังสือราชการ)
// ─────────────────────────────────────────────

export async function addCommandAttachment(
  commandId: string,
  input: { documentId: string; description?: string; order?: number },
  user: AuthUser
) {
  if (!["ADMIN", "COMMANDER", "STAFF"].includes(user.role)) {
    throw new ServiceError(403, "ไม่มีสิทธิ์เพิ่มเอกสารแนบ");
  }

  const command = await prisma.command.findUnique({
    where: { id: commandId },
    select: { id: true, status: true },
  });
  if (!command) throw new ServiceError(404, "ไม่พบคำสั่งนี้");

  // Only allow attachment if not yet published (or admin)
  if (command.status !== "DRAFT" && command.status !== "SUBMITTED" && user.role !== "ADMIN") {
    throw new ServiceError(400, "แนบเอกสารได้เฉพาะร่างหรือเสนอเท่านั้น");
  }

  return prisma.$transaction(async (tx) => {
    const attachment = await tx.commandAttachment.create({
      data: {
        commandId,
        documentId: input.documentId,
        description: input.description,
        order: input.order ?? 0,
      },
    });

    await tx.auditLog.create({
      data: {
        userId: user.id,
        action: "command.attachment.add",
        target: `command:${commandId}`,
        details: { documentId: input.documentId },
      },
    });

    return attachment;
  });
}

// ─────────────────────────────────────────────
// Set KPI target for cascade unit — TOR 4.5
// ─────────────────────────────────────────────

export async function setCommandTargetKpi(
  commandTargetId: string,
  input: { kpiId: string; targetValue: number },
  user: AuthUser
) {
  if (!["ADMIN", "COMMANDER"].includes(user.role)) {
    throw new ServiceError(403, "เฉพาะ COMMANDER ขึ้นไปตั้งเป้า KPI ได้");
  }

  return prisma.$transaction(async (tx) => {
    const result = await tx.commandTargetKpi.upsert({
      where: {
        commandTargetId_kpiId: {
          commandTargetId,
          kpiId: input.kpiId,
        },
      },
      create: {
        commandTargetId,
        kpiId: input.kpiId,
        targetValue: input.targetValue,
      },
      update: {
        targetValue: input.targetValue,
      },
    });

    await tx.auditLog.create({
      data: {
        userId: user.id,
        action: "command.target.kpi.set",
        target: `commandTarget:${commandTargetId}`,
        details: { kpiId: input.kpiId, targetValue: input.targetValue },
      },
    });

    return result;
  });
}

// ─────────────────────────────────────────────
// Report KPI actual — when target unit completes
// Auto-Flow (TOR 5.4.1 ↔ 5.4.4): create/update KpiResult automatically
// so KPI achievement flows back to P1 + visible in P3 Compliance
// ─────────────────────────────────────────────

export async function reportCommandTargetKpi(
  commandTargetKpiId: string,
  input: { actualValue: number },
  user: AuthUser
) {
  return prisma.$transaction(async (tx) => {
    const updated = await tx.commandTargetKpi.update({
      where: { id: commandTargetKpiId },
      data: {
        actualValue: input.actualValue,
        reportedAt: new Date(),
      },
      include: {
        kpi: { select: { id: true, code: true, target: true } },
        commandTarget: {
          include: {
            unit: { select: { id: true, code: true, name: true } },
            command: { select: { id: true, docNo: true, createdAt: true, publishedAt: true } },
          },
        },
      },
    });

    // ─── Auto-Flow: create/update KpiResult ───
    const cmd = updated.commandTarget.command;
    const unit = updated.commandTarget.unit;
    const period = derivePeriod(cmd.publishedAt ?? cmd.createdAt);
    const area = unit.name;

    await tx.kpiResult.upsert({
      where: {
        kpiId_area_period_unitId: {
          kpiId: updated.kpiId,
          area,
          period,
          unitId: unit.id,
        },
      },
      create: {
        kpiId: updated.kpiId,
        area,
        period,
        unitId: unit.id,
        actual: input.actualValue,
        target: updated.targetValue,
        reportedById: user.id,
      },
      update: {
        actual: input.actualValue,
        target: updated.targetValue,
        reportedById: user.id,
      },
    });

    // ─── Recompute Kpi.actual + status from aggregate of latest results ───
    const allResults = await tx.kpiResult.findMany({
      where: { kpiId: updated.kpiId },
      select: { actual: true, target: true },
    });
    const sumActual = allResults.reduce((s, r) => s + r.actual, 0);
    const sumTarget = allResults.reduce((s, r) => s + r.target, 0) || updated.kpi.target;
    const achievementPct = sumTarget > 0 ? (sumActual / sumTarget) * 100 : 0;
    const newStatus: "green" | "yellow" | "red" =
      achievementPct >= 90 ? "green" : achievementPct >= 70 ? "yellow" : "red";

    await tx.kpi.update({
      where: { id: updated.kpiId },
      data: {
        actual: sumActual,
        status: newStatus,
      },
    });

    await tx.auditLog.create({
      data: {
        userId: user.id,
        action: "command.target.kpi.report",
        target: `commandTargetKpi:${commandTargetKpiId}`,
        details: {
          actualValue: input.actualValue,
          kpi: updated.kpi.code,
          docNo: cmd.docNo,
          autoFlow: {
            kpiResultUpserted: true,
            newKpiActual: sumActual,
            newKpiStatus: newStatus,
            achievementPct: Number(achievementPct.toFixed(1)),
          },
        },
      },
    });

    return updated;
  });
}

/** Derive period string from date — "Q{1-4}/{BE year}" */
function derivePeriod(d: Date): string {
  const month = d.getMonth() + 1; // 1-12
  const quarter = Math.ceil(month / 3);
  const yearBe = d.getFullYear() + 543;
  return `Q${quarter}/${yearBe}`;
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
