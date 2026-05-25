// POST /api/assessments/[id]/review — admin reviews a submission

import { NextRequest, NextResponse } from "next/server";
import { getAssessment, updateSubmission } from "@/lib/assessments/store";

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

  const body = await req.json();
  const { submissionId, status, reviewNote, reviewedByName } = body;

  if (!submissionId || !status) {
    return NextResponse.json(
      { success: false, error: "submissionId and status are required" },
      { status: 400 }
    );
  }

  if (status !== "REVIEWED" && status !== "RETURNED") {
    return NextResponse.json(
      { success: false, error: "status ต้องเป็น REVIEWED หรือ RETURNED เท่านั้น" },
      { status: 400 }
    );
  }

  const sub = assessment.submissions.find((s) => s.id === submissionId);
  if (!sub) {
    return NextResponse.json({ success: false, error: "ไม่พบการส่งแบบประเมิน" }, { status: 404 });
  }

  if (sub.status !== "SUBMITTED") {
    return NextResponse.json(
      { success: false, error: "สามารถตรวจสอบได้เฉพาะการส่งที่มีสถานะ SUBMITTED" },
      { status: 400 }
    );
  }

  const updated = updateSubmission(id, submissionId, {
    status,
    reviewNote,
    reviewedAt: new Date().toISOString(),
    reviewedByName,
  });

  if (!updated) {
    return NextResponse.json({ success: false, error: "อัปเดตไม่สำเร็จ" }, { status: 500 });
  }

  return NextResponse.json({ success: true, data: updated });
}
