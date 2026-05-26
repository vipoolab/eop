// POST /api/commands/draft/alignment — STEP 2 of 3 (chunked drafting)
// Matches the drafted letter to the 3-level strategic plans. Large plan
// context in, tiny output (IDs + explanation) out → fast.

import { NextRequest, NextResponse } from "next/server";
import { matchAlignment, gatherCandidatePlans } from "@/lib/commands/drafter";

export const runtime = "nodejs";
export const maxDuration = 60;

export async function POST(req: NextRequest) {
  const body = await req.json();
  const letterSummary = String(body?.letterSummary ?? "").trim();

  if (!letterSummary) {
    return NextResponse.json(
      { success: false, message: "ต้องระบุ letterSummary" },
      { status: 400 }
    );
  }

  const candidatePlans = gatherCandidatePlans();

  const outcome = await matchAlignment({ letterSummary, candidatePlans });

  if (!outcome.ok) {
    return NextResponse.json(
      { success: false, message: outcome.error, durationMs: outcome.durationMs },
      { status: 500 }
    );
  }

  return NextResponse.json({
    success: true,
    data: {
      alignment: outcome.result,
      model: outcome.model,
      durationMs: outcome.durationMs,
      tokens: { input: outcome.inputTokens, output: outcome.outputTokens },
    },
  });
}
