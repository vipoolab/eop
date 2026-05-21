// POST /api/compliance/reports/[id]/answers — upsert single answer (auto-save)

import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { upsertAnswerSchema } from "@/features/compliance/validators";
import { upsertAnswer, ComplianceError } from "@/features/compliance/service";

export async function POST(
  req: Request,
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
  const body = await req.json().catch(() => null);
  const parsed = upsertAnswerSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      {
        success: false,
        message: parsed.error.issues[0]?.message ?? "ข้อมูลไม่ถูกต้อง",
      },
      { status: 400 }
    );
  }
  try {
    const a = await upsertAnswer(id, parsed.data, {
      id: session.user.id,
      role: session.user.role as
        | "ADMIN"
        | "COMMANDER"
        | "STAFF"
        | "AUDITOR"
        | "VIEWER",
    });
    return NextResponse.json({ success: true, data: a });
  } catch (err) {
    if (err instanceof ComplianceError) {
      return NextResponse.json(
        { success: false, message: err.message },
        { status: err.status }
      );
    }
    return NextResponse.json(
      { success: false, message: "บันทึกไม่สำเร็จ" },
      { status: 500 }
    );
  }
}
