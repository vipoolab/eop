// POST /api/assessments/[id]/publish — transition DRAFT → PUBLISHED

import { NextRequest, NextResponse } from "next/server";
import { getAssessment, updateAssessment } from "@/lib/assessments/store";

export const dynamic = "force-dynamic";

export async function POST(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const assessment = getAssessment(id);

  if (!assessment) {
    return NextResponse.json({ success: false, error: "ไม่พบแบบประเมิน" }, { status: 404 });
  }

  if (assessment.status !== "DRAFT") {
    return NextResponse.json(
      { success: false, error: "สามารถเผยแพร่ได้เฉพาะแบบประเมินที่มีสถานะ DRAFT เท่านั้น" },
      { status: 400 }
    );
  }

  const updated = updateAssessment(id, {
    status: "PUBLISHED",
    publishedAt: new Date().toISOString(),
  });

  if (!updated) {
    return NextResponse.json({ success: false, error: "อัปเดตไม่สำเร็จ" }, { status: 500 });
  }

  return NextResponse.json({ success: true, data: updated });
}
