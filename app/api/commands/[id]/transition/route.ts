// /api/commands/[id]/transition — POST state transition
// TOR 4.1 — 9-state workflow

import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { transitionSchema } from "@/features/commands/validators";
import { transitionCommand, ServiceError } from "@/features/commands/service";

export async function POST(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json(
      { success: false, message: "ต้องเข้าสู่ระบบก่อน" },
      { status: 401 }
    );
  }

  const { id } = await context.params;
  const body = await req.json().catch(() => null);
  const parsed = transitionSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      {
        success: false,
        message: "ข้อมูลไม่ถูกต้อง",
        errors: parsed.error.issues,
      },
      { status: 400 }
    );
  }

  try {
    const command = await transitionCommand(id, parsed.data, {
      id: session.user.id,
      role: session.user.role,
      name: session.user.name || "Unknown",
    });

    return NextResponse.json({ success: true, data: command });
  } catch (err) {
    if (err instanceof ServiceError) {
      return NextResponse.json(
        { success: false, message: err.message },
        { status: err.status }
      );
    }
    console.error("Failed to transition command:", err);
    return NextResponse.json(
      { success: false, message: "เกิดข้อผิดพลาดในระบบ" },
      { status: 500 }
    );
  }
}
