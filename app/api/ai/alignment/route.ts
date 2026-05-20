// POST /api/ai/alignment — AI Strategic Plan Alignment Check
// TOR 1.1.1 NLP + 1.2.1 Draft Recommendation

import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { analyzeAlignment } from "@/features/ai/strategic-alignment";

export const maxDuration = 60;

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json(
      { success: false, message: "ต้องเข้าสู่ระบบก่อน" },
      { status: 401 }
    );
  }

  if (!["ADMIN", "COMMANDER", "STAFF"].includes(session.user.role)) {
    return NextResponse.json(
      { success: false, message: "คุณไม่มีสิทธิ์ใช้ฟีเจอร์นี้" },
      { status: 403 }
    );
  }

  const body = await req.json().catch(() => null);
  const childPlanId = body?.childPlanId as string | undefined;

  if (!childPlanId) {
    return NextResponse.json(
      { success: false, message: "ต้องระบุ childPlanId" },
      { status: 400 }
    );
  }

  const child = await prisma.strategicPlan.findUnique({
    where: { id: childPlanId },
  });

  if (!child || !child.parentId) {
    return NextResponse.json(
      { success: false, message: "ไม่พบแผน หรือเป็นแผนระดับสูงสุด" },
      { status: 404 }
    );
  }

  const parent = await prisma.strategicPlan.findUnique({
    where: { id: child.parentId },
  });

  if (!parent) {
    return NextResponse.json(
      { success: false, message: "ไม่พบแผนระดับบน" },
      { status: 404 }
    );
  }

  try {
    const result = await analyzeAlignment({
      parent: { code: parent.code, title: parent.title, description: parent.description },
      child: { code: child.code, title: child.title, description: child.description },
    });

    await prisma.auditLog.create({
      data: {
        userId: session.user.id,
        action: "ai.alignment.check",
        target: `plan:${childPlanId}`,
        details: {
          parentCode: parent.code,
          childCode: child.code,
          score: result.score,
          tokensUsed: result.tokensUsed,
          elapsedMs: result.elapsedMs,
        },
      },
    });

    return NextResponse.json({ success: true, data: result });
  } catch (err) {
    console.error("Alignment check failed:", err);
    return NextResponse.json(
      { success: false, message: err instanceof Error ? err.message : "Error" },
      { status: 500 }
    );
  }
}
