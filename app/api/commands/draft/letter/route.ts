// POST /api/commands/draft/letter — STEP 1 of 3 (chunked drafting)
// Generates the คำสั่ง letter core only (no plan matching / KPIs), so the
// input stays small (~3k tokens) and the call completes well under the
// Vercel Hobby 60s function limit.

import { NextRequest, NextResponse } from "next/server";
import { draftLetter } from "@/lib/commands/drafter";
import { getActivePersona, getUnit } from "@/lib/police-org/store";

export const runtime = "nodejs";
export const maxDuration = 60;

export async function POST(req: NextRequest) {
  const body = await req.json();

  const keywords = String(body?.keywords ?? "").trim();
  const baseInfo = String(body?.baseInfo ?? "").trim();
  const context = String(body?.context ?? "").trim();
  const intent = String(body?.intent ?? "").trim();
  const hasFields = keywords || baseInfo || context;

  if (!hasFields && !intent) {
    return NextResponse.json(
      { success: false, message: "ต้องระบุ keywords/baseInfo/context หรือ intent" },
      { status: 400 }
    );
  }

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

  const outcome = await draftLetter({
    intent: finalIntent,
    fields: hasFields ? { keywords, baseInfo, context } : undefined,
    signerName: persona.name,
    signerTitle: persona.role,
    signerUnit: unit?.name ?? "—",
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
      letter: outcome.result,
      model: outcome.model,
      durationMs: outcome.durationMs,
      tokens: { input: outcome.inputTokens, output: outcome.outputTokens },
    },
  });
}
