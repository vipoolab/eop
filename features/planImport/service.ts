// Plan Import Service — RBAC + Persist + Audit
// TOR 5.4.1 ๑.๑.๒ + ๑.๒.๓(๑)

import { prisma } from "@/lib/prisma";
import { detectFormat, extractText, type ImportFormat } from "./parser";
import {
  extractPlansFromText,
  type ExtractedPlan,
} from "./ai-extractor";

type Role = "ADMIN" | "COMMANDER" | "STAFF" | "AUDITOR" | "VIEWER";

interface AuthUser {
  id: string;
  role: Role;
}

export class ImportError extends Error {
  constructor(public status: number, message: string) {
    super(message);
    this.name = "ImportError";
  }
}

// ─────────────────────────────────────────────
// Stage 1: Upload + Extract + AI parse → return preview
// ─────────────────────────────────────────────

export async function uploadAndExtract(
  file: { name: string; mimeType: string; buffer: Buffer },
  user: AuthUser
) {
  if (!["ADMIN", "COMMANDER"].includes(user.role)) {
    throw new ImportError(
      403,
      "เฉพาะ ADMIN / COMMANDER เท่านั้นที่นำเข้าแผนได้"
    );
  }

  let format: ImportFormat;
  try {
    format = detectFormat(file.name, file.mimeType);
  } catch (e) {
    throw new ImportError(
      400,
      e instanceof Error ? e.message : "ไฟล์ไม่รองรับ"
    );
  }

  // 1) Create PENDING record
  const importJob = await prisma.planImport.create({
    data: {
      sourceFile: file.name,
      sourceFormat: format,
      importedById: user.id,
      status: "PENDING",
    },
  });

  await prisma.auditLog.create({
    data: {
      userId: user.id,
      action: "plan.import.upload",
      target: `planImport:${importJob.id}`,
      details: { filename: file.name, format },
    },
  });

  // 2) Extract text + AI parse
  let extractedText: string;
  try {
    extractedText = await extractText(file.buffer, format);
  } catch (e) {
    await prisma.planImport.update({
      where: { id: importJob.id },
      data: {
        status: "FAILED",
        errorLog: e instanceof Error ? e.message : "Text extraction failed",
        finishedAt: new Date(),
      },
    });
    throw new ImportError(400, "ไม่สามารถอ่านเนื้อหาไฟล์ได้");
  }

  if (!extractedText || extractedText.length < 50) {
    await prisma.planImport.update({
      where: { id: importJob.id },
      data: {
        status: "FAILED",
        errorLog: `Extracted text too short (${extractedText.length} chars)`,
        finishedAt: new Date(),
      },
    });
    throw new ImportError(400, "ไฟล์มีเนื้อหาน้อยเกินไป (อาจเป็น scan-PDF)");
  }

  await prisma.planImport.update({
    where: { id: importJob.id },
    data: { status: "PROCESSING" },
  });

  let aiResult;
  try {
    aiResult = await extractPlansFromText(extractedText);
  } catch (e) {
    await prisma.planImport.update({
      where: { id: importJob.id },
      data: {
        status: "FAILED",
        errorLog: e instanceof Error ? e.message : "AI extraction failed",
        finishedAt: new Date(),
      },
    });
    throw new ImportError(500, "AI วิเคราะห์เอกสารไม่สำเร็จ");
  }

  // 3) Audit AI call
  await prisma.aiModelRun.create({
    data: {
      purpose: "DOC_CLASSIFY", // ใช้ enum ที่มีอยู่ — Plan extraction = doc classification
      model: aiResult.model,
      inputSummary: `Plan import: ${file.name} (${extractedText.length} chars)`,
      outputSummary: `Extracted ${aiResult.plans.length} plan(s)`,
      tokensInput: 0,
      tokensOutput: aiResult.tokensUsed,
      elapsedMs: aiResult.elapsedMs,
      success: true,
      referenceType: "PlanImport",
      referenceId: importJob.id,
      createdById: user.id,
    },
  });

  return {
    importId: importJob.id,
    plans: aiResult.plans,
    extractedTextPreview: extractedText.slice(0, 800),
    model: aiResult.model,
    tokensUsed: aiResult.tokensUsed,
    elapsedMs: aiResult.elapsedMs,
  };
}

// ─────────────────────────────────────────────
// Stage 2: User confirms — persist as StrategicPlan
// ─────────────────────────────────────────────

export async function confirmImport(
  importId: string,
  plans: ExtractedPlan[],
  user: AuthUser
) {
  if (!["ADMIN", "COMMANDER"].includes(user.role)) {
    throw new ImportError(403, "ไม่มีสิทธิ์ยืนยันการนำเข้า");
  }

  const importJob = await prisma.planImport.findUnique({
    where: { id: importId },
  });
  if (!importJob) throw new ImportError(404, "ไม่พบ Import job");
  if (importJob.status === "SUCCESS") {
    throw new ImportError(400, "งานนี้ยืนยันไปแล้ว");
  }

  // De-dup codes
  const existingCodes = new Set(
    (
      await prisma.strategicPlan.findMany({
        where: { code: { in: plans.map((p) => p.code) } },
        select: { code: true },
      })
    ).map((p) => p.code)
  );

  const created: { id: string; code: string; title: string }[] = [];
  const skipped: { code: string; reason: string }[] = [];

  // Two passes: first create plans, then KPIs (so KPI knows planId)
  for (const ext of plans) {
    if (existingCodes.has(ext.code)) {
      skipped.push({ code: ext.code, reason: "code ซ้ำ" });
      continue;
    }

    const plan = await prisma.strategicPlan.create({
      data: {
        level: ext.level,
        code: ext.code,
        title: ext.title,
        description: ext.description,
        policyIntent: ext.policyIntent,
        source: "IMPORTED",
        status: "DRAFT",
        importId: importJob.id,
        createdById: user.id,
      },
    });
    created.push({ id: plan.id, code: plan.code, title: plan.title });

    // KPIs
    for (const k of ext.kpis ?? []) {
      const kpiCode = k.code || `KPI-${plan.code}-${Date.now() % 10000}`;
      const target = k.target ?? 0;
      try {
        await prisma.kpi.create({
          data: {
            planId: plan.id,
            code: kpiCode,
            name: k.name,
            target,
            actual: 0,
            unit: k.unit,
            measurementType: "QUANTITATIVE",
            status: "yellow",
          },
        });
      } catch {
        // KPI dup — ignore
      }
    }
  }

  await prisma.planImport.update({
    where: { id: importJob.id },
    data: {
      status: skipped.length === plans.length ? "FAILED" : "SUCCESS",
      recordsImported: created.length,
      errorLog: skipped.length > 0 ? JSON.stringify(skipped) : null,
      finishedAt: new Date(),
    },
  });

  await prisma.auditLog.create({
    data: {
      userId: user.id,
      action: "plan.import.confirm",
      target: `planImport:${importJob.id}`,
      details: { created: created.length, skipped: skipped.length },
    },
  });

  return { created, skipped, importId: importJob.id };
}

// ─────────────────────────────────────────────
// History — list past imports
// ─────────────────────────────────────────────

export async function listImports(user: AuthUser) {
  if (!["ADMIN", "COMMANDER", "AUDITOR"].includes(user.role)) {
    throw new ImportError(403, "ไม่มีสิทธิ์ดู");
  }
  return prisma.planImport.findMany({
    orderBy: { createdAt: "desc" },
    take: 30,
    include: {
      importedBy: { select: { id: true, name: true, rank: true } },
      _count: { select: { plans: true } },
    },
  });
}
