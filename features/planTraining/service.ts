// Plan Training Service — RBAC + Persist
// TOR 5.4.1 ๑.๑.๑ AI Feature: NLP เรียนรู้บริบทแผน

import { prisma } from "@/lib/prisma";
import {
  learnPlanContext,
  serializeInsights,
  parseInsights,
  type TrainedInsights,
} from "./ai-train";

type Role = "ADMIN" | "COMMANDER" | "STAFF" | "AUDITOR" | "VIEWER";

interface AuthUser {
  id: string;
  role: Role;
}

export class TrainingError extends Error {
  constructor(public status: number, message: string) {
    super(message);
    this.name = "TrainingError";
  }
}

/** Use AiTrainingDocument with purpose=ALIGNMENT + label='plan:<id>' as a per-plan store */
const PLAN_LABEL_PREFIX = "plan:";

export async function trainPlan(planId: string, user: AuthUser) {
  if (!["ADMIN", "COMMANDER"].includes(user.role)) {
    throw new TrainingError(
      403,
      "เฉพาะ ADMIN / COMMANDER เท่านั้นที่ฝึก AI ได้"
    );
  }

  const plan = await prisma.strategicPlan.findUnique({
    where: { id: planId },
    select: {
      id: true,
      level: true,
      code: true,
      title: true,
      description: true,
      policyIntent: true,
      parent: { select: { title: true } },
      kpis: {
        select: { code: true, name: true, target: true, unit: true },
        take: 10,
      },
    },
  });
  if (!plan) throw new TrainingError(404, "ไม่พบแผน");

  const kpiSummaries = plan.kpis.map(
    (k) => `${k.code} · ${k.name} (เป้า ${k.target}${k.unit ? " " + k.unit : ""})`
  );

  const result = await learnPlanContext({
    level: plan.level,
    code: plan.code,
    title: plan.title,
    description: plan.description,
    policyIntent: plan.policyIntent,
    parentTitle: plan.parent?.title ?? null,
    kpiSummaries,
  });

  const insights: TrainedInsights = {
    summary: result.summary,
    keyConcepts: result.keyConcepts,
    themes: result.themes,
    targetOutcomes: result.targetOutcomes,
    relatedDomains: result.relatedDomains,
  };

  const content = serializeInsights(insights);
  const label = `${PLAN_LABEL_PREFIX}${planId}`;

  // Replace existing training doc for this plan (if any)
  await prisma.aiTrainingDocument.deleteMany({
    where: { purpose: "ALIGNMENT", label },
  });

  const trainingDoc = await prisma.aiTrainingDocument.create({
    data: {
      purpose: "ALIGNMENT",
      content,
      label,
      addedById: user.id,
      validated: true,
    },
  });

  await prisma.aiModelRun.create({
    data: {
      purpose: "ALIGNMENT",
      model: result.model,
      inputSummary: `Train plan ${plan.code}`,
      outputSummary: `${insights.keyConcepts.length} concepts, ${insights.themes.length} themes`,
      tokensInput: 0,
      tokensOutput: result.tokensUsed,
      elapsedMs: result.elapsedMs,
      success: true,
      referenceType: "StrategicPlan",
      referenceId: planId,
      createdById: user.id,
    },
  });

  await prisma.auditLog.create({
    data: {
      userId: user.id,
      action: "plan.train",
      target: `plan:${planId}`,
      details: {
        code: plan.code,
        model: result.model,
        tokensUsed: result.tokensUsed,
      },
    },
  });

  return {
    trainingDocId: trainingDoc.id,
    insights,
    model: result.model,
    tokensUsed: result.tokensUsed,
    elapsedMs: result.elapsedMs,
    trainedAt: trainingDoc.createdAt,
  };
}

export async function getPlanTraining(planId: string) {
  const label = `${PLAN_LABEL_PREFIX}${planId}`;
  const doc = await prisma.aiTrainingDocument.findFirst({
    where: { purpose: "ALIGNMENT", label },
    orderBy: { createdAt: "desc" },
    include: { addedBy: { select: { name: true, rank: true } } },
  });
  if (!doc) return null;
  return {
    id: doc.id,
    insights: parseInsights(doc.content),
    addedBy: doc.addedBy,
    createdAt: doc.createdAt,
  };
}
