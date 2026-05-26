// POST /api/commands/draft/kpis — STEP 3 of 3 (chunked drafting)
// Suggests KPIs + target units + cascade mode + duration from the drafted
// letter. Small input/output → fast.

import { NextRequest, NextResponse } from "next/server";
import { suggestKpisAndTargets } from "@/lib/commands/drafter";
import { getActivePersona, getCommandableUnits } from "@/lib/police-org/store";

export const runtime = "nodejs";
export const maxDuration = 60;

export async function POST(req: NextRequest) {
  const body = await req.json();
  const letterSummary = String(body?.letterSummary ?? "").trim();
  const recipient = String(body?.recipient ?? "").trim();

  if (!letterSummary) {
    return NextResponse.json(
      { success: false, message: "ต้องระบุ letterSummary" },
      { status: 400 }
    );
  }

  const persona = getActivePersona();
  const commandable = getCommandableUnits(persona.unitId);
  const candidateUnits = commandable.map((u) => ({
    id: u.id,
    code: u.code,
    name: u.name,
    shortName: u.shortName,
    level: u.level,
  }));

  const outcome = await suggestKpisAndTargets({
    letterSummary,
    recipient,
    candidateUnits,
  });

  if (!outcome.ok) {
    return NextResponse.json(
      { success: false, message: outcome.error, durationMs: outcome.durationMs },
      { status: 500 }
    );
  }

  return NextResponse.json({
    success: true,
    data: {
      ...outcome.result,
      model: outcome.model,
      durationMs: outcome.durationMs,
      tokens: { input: outcome.inputTokens, output: outcome.outputTokens },
    },
  });
}
