// POST /api/assessments/[id]/submit — unit submits their assessment response

import { NextRequest, NextResponse } from "next/server";
import { getAssessment, addSubmission, genSubmissionId } from "@/lib/assessments/store";
import type { AssessmentSubmission } from "@/lib/assessments/types";

export const dynamic = "force-dynamic";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const assessment = getAssessment(id);

  if (!assessment) {
    return NextResponse.json({ success: false, error: "ไม่พบแบบประเมิน" }, { status: 404 });
  }

  if (assessment.status !== "PUBLISHED") {
    return NextResponse.json(
      { success: false, error: "ไม่สามารถส่งได้ — แบบประเมินนี้ไม่ได้เผยแพร่หรือปิดรับแล้ว" },
      { status: 400 }
    );
  }

  const body = await req.json();
  const { unitId, unitName, submittedBy, submittedByName, submittedByTitle, fileName, notes } = body;

  if (!unitId || !submittedBy) {
    return NextResponse.json(
      { success: false, error: "unitId and submittedBy are required" },
      { status: 400 }
    );
  }

  // Check if unit is a target
  if (!assessment.targetUnitIds.includes(unitId)) {
    return NextResponse.json(
      { success: false, error: "หน่วยของท่านไม่ได้อยู่ในรายการหน่วยที่ต้องส่งแบบประเมินนี้" },
      { status: 400 }
    );
  }

  // Check for duplicate (non-returned) submission
  const existing = assessment.submissions.find(
    (s) => s.unitId === unitId && (s.status === "SUBMITTED" || s.status === "REVIEWED")
  );
  if (existing) {
    return NextResponse.json(
      { success: false, error: "หน่วยของท่านได้ส่งแบบประเมินนี้แล้ว" },
      { status: 409 }
    );
  }

  const submission: AssessmentSubmission = {
    id: genSubmissionId(),
    unitId,
    unitName: unitName ?? unitId,
    submittedAt: new Date().toISOString(),
    submittedBy,
    submittedByName: submittedByName ?? submittedBy,
    submittedByTitle: submittedByTitle ?? "",
    fileName,
    notes,
    status: "SUBMITTED",
  };

  const updated = addSubmission(id, submission);
  if (!updated) {
    return NextResponse.json({ success: false, error: "บันทึกไม่สำเร็จ" }, { status: 500 });
  }

  return NextResponse.json({ success: true, data: updated }, { status: 201 });
}
