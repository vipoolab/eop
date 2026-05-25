// POST /api/commands/[id]/units/[unitId]/transition
// Per-unit transitions: acknowledge / start / reopen

import { NextRequest, NextResponse } from "next/server";
import { getCommand, transitionUnit } from "@/lib/commands/store";
import {
  canUnitTransition,
  availableUnitActions,
  type UnitAction,
} from "@/lib/commands/workflow";
import { getActivePersona } from "@/lib/police-org/store";

export const dynamic = "force-dynamic";

interface Body {
  action: UnitAction;
}

export async function POST(
  req: NextRequest,
  ctx: { params: Promise<{ id: string; unitId: string }> }
) {
  const { id, unitId } = await ctx.params;
  const body = (await req.json()) as Body;
  const cmd = getCommand(id);
  if (!cmd) {
    return NextResponse.json({ success: false, message: "ไม่พบคำสั่ง" }, { status: 404 });
  }
  const persona = getActivePersona();

  // Verify the persona is acting on their own unit
  if (persona.unitId !== unitId) {
    return NextResponse.json(
      {
        success: false,
        message: `Persona ปัจจุบัน (${persona.role}) อยู่หน่วยอื่น — เปลี่ยน persona เป็นหัวหน้าหน่วยที่ได้รับคำสั่ง`,
      },
      { status: 403 }
    );
  }

  // Check available actions
  const allowed = availableUnitActions({ command: cmd, persona });
  if (!allowed.includes(body.action)) {
    return NextResponse.json(
      {
        success: false,
        message: `ไม่สามารถ ${body.action} หน่วยนี้ได้ — สถานะปัจจุบันไม่ตรง`,
      },
      { status: 400 }
    );
  }

  const unit = cmd.unitProgress.find((u) => u.unitId === unitId);
  if (!unit) {
    return NextResponse.json({ success: false, message: "หน่วยไม่อยู่ในคำสั่งนี้" }, { status: 404 });
  }

  const toStatus = canUnitTransition(unit.status, body.action);
  if (!toStatus) {
    return NextResponse.json(
      { success: false, message: `ไม่สามารถ ${body.action} จาก ${unit.status} ได้` },
      { status: 400 }
    );
  }

  const result = transitionUnit(id, unitId, toStatus, {
    personaId: persona.id,
    name: persona.name,
    title: persona.role,
  });
  if (!result.ok) {
    return NextResponse.json({ success: false, message: result.error }, { status: 400 });
  }

  return NextResponse.json({ success: true, data: { command: result.command } });
}
