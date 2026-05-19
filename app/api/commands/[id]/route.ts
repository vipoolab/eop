// /api/commands/[id] — GET single command

import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { findCommandById } from "@/features/commands/repository";

export async function GET(
  _req: NextRequest,
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
  const command = await findCommandById(id);

  if (!command) {
    return NextResponse.json(
      { success: false, message: "ไม่พบคำสั่งนี้" },
      { status: 404 }
    );
  }

  return NextResponse.json({ success: true, data: command });
}
