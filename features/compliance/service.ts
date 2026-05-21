// Compliance Service Layer — TOR 5.4.3
// RBAC + Audit + Score calculation + Workflow

import { prisma } from "@/lib/prisma";
import type {
  CreateTemplateInput,
  UpdateTemplateInput,
  ChecklistItemInput,
  CreateReportInput,
  UpsertAnswerInput,
  ReviewInput,
} from "./validators";
import { calculateReportScore } from "./types";

type Role = "ADMIN" | "COMMANDER" | "STAFF" | "AUDITOR" | "VIEWER";

interface AuthUser {
  id: string;
  role: Role;
}

export class ComplianceError extends Error {
  constructor(public status: number, message: string) {
    super(message);
    this.name = "ComplianceError";
  }
}

// ─────────────────────────────────────────────
// Templates
// ─────────────────────────────────────────────

export async function createTemplate(
  input: CreateTemplateInput,
  items: ChecklistItemInput[],
  user: AuthUser
) {
  if (!["ADMIN", "COMMANDER"].includes(user.role)) {
    throw new ComplianceError(403, "เฉพาะ ADMIN / COMMANDER สร้าง template ได้");
  }
  const existing = await prisma.complianceTemplate.findUnique({
    where: { code: input.code },
  });
  if (existing) throw new ComplianceError(400, `รหัส ${input.code} ซ้ำ`);

  return prisma.$transaction(async (tx) => {
    const tpl = await tx.complianceTemplate.create({
      data: {
        standard: input.standard,
        code: input.code,
        name: input.name,
        version: input.version,
        effectiveDate: input.effectiveDate,
      },
    });
    if (items.length > 0) {
      await tx.complianceChecklistItem.createMany({
        data: items.map((it) => ({
          templateId: tpl.id,
          code: it.code,
          category: it.category,
          question: it.question,
          weight: it.weight,
          order: it.order,
          evidenceRequired: it.evidenceRequired,
        })),
      });
    }
    await tx.auditLog.create({
      data: {
        userId: user.id,
        action: "compliance.template.create",
        target: `complianceTemplate:${tpl.id}`,
        details: { code: tpl.code, items: items.length },
      },
    });
    return tpl;
  });
}

export async function updateTemplate(
  id: string,
  input: UpdateTemplateInput,
  user: AuthUser
) {
  if (!["ADMIN", "COMMANDER"].includes(user.role)) {
    throw new ComplianceError(403, "ไม่มีสิทธิ์");
  }
  const tpl = await prisma.complianceTemplate.update({
    where: { id },
    data: {
      ...(input.standard !== undefined && { standard: input.standard }),
      ...(input.code !== undefined && { code: input.code }),
      ...(input.name !== undefined && { name: input.name }),
      ...(input.version !== undefined && { version: input.version }),
      ...(input.effectiveDate !== undefined && { effectiveDate: input.effectiveDate }),
    },
  });
  await prisma.auditLog.create({
    data: {
      userId: user.id,
      action: "compliance.template.update",
      target: `complianceTemplate:${id}`,
      details: { changes: Object.keys(input) },
    },
  });
  return tpl;
}

// ─────────────────────────────────────────────
// Reports
// ─────────────────────────────────────────────

export async function createReport(input: CreateReportInput, user: AuthUser) {
  if (!["ADMIN", "COMMANDER", "STAFF"].includes(user.role)) {
    throw new ComplianceError(403, "ไม่มีสิทธิ์สร้างรายงาน");
  }
  const tpl = await prisma.complianceTemplate.findUnique({
    where: { id: input.templateId },
    include: { items: true },
  });
  if (!tpl) throw new ComplianceError(404, "ไม่พบ template");

  return prisma.$transaction(async (tx) => {
    const report = await tx.complianceReport.create({
      data: {
        templateId: input.templateId,
        unitId: input.unitId,
        period: input.period,
        dueDate: input.dueDate ?? undefined,
        status: "DRAFT",
        createdById: user.id,
      },
    });
    // Pre-create empty answers for all items (easier UI)
    if (tpl.items.length > 0) {
      await tx.complianceAnswer.createMany({
        data: tpl.items.map((it) => ({
          reportId: report.id,
          itemId: it.id,
        })),
      });
    }
    await tx.auditLog.create({
      data: {
        userId: user.id,
        action: "compliance.report.create",
        target: `complianceReport:${report.id}`,
        details: { templateId: tpl.id, period: input.period },
      },
    });
    return report;
  });
}

export async function upsertAnswer(
  reportId: string,
  input: UpsertAnswerInput,
  user: AuthUser
) {
  if (!["ADMIN", "COMMANDER", "STAFF"].includes(user.role)) {
    throw new ComplianceError(403, "ไม่มีสิทธิ์");
  }
  const report = await prisma.complianceReport.findUnique({
    where: { id: reportId },
    select: { id: true, status: true },
  });
  if (!report) throw new ComplianceError(404, "ไม่พบรายงาน");
  if (report.status !== "DRAFT") {
    throw new ComplianceError(
      400,
      "รายงานส่งแล้ว แก้คำตอบไม่ได้ — สร้างฉบับใหม่"
    );
  }

  const updated = await prisma.complianceAnswer.upsert({
    where: { reportId_itemId: { reportId, itemId: input.itemId } },
    create: {
      reportId,
      itemId: input.itemId,
      answer: input.answer ?? null,
      selfScore: input.selfScore ?? null,
      evidenceDocId: input.evidenceDocId ?? null,
      assignedUnitId: input.assignedUnitId ?? null,
      answeredById: user.id,
      answeredAt: new Date(),
    },
    update: {
      answer: input.answer ?? null,
      selfScore: input.selfScore ?? null,
      evidenceDocId: input.evidenceDocId ?? null,
      ...(input.assignedUnitId !== undefined && { assignedUnitId: input.assignedUnitId }),
      answeredById: user.id,
      answeredAt: new Date(),
    },
  });

  // Recalculate score
  await recalcReportScore(reportId);

  return updated;
}

async function recalcReportScore(reportId: string) {
  const items = await prisma.complianceAnswer.findMany({
    where: { reportId },
    include: { item: { select: { weight: true } } },
  });
  const { score, maxScore } = calculateReportScore(
    items.map((a) => ({
      weight: a.item.weight,
      selfScore: a.selfScore,
      reviewerScore: a.reviewerScore,
    }))
  );
  await prisma.complianceReport.update({
    where: { id: reportId },
    data: { score, maxScore },
  });
}

export async function submitReport(reportId: string, user: AuthUser) {
  if (!["ADMIN", "COMMANDER", "STAFF"].includes(user.role)) {
    throw new ComplianceError(403, "ไม่มีสิทธิ์");
  }
  const report = await prisma.complianceReport.findUnique({
    where: { id: reportId },
    select: { id: true, status: true },
  });
  if (!report) throw new ComplianceError(404, "ไม่พบรายงาน");
  if (report.status !== "DRAFT") {
    throw new ComplianceError(400, "ส่งได้เฉพาะรายงานสถานะ DRAFT");
  }
  await prisma.complianceReport.update({
    where: { id: reportId },
    data: { status: "SUBMITTED", submittedAt: new Date() },
  });
  await prisma.auditLog.create({
    data: {
      userId: user.id,
      action: "compliance.report.submit",
      target: `complianceReport:${reportId}`,
    },
  });
}

export async function reviewReport(
  reportId: string,
  input: ReviewInput,
  user: AuthUser
) {
  if (!["ADMIN", "COMMANDER", "AUDITOR"].includes(user.role)) {
    throw new ComplianceError(403, "เฉพาะ AUDITOR/COMMANDER/ADMIN ตรวจได้");
  }
  const report = await prisma.complianceReport.findUnique({
    where: { id: reportId },
    select: { id: true, status: true },
  });
  if (!report) throw new ComplianceError(404, "ไม่พบรายงาน");
  if (report.status !== "SUBMITTED" && report.status !== "REVIEWED") {
    throw new ComplianceError(400, "รายงานต้อง SUBMITTED ก่อน");
  }

  return prisma.$transaction(async (tx) => {
    for (const ans of input.answers) {
      await tx.complianceAnswer.update({
        where: { reportId_itemId: { reportId, itemId: ans.itemId } },
        data: { reviewerScore: ans.reviewerScore },
      });
    }
    await tx.complianceReport.update({
      where: { id: reportId },
      data: {
        status: "REVIEWED",
        reviewedAt: new Date(),
        reviewerId: user.id,
      },
    });
    await tx.auditLog.create({
      data: {
        userId: user.id,
        action: "compliance.report.review",
        target: `complianceReport:${reportId}`,
        details: { items: input.answers.length },
      },
    });
  }).then(() => recalcReportScore(reportId));
}

export interface ApproveInput {
  signatureData: string; // base64 image / hash
  certificateRef?: string | null;
  ipAddress?: string | null;
  userAgent?: string | null;
}

export async function approveReport(
  reportId: string,
  input: ApproveInput,
  user: AuthUser
) {
  if (!["ADMIN", "COMMANDER"].includes(user.role)) {
    throw new ComplianceError(403, "เฉพาะ ADMIN/COMMANDER อนุมัติได้");
  }
  if (!input.signatureData || input.signatureData.length < 10) {
    throw new ComplianceError(400, "ต้องลงลายเซ็นอิเล็กทรอนิกส์");
  }
  const report = await prisma.complianceReport.findUnique({
    where: { id: reportId },
    select: { id: true, status: true, reviewerId: true },
  });
  if (!report) throw new ComplianceError(404, "ไม่พบรายงาน");
  if (report.status !== "REVIEWED") {
    throw new ComplianceError(400, "รายงานต้อง REVIEWED ก่อนอนุมัติ");
  }
  // Reviewer cannot approve their own review (separation of duties)
  if (report.reviewerId === user.id && user.role !== "ADMIN") {
    throw new ComplianceError(
      400,
      "ผู้ตรวจไม่สามารถอนุมัติรายงานที่ตนตรวจได้ — ต้องคนอื่น"
    );
  }
  const now = new Date();
  await prisma.complianceReport.update({
    where: { id: reportId },
    data: {
      status: "APPROVED",
      approverId: user.id,
      approvedAt: now,
      approverSignature: input.signatureData,
      signatureCertRef: input.certificateRef ?? null,
      signatureIp: input.ipAddress ?? null,
      signatureUa: input.userAgent ?? null,
      externallySubmittedAt: now,
    },
  });
  await prisma.auditLog.create({
    data: {
      userId: user.id,
      action: "compliance.report.approve",
      target: `complianceReport:${reportId}`,
      details: {
        signatureLength: input.signatureData.length,
        ipAddress: input.ipAddress,
      },
    },
  });
}

export async function deleteReport(reportId: string, user: AuthUser) {
  if (user.role !== "ADMIN") {
    throw new ComplianceError(403, "เฉพาะ ADMIN ลบรายงานได้");
  }
  const report = await prisma.complianceReport.findUnique({
    where: { id: reportId },
    select: { id: true, status: true },
  });
  if (!report) throw new ComplianceError(404, "ไม่พบรายงาน");
  if (report.status === "APPROVED") {
    throw new ComplianceError(400, "รายงานอนุมัติแล้ว ลบไม่ได้");
  }
  await prisma.$transaction([
    prisma.complianceAnswer.deleteMany({ where: { reportId } }),
    prisma.complianceScoreLog.deleteMany({ where: { reportId } }),
    prisma.complianceReport.delete({ where: { id: reportId } }),
    prisma.auditLog.create({
      data: {
        userId: user.id,
        action: "compliance.report.delete",
        target: `complianceReport:${reportId}`,
      },
    }),
  ]);
}
