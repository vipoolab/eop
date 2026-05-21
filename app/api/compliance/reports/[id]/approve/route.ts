// POST /api/compliance/reports/[id]/approve
// ผบ.หน่วยอนุมัติ + ลงลายเซ็นอิเล็กทรอนิกส์ → ส่งภายนอก

import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { approveSchema } from "@/features/compliance/validators";
import { approveReport, ComplianceError } from "@/features/compliance/service";

type Role = "ADMIN" | "COMMANDER" | "STAFF" | "AUDITOR" | "VIEWER";

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
  const parsed = approveSchema.safeParse(body);
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
    const ipAddress =
      req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ??
      req.headers.get("x-real-ip") ??
      null;
    const userAgent = req.headers.get("user-agent");

    await approveReport(
      id,
      {
        signatureData: parsed.data.signatureData,
        certificateRef: parsed.data.certificateRef ?? null,
        ipAddress,
        userAgent,
      },
      {
        id: session.user.id,
        role: session.user.role as Role,
      }
    );
    return NextResponse.json({ success: true });
  } catch (err) {
    if (err instanceof ComplianceError) {
      return NextResponse.json(
        { success: false, message: err.message },
        { status: err.status }
      );
    }
    return NextResponse.json(
      { success: false, message: "อนุมัติไม่สำเร็จ" },
      { status: 500 }
    );
  }
}
