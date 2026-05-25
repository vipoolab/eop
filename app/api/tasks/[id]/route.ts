// GET /api/tasks/[id] — single task status + result

import { NextRequest, NextResponse } from "next/server";
import { getTask } from "@/lib/tasks/store";

export const dynamic = "force-dynamic";

export async function GET(
  _: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const task = getTask(id);
  if (!task) {
    return NextResponse.json({ success: false, message: "ไม่พบงาน" }, { status: 404 });
  }
  return NextResponse.json({ success: true, data: task });
}
