// POST /api/commands/draft — call Claude Opus to draft a command from user intent

import { NextRequest, NextResponse } from "next/server";
import { draftCommand, gatherCandidatePlans } from "@/lib/commands/drafter";
import { getActivePersona, getUnit, getCommandableUnits } from "@/lib/police-org/store";

export const runtime = "nodejs";
export const maxDuration = 120;

export async function POST(req: NextRequest) {
  const body = await req.json();

  // PoC 3-field input
  const keywords = String(body?.keywords ?? "").trim();
  const baseInfo = String(body?.baseInfo ?? "").trim();
  const context = String(body?.context ?? "").trim();
  // Legacy free-text intent
  const intent = String(body?.intent ?? "").trim();

  // Either the 3-field block OR legacy intent must be provided
  const hasFields = keywords || baseInfo || context;
  if (!hasFields && !intent) {
    return NextResponse.json(
      { success: false, message: "ต้องระบุ keywords/baseInfo/context อย่างน้อยหนึ่งช่อง หรือ intent" },
      { status: 400 }
    );
  }

  // If only fields provided, synthesize a fallback intent string for compat
  const finalIntent =
    intent ||
    [
      keywords && `คำสำคัญ: ${keywords}`,
      baseInfo && `ข้อมูลตั้งต้น: ${baseInfo}`,
      context && `บริบท: ${context}`,
    ]
      .filter(Boolean)
      .join("\n\n");

  const persona = getActivePersona();
  const unit = getUnit(persona.unitId);
  const candidatePlans = gatherCandidatePlans();
  // Send commandable units to AI so it can suggest matching target IDs
  const commandable = getCommandableUnits(persona.unitId);
  const candidateUnits = commandable.map((u) => ({
    id: u.id,
    code: u.code,
    name: u.name,
    shortName: u.shortName,
    level: u.level,
  }));

  const outcome = await draftCommand({
    intent: finalIntent,
    fields: hasFields ? { keywords, baseInfo, context } : undefined,
    signerName: persona.name,
    signerTitle: persona.role,
    signerUnit: unit?.name ?? "—",
    candidatePlans,
    candidateUnits,
  });

  if (!outcome.ok) {
    return NextResponse.json(
      {
        success: false,
        message: outcome.error,
        durationMs: outcome.durationMs,
      },
      { status: 500 }
    );
  }

  return NextResponse.json({
    success: true,
    data: {
      result: outcome.result,
      model: outcome.model,
      durationMs: outcome.durationMs,
      tokens: {
        input: outcome.inputTokens,
        output: outcome.outputTokens,
      },
    },
  });
}
