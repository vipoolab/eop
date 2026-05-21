// /api/reports/sitrep — POST create + GET list

import { NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

const schema = z.object({
  frequency: z.enum(["DAILY", "WEEKLY", "MONTHLY", "QUARTERLY", "YEARLY"]),
  unitId: z.string().nullable().optional(),
  summary: z.string().min(10).max(10000),
  keyEvents: z.array(z.any()).default([]),
  metrics: z.record(z.string(), z.any()).default({}),
});

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ success: false, message: "กรุณาเข้าสู่ระบบ" }, { status: 401 });
  }
  if (!["ADMIN", "COMMANDER"].includes(session.user.role)) {
    return NextResponse.json({ success: false, message: "ไม่มีสิทธิ์" }, { status: 403 });
  }
  const body = await req.json().catch(() => null);
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { success: false, message: parsed.error.issues[0]?.message ?? "ข้อมูลไม่ถูกต้อง" },
      { status: 400 }
    );
  }

  // Auto-generate reportNo: SITREP-YYYYMMDD-NNN
  const today = new Date();
  const yyyymmdd =
    today.getFullYear().toString() +
    String(today.getMonth() + 1).padStart(2, "0") +
    String(today.getDate()).padStart(2, "0");
  const todayCount = await prisma.situationReport.count({
    where: { reportDate: { gte: new Date(today.setHours(0, 0, 0, 0)) } },
  });
  const reportNo = `SITREP-${yyyymmdd}-${String(todayCount + 1).padStart(3, "0")}`;

  const created = await prisma.situationReport.create({
    data: {
      reportNo,
      frequency: parsed.data.frequency,
      reportDate: new Date(),
      unitId: parsed.data.unitId ?? null,
      status: "submitted",
      summary: parsed.data.summary,
      keyEvents: parsed.data.keyEvents,
      metrics: parsed.data.metrics,
      createdById: session.user.id,
    },
  });

  await prisma.auditLog.create({
    data: {
      userId: session.user.id,
      action: "sitrep.create",
      target: `situationReport:${created.id}`,
      details: { reportNo, frequency: parsed.data.frequency },
    },
  });

  return NextResponse.json({ success: true, data: created });
}

export async function GET() {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ success: false, message: "กรุณาเข้าสู่ระบบ" }, { status: 401 });
  }
  const items = await prisma.situationReport.findMany({
    orderBy: { reportDate: "desc" },
    take: 50,
    include: { createdBy: { select: { name: true, rank: true } } },
  });
  return NextResponse.json({ success: true, data: items });
}
