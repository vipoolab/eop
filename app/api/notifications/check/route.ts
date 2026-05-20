// POST /api/notifications/check — Run auto-escalation scan
// Production: trigger via cron (every 15 min) or external job runner

import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { runEscalationCheck } from "@/features/notifications/service";

export async function POST() {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json(
      { success: false, message: "ต้องเข้าสู่ระบบก่อน" },
      { status: 401 }
    );
  }

  if (!["ADMIN", "COMMANDER"].includes(session.user.role)) {
    return NextResponse.json(
      { success: false, message: "เฉพาะ ADMIN/COMMANDER เท่านั้น" },
      { status: 403 }
    );
  }

  try {
    const result = await runEscalationCheck();
    return NextResponse.json({ success: true, data: result });
  } catch (err) {
    console.error("Escalation check failed:", err);
    return NextResponse.json(
      { success: false, message: err instanceof Error ? err.message : "Error" },
      { status: 500 }
    );
  }
}
