// GET /api/assessments/[id] — get assessment detail
// PUT /api/assessments/[id] — update assessment

import { NextRequest, NextResponse } from "next/server";
import { getAssessment, updateAssessment } from "@/lib/assessments/store";

export const dynamic = "force-dynamic";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const assessment = getAssessment(id);
  if (!assessment) {
    return NextResponse.json({ success: false, error: "ไม่พบแบบประเมิน" }, { status: 404 });
  }
  return NextResponse.json({ success: true, data: assessment });
}

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const body = await req.json();

  const assessment = getAssessment(id);
  if (!assessment) {
    return NextResponse.json({ success: false, error: "ไม่พบแบบประเมิน" }, { status: 404 });
  }

  const updated = updateAssessment(id, body);
  if (!updated) {
    return NextResponse.json({ success: false, error: "อัปเดตไม่สำเร็จ" }, { status: 500 });
  }
  return NextResponse.json({ success: true, data: updated });
}
