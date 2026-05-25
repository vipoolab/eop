// POST /api/commands/[id]/units/[unitId]/report — submit a progress report
// Body: { notes?: string; kpiValues: [{kpiId, value, note?}] }

import { NextRequest, NextResponse } from "next/server";
import { getCommand, addUnitReport } from "@/lib/commands/store";
import { getActivePersona } from "@/lib/police-org/store";

export const dynamic = "force-dynamic";

interface Body {
  notes?: string;
  kpiValues: { kpiId: string; value: number; note?: string }[];
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
  if (persona.unitId !== unitId) {
    return NextResponse.json(
      { success: false, message: "Persona ปัจจุบันไม่ใช่หัวหน้าหน่วยนี้" },
      { status: 403 }
    );
  }
  if (!body.kpiValues?.length) {
    return NextResponse.json(
      { success: false, message: "ต้องระบุ kpiValues อย่างน้อย 1 รายการ" },
      { status: 400 }
    );
  }

  const result = addUnitReport(
    id,
    unitId,
    {
      reportedBy: persona.id,
      reportedByName: persona.name,
      reportedByTitle: persona.role,
      notes: body.notes,
      kpiValues: body.kpiValues,
    },
    {
      personaId: persona.id,
      name: persona.name,
      title: persona.role,
    }
  );
  if (!result.ok) {
    return NextResponse.json({ success: false, message: result.error }, { status: 400 });
  }

  return NextResponse.json({ success: true, data: { command: result.command } });
}
