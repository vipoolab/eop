import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { closeIncidentSchema } from "@/features/incidents/validators";
import { closeIncident, IncidentError } from "@/features/incidents/service";

type Role = "ADMIN" | "COMMANDER" | "STAFF" | "AUDITOR" | "VIEWER";

export async function POST(req: Request, ctx: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ success: false, message: "กรุณาเข้าสู่ระบบ" }, { status: 401 });
  }
  const { id } = await ctx.params;
  const body = await req.json().catch(() => null);
  const parsed = closeIncidentSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { success: false, message: parsed.error.issues[0]?.message ?? "ต้องระบุการแก้ไข ≥ 5 ตัวอักษร" },
      { status: 400 }
    );
  }
  try {
    await closeIncident(id, parsed.data, { id: session.user.id, role: session.user.role as Role });
    return NextResponse.json({ success: true });
  } catch (err) {
    if (err instanceof IncidentError) {
      return NextResponse.json({ success: false, message: err.message }, { status: err.status });
    }
    return NextResponse.json({ success: false, message: "ปิดคดีไม่สำเร็จ" }, { status: 500 });
  }
}
