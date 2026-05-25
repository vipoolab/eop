// GET /api/persona — current persona
// POST /api/persona — switch persona (body: { id })

import { NextRequest, NextResponse } from "next/server";
import {
  getActivePersona,
  setActivePersona,
  PERSONAS,
  getUnit,
} from "@/lib/police-org/store";

export const dynamic = "force-dynamic";

export async function GET() {
  const active = getActivePersona();
  const unit = getUnit(active.unitId);
  return NextResponse.json({
    success: true,
    data: {
      active,
      unit,
      personas: PERSONAS.map((p) => ({
        ...p,
        unit: getUnit(p.unitId),
      })),
    },
  });
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  const id = String(body?.id ?? "");
  if (!id) {
    return NextResponse.json(
      { success: false, message: "ต้องระบุ id" },
      { status: 400 }
    );
  }
  if (!PERSONAS.find((p) => p.id === id)) {
    return NextResponse.json(
      { success: false, message: "ไม่พบ persona" },
      { status: 404 }
    );
  }
  setActivePersona(id);
  const active = getActivePersona();
  return NextResponse.json({ success: true, data: { active } });
}
