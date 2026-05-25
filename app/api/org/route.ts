// GET /api/org — returns full org tree + commandable subset for active persona

import { NextResponse } from "next/server";
import {
  buildOrgTree,
  getActivePersona,
  getCommandableUnits,
  getOrgStats,
  getUnit,
} from "@/lib/police-org/store";

export const dynamic = "force-dynamic";

export async function GET() {
  const persona = getActivePersona();
  const userUnit = getUnit(persona.unitId);
  const tree = buildOrgTree();
  const commandable = getCommandableUnits(persona.unitId);

  return NextResponse.json({
    success: true,
    data: {
      tree,
      stats: getOrgStats(),
      activePersona: { persona, unit: userUnit },
      commandableUnitIds: commandable.map((u) => u.id),
    },
  });
}
