// GET /api/assessments — list assessments
// POST /api/assessments — create new assessment

import { NextRequest, NextResponse } from "next/server";
import { listAssessments, addAssessment, genAssessmentId } from "@/lib/assessments/store";
import type { Assessment, AssessmentCategory } from "@/lib/assessments/types";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const status = searchParams.get("status") as Assessment["status"] | null;
  const createdBy = searchParams.get("createdBy") ?? undefined;

  const assessments = listAssessments({
    status: status ?? undefined,
    createdBy,
  });
  return NextResponse.json({ success: true, data: assessments });
}

export async function POST(req: NextRequest) {
  const body = await req.json();

  if (!body.title || !body.category || !body.dueDate || !body.effectiveDate) {
    return NextResponse.json(
      { success: false, error: "title, category, dueDate, effectiveDate required" },
      { status: 400 }
    );
  }

  const now = new Date().toISOString();
  const publishImmediately = body.publishImmediately === true;

  const assessment: Assessment = {
    id: genAssessmentId(),
    title: body.title,
    description: body.description ?? "",
    category: body.category as AssessmentCategory,
    instructions: body.instructions ?? "",
    fileName: body.fileName,
    fileType: body.fileType,
    dueDate: body.dueDate,
    effectiveDate: body.effectiveDate,
    targetUnitIds: Array.isArray(body.targetUnitIds) ? body.targetUnitIds : [],
    status: publishImmediately ? "PUBLISHED" : "DRAFT",
    createdBy: body.createdBy ?? "system",
    createdByName: body.createdByName ?? "ผู้ดูแลระบบ",
    createdByTitle: body.createdByTitle ?? "",
    createdAt: now,
    publishedAt: publishImmediately ? now : undefined,
    submissions: [],
  };

  const saved = addAssessment(assessment);
  return NextResponse.json({ success: true, data: saved }, { status: 201 });
}
