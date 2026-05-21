// /api/reports/aar — POST create + GET list

import { NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

const schema = z.object({
  missionId: z.string().nullable().optional(),
  incidentId: z.string().nullable().optional(),
  commandId: z.string().nullable().optional(),
  whatWorked: z.string().min(5).max(5000),
  whatDidNot: z.string().min(5).max(5000),
  lessonsLearned: z.string().min(5).max(5000),
  recommendations: z.array(z.string()).default([]),
  participants: z.array(z.string()).default([]),
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

  const created = await prisma.afterActionReview.create({
    data: {
      reviewDate: new Date(),
      missionId: parsed.data.missionId ?? null,
      incidentId: parsed.data.incidentId ?? null,
      commandId: parsed.data.commandId ?? null,
      whatWorked: parsed.data.whatWorked,
      whatDidNot: parsed.data.whatDidNot,
      lessonsLearned: parsed.data.lessonsLearned,
      recommendations: parsed.data.recommendations,
      participants: parsed.data.participants,
      facilitatorId: session.user.id,
    },
  });

  await prisma.auditLog.create({
    data: {
      userId: session.user.id,
      action: "aar.create",
      target: `afterActionReview:${created.id}`,
      details: { missionId: parsed.data.missionId, recommendationCount: parsed.data.recommendations.length },
    },
  });

  return NextResponse.json({ success: true, data: created });
}

export async function GET() {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ success: false, message: "กรุณาเข้าสู่ระบบ" }, { status: 401 });
  }
  const items = await prisma.afterActionReview.findMany({
    orderBy: { reviewDate: "desc" },
    take: 50,
    include: { facilitator: { select: { name: true, rank: true } } },
  });
  return NextResponse.json({ success: true, data: items });
}
