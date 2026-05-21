// POST /api/reports/exec-summary — generate AI executive summary
// GET — list

import { NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { generateExecSummary } from "@/features/reports/exec-summary";

const schema = z.object({
  scope: z.enum(["NATIONAL", "REGION", "UNIT"]),
  period: z.string().min(1).max(50),
  unitId: z.string().nullable().optional(),
});

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json(
      { success: false, message: "กรุณาเข้าสู่ระบบ" },
      { status: 401 }
    );
  }
  if (!["ADMIN", "COMMANDER", "AUDITOR"].includes(session.user.role)) {
    return NextResponse.json(
      { success: false, message: "ไม่มีสิทธิ์" },
      { status: 403 }
    );
  }
  const body = await req.json().catch(() => null);
  const parsed = schema.safeParse(body);
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
    const result = await generateExecSummary({
      scope: parsed.data.scope,
      period: parsed.data.period,
      unitId: parsed.data.unitId ?? null,
    });

    const saved = await prisma.executiveSummary.create({
      data: {
        period: parsed.data.period,
        scope: parsed.data.scope,
        unitId: parsed.data.unitId ?? null,
        title: result.title,
        summaryText: result.summaryText,
        keyMetrics: result.keyMetrics,
        concerns: result.concerns,
        recommendations: result.recommendations,
        model: result.model,
        tokensUsed: result.tokensUsed,
        generatedById: session.user.id,
      },
    });

    await prisma.auditLog.create({
      data: {
        userId: session.user.id,
        action: "exec-summary.generate",
        target: `executiveSummary:${saved.id}`,
        details: {
          scope: parsed.data.scope,
          period: parsed.data.period,
          tokens: result.tokensUsed,
          elapsedMs: result.elapsedMs,
        },
      },
    });

    return NextResponse.json({ success: true, data: saved });
  } catch (err) {
    console.error(err);
    return NextResponse.json(
      {
        success: false,
        message: err instanceof Error ? err.message : "สร้างสรุปไม่สำเร็จ",
      },
      { status: 500 }
    );
  }
}

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json(
      { success: false, message: "กรุณาเข้าสู่ระบบ" },
      { status: 401 }
    );
  }
  const items = await prisma.executiveSummary.findMany({
    orderBy: { generatedAt: "desc" },
    take: 50,
  });
  return NextResponse.json({ success: true, data: items });
}
