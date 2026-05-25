// POST /api/commands/draft/async — background AI drafter
// Returns taskId immediately. Client polls /api/tasks/[id] for result.

import { NextRequest, NextResponse } from "next/server";
import { draftCommand, gatherCandidatePlans } from "@/lib/commands/drafter";
import { getActivePersona, getUnit, getCommandableUnits } from "@/lib/police-org/store";
import { createTask, runInBackground } from "@/lib/tasks/store";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";
export const maxDuration = 30;

export async function POST(req: NextRequest) {
  const body = await req.json();

  const keywords = String(body?.keywords ?? "").trim();
  const baseInfo = String(body?.baseInfo ?? "").trim();
  const context = String(body?.context ?? "").trim();
  const intent = String(body?.intent ?? "").trim();

  const hasFields = keywords || baseInfo || context;
  if (!hasFields && !intent) {
    return NextResponse.json(
      { success: false, message: "ต้องระบุ input อย่างน้อยหนึ่งช่อง" },
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
  const candidatePlans = gatherCandidatePlans();
  const commandable = getCommandableUnits(persona.unitId);
  const candidateUnits = commandable.map((u) => ({
    id: u.id,
    code: u.code,
    name: u.name,
    shortName: u.shortName,
    level: u.level,
  }));

  const taskTitle =
    keywords?.slice(0, 60) ||
    baseInfo?.slice(0, 60) ||
    context?.slice(0, 60) ||
    intent.slice(0, 60) ||
    "ร่างหนังสือสั่งการ";

  const task = createTask({
    type: "draft",
    title: `ร่าง: ${taskTitle}`,
    input: { keywords, baseInfo, context, intent: finalIntent },
    createdBy: persona.id,
  });
  task.resultHref = `/tasks/${task.id}`;

  runInBackground(task.id, async () => {
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
      throw new Error(outcome.error);
    }
    return {
      result: outcome.result,
      model: outcome.model,
      durationMs: outcome.durationMs,
      tokens: {
        input: outcome.inputTokens,
        output: outcome.outputTokens,
      },
    };
  });

  return NextResponse.json({
    success: true,
    data: { taskId: task.id, message: "AI กำลังร่างหนังสือเบื้องหลัง — สามารถไปหน้าอื่นได้" },
  });
}
