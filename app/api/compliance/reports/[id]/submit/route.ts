// POST /api/compliance/reports/[id]/submit — Staff submits report for review

import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { submitReport, ComplianceError } from "@/features/compliance/service";

export async function POST(
  _req: Request,
  ctx: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json(
      { success: false, message: "กรุณาเข้าสู่ระบบ" },
      { status: 401 }
    );
  }
  const { id } = await ctx.params;
  try {
    await submitReport(id, {
      id: session.user.id,
      role: session.user.role as
        | "ADMIN"
        | "COMMANDER"
        | "STAFF"
        | "AUDITOR"
        | "VIEWER",
    });
    return NextResponse.json({ success: true });
  } catch (err) {
    if (err instanceof ComplianceError) {
      return NextResponse.json(
        { success: false, message: err.message },
        { status: err.status }
      );
    }
    return NextResponse.json(
      { success: false, message: "ส่งไม่สำเร็จ" },
      { status: 500 }
    );
  }
}
