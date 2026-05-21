// /api/incidents/[id] — GET / PATCH (update)

import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { updateIncidentSchema } from "@/features/incidents/validators";
import { updateIncident, IncidentError } from "@/features/incidents/service";

type Role = "ADMIN" | "COMMANDER" | "STAFF" | "AUDITOR" | "VIEWER";

export async function GET(_: Request, ctx: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ success: false, message: "กรุณาเข้าสู่ระบบ" }, { status: 401 });
  }
  const { id } = await ctx.params;
  const inc = await prisma.incident.findUnique({
    where: { id },
    include: {
      assignedUnit: true,
      respondedBy: { select: { id: true, name: true, rank: true } },
      mission: { select: { id: true, code: true, title: true } },
      command: { select: { id: true, docNo: true, subject: true } },
      externalSystem: { select: { code: true, name: true } },
      afterActionReviews: {
        orderBy: { reviewDate: "desc" },
        select: { id: true, reviewDate: true, whatWorked: true, whatDidNot: true, lessonsLearned: true },
      },
    },
  });
  if (!inc) {
    return NextResponse.json({ success: false, message: "ไม่พบ" }, { status: 404 });
  }
  return NextResponse.json({ success: true, data: inc });
}

export async function PATCH(req: Request, ctx: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ success: false, message: "กรุณาเข้าสู่ระบบ" }, { status: 401 });
  }
  const { id } = await ctx.params;
  const body = await req.json().catch(() => null);
  const parsed = updateIncidentSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { success: false, message: parsed.error.issues[0]?.message ?? "ข้อมูลไม่ถูกต้อง" },
      { status: 400 }
    );
  }
  try {
    const inc = await updateIncident(id, parsed.data, {
      id: session.user.id,
      role: session.user.role as Role,
    });
    return NextResponse.json({ success: true, data: inc });
  } catch (err) {
    if (err instanceof IncidentError) {
      return NextResponse.json({ success: false, message: err.message }, { status: err.status });
    }
    return NextResponse.json({ success: false, message: "อัปเดตไม่สำเร็จ" }, { status: 500 });
  }
}
