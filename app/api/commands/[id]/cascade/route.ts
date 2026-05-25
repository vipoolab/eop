// POST /api/commands/[id]/cascade
// Delegate from a parent unit to selected sub-units
// Body: { parentUnitId, assignments: [{ unitId, priority, customDirective? }] }

import { NextRequest, NextResponse } from "next/server";
import { getCommand, updateCommand } from "@/lib/commands/store";
import type {
  Command,
  StatusLogEntry,
  NotificationLog,
} from "@/lib/commands/types";
import { getActivePersona, getUnit } from "@/lib/police-org/store";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

interface CascadeAssignment {
  unitId: string;
  priority: "NORMAL" | "URGENT";
  customDirective?: string;
}

interface Body {
  parentUnitId: string;
  assignments: CascadeAssignment[];
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const cmd = getCommand(id);
  if (!cmd) {
    return NextResponse.json({ success: false, message: "ไม่พบคำสั่ง" }, { status: 404 });
  }

  const body = (await req.json()) as Body;
  if (!body.parentUnitId || !Array.isArray(body.assignments)) {
    return NextResponse.json(
      { success: false, message: "ต้องระบุ parentUnitId และ assignments" },
      { status: 400 }
    );
  }
  if (body.assignments.length === 0) {
    return NextResponse.json(
      { success: false, message: "ต้องเลือกหน่วยรองอย่างน้อย ๑ หน่วย" },
      { status: 400 }
    );
  }

  const persona = getActivePersona();
  const parentUnit = getUnit(body.parentUnitId);

  // Update unitProgress: parent → ACKNOWLEDGED (if not already), selected sub-units stay PENDING
  // but we add a per-unit notification
  const now = new Date().toISOString();

  const newUnitProgress = cmd.unitProgress.map((up) => {
    if (up.unitId === body.parentUnitId && up.status === "PENDING") {
      return {
        ...up,
        status: "ACKNOWLEDGED" as const,
        acknowledgedAt: now,
        acknowledgedBy: persona.id,
        acknowledgedByName: persona.name,
      };
    }
    return up;
  });

  // Add notifications for each assigned sub-unit
  const newNotifications: NotificationLog[] = body.assignments.map((a, idx) => {
    const subUnit = getUnit(a.unitId);
    const channel: "EMAIL" | "LINE" | "SMS" = a.priority === "URGENT" ? "LINE" : "EMAIL";
    return {
      id: `notif-cascade-${Date.now()}-${idx}`,
      channel,
      recipient: subUnit?.commanderTitle ?? subUnit?.name ?? a.unitId,
      recipientId: a.unitId,
      sentAt: now,
      status: "SENT" as const,
      message: a.customDirective
        ? `[จาก ${parentUnit?.shortName ?? "หน่วยเหนือ"}] ${a.customDirective}`
        : `[จาก ${parentUnit?.shortName ?? "หน่วยเหนือ"}] กรุณารับทราบและดำเนินการตามคำสั่ง`,
    };
  });

  // Audit log entry
  const log: StatusLogEntry = {
    timestamp: now,
    fromStatus: cmd.status,
    toStatus: cmd.status,
    byPersonaId: persona.id,
    byName: persona.name,
    byTitle: persona.role,
    note: `รับทราบและมอบหมาย ${body.assignments.length} หน่วยรอง: ${body.assignments
      .map((a) => getUnit(a.unitId)?.shortName ?? a.unitId)
      .join(", ")}${
      body.assignments.some((a) => a.priority === "URGENT")
        ? ` (${body.assignments.filter((a) => a.priority === "URGENT").length} หน่วยด่วน)`
        : ""
    }`,
  };

  const patch: Partial<Command> = {
    unitProgress: newUnitProgress,
    notifications: [...cmd.notifications, ...newNotifications],
    statusLog: [...cmd.statusLog, log],
  };

  const updated = updateCommand(id, patch);
  if (!updated) {
    return NextResponse.json(
      { success: false, message: "อัปเดตล้มเหลว" },
      { status: 500 }
    );
  }

  return NextResponse.json({
    success: true,
    data: {
      command: updated,
      cascaded: body.assignments.length,
      notifications: newNotifications.length,
    },
  });
}
