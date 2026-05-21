// POST /api/analytics/anomaly/[id]/acknowledge

import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function POST(
  _req: Request,
  ctx: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ success: false, message: "กรุณาเข้าสู่ระบบ" }, { status: 401 });
  }
  if (!["ADMIN", "COMMANDER", "AUDITOR"].includes(session.user.role)) {
    return NextResponse.json({ success: false, message: "ไม่มีสิทธิ์" }, { status: 403 });
  }
  const { id } = await ctx.params;

  const updated = await prisma.anomalyAlert.update({
    where: { id },
    data: {
      acknowledgedById: session.user.id,
      acknowledgedAt: new Date(),
      resolved: true,
    },
  });

  await prisma.auditLog.create({
    data: {
      userId: session.user.id,
      action: "anomaly.acknowledge",
      target: `anomalyAlert:${id}`,
      details: { severity: updated.severity, type: updated.anomalyType },
    },
  });

  return NextResponse.json({ success: true });
}
