// /api/ai/draft — AI Command Drafting (TOR PoC #1)
// POST: รับข้อมูลฟอร์ม → ส่งให้ Claude → return draft + audit log

import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { draftCommandSchema } from "@/features/ai/validators";
import { generateCommandDraft } from "@/features/ai/command-draft";

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json(
      { success: false, message: "ต้องเข้าสู่ระบบก่อน" },
      { status: 401 }
    );
  }

  // RBAC: STAFF ขึ้นไป (สร้างคำสั่งได้ก็ใช้ AI ร่างได้)
  if (!["ADMIN", "COMMANDER", "STAFF"].includes(session.user.role)) {
    return NextResponse.json(
      { success: false, message: "คุณไม่มีสิทธิ์ใช้ AI ร่างคำสั่ง" },
      { status: 403 }
    );
  }

  const body = await req.json().catch(() => null);
  const parsed = draftCommandSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      {
        success: false,
        message: "ข้อมูลไม่ถูกต้อง",
        errors: parsed.error.issues.map((i) => ({
          field: i.path.join("."),
          message: i.message,
        })),
      },
      { status: 400 }
    );
  }

  try {
    const t0 = Date.now();
    const draft = await generateCommandDraft(parsed.data);
    const elapsedMs = Date.now() - t0;

    // Audit log — TOR 7.1.5
    await prisma.auditLog.create({
      data: {
        userId: session.user.id,
        action: "ai.command.draft",
        target: "claude:" + draft.model,
        details: {
          subject: parsed.data.subject,
          priority: parsed.data.priority,
          tokensUsed: draft.tokensUsed,
          elapsedMs,
        },
      },
    });

    return NextResponse.json({
      success: true,
      data: {
        ...draft,
        promptUsed: parsed.data,
        elapsedMs,
      },
    });
  } catch (err) {
    console.error("AI draft failed:", err);
    const message =
      err instanceof Error ? err.message : "เรียก AI ไม่สำเร็จ";
    return NextResponse.json(
      { success: false, message },
      { status: 500 }
    );
  }
}
