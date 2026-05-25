// POST /api/intelligence/classify
// Body: { filename?: string; text: string }
// Returns: AI-classified result with top-6 confidences + matched keywords + reasoning

import { NextRequest, NextResponse } from "next/server";
import { classifyWithAI } from "@/lib/intelligence/classifier";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";
export const maxDuration = 60;

interface ClassifyBody {
  filename?: string;
  text: string;
}

export async function POST(req: NextRequest) {
  const body = (await req.json()) as ClassifyBody;
  if (!body.text || body.text.trim().length === 0) {
    return NextResponse.json(
      { success: false, message: "ต้องระบุข้อความเพื่อจำแนกประเภท" },
      { status: 400 }
    );
  }

  const result = await classifyWithAI(body.text, body.filename);

  // Return top-3 for compatibility with existing UI
  const top3 = result.results.slice(0, 3);

  return NextResponse.json({
    success: true,
    data: {
      filename: body.filename,
      results: top3,
      allResults: result.results,
      predicted: result.predicted,
      predictedConfidence: result.predictedConfidence,
      reasoning: result.reasoning,
      processingTimeMs: result.processingTimeMs,
      method: result.method,
    },
  });
}
