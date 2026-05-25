// GET /api/inbox — pending tasks grouped by category for active persona

import { NextResponse } from "next/server";
import { buildInbox } from "@/lib/commands/inbox";
import { buildAssessmentInbox } from "@/lib/assessments/inbox";
import { getActivePersona, getUnit } from "@/lib/police-org/store";

export const dynamic = "force-dynamic";

export async function GET() {
  const persona = getActivePersona();
  const unit = getUnit(persona.unitId);
  const inbox = buildInbox(persona);
  const assessmentItems = buildAssessmentInbox(persona);
  return NextResponse.json({
    success: true,
    data: {
      persona,
      unit,
      groups: inbox.groups,
      totalActionable: inbox.totalActionable + assessmentItems.length,
      assessmentItems,
    },
  });
}
