// POST /api/commands/[id]/transition
// Command-level state transitions: submit / approve / reject / dispatch / close / revoke

import { NextRequest, NextResponse } from "next/server";
import {
  getCommand,
  transitionCommand,
  updateCommand,
} from "@/lib/commands/store";
import {
  availableCommandActions,
  canTransition,
  type CommandAction,
} from "@/lib/commands/workflow";
import { getActivePersona } from "@/lib/police-org/store";

export const dynamic = "force-dynamic";

interface Body {
  action: CommandAction;
  note?: string;
}

export async function POST(req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params;
  const body = (await req.json()) as Body;
  if (!body?.action) {
    return NextResponse.json({ success: false, message: "ต้องระบุ action" }, { status: 400 });
  }

  const cmd = getCommand(id);
  if (!cmd) {
    return NextResponse.json({ success: false, message: "ไม่พบคำสั่ง" }, { status: 404 });
  }
  const persona = getActivePersona();

  // Check action is permitted for current persona
  const allowed = availableCommandActions({ command: cmd, persona });
  if (!allowed.includes(body.action)) {
    return NextResponse.json(
      {
        success: false,
        message: `Persona "${persona.role}" ไม่สามารถ ${body.action} คำสั่งนี้ในสถานะ "${cmd.status}" ได้`,
      },
      { status: 403 }
    );
  }

  const toStatus = canTransition(cmd.status, body.action);
  if (!toStatus) {
    return NextResponse.json(
      { success: false, message: `ไม่สามารถ ${body.action} จาก ${cmd.status} ได้` },
      { status: 400 }
    );
  }

  // Apply transition
  const result = transitionCommand(
    id,
    toStatus,
    {
      personaId: persona.id,
      name: persona.name,
      title: persona.role,
    },
    body.note,
    body.action === "approve" && persona.digitalSignature
      ? {
          letter: {
            ...cmd.letter,
            signatureApplied: true,
            signatureText: persona.digitalSignature,
            signatureAppliedAt: new Date().toISOString(),
            signerName: persona.name,
            signerTitle: persona.role,
            signerDate: new Date().toISOString(),
          },
        }
      : undefined
  );

  if (!result.ok) {
    return NextResponse.json({ success: false, message: result.error }, { status: 400 });
  }

  // Auto-dispatch after approval
  let finalCmd = result.command;
  if (body.action === "approve") {
    const dispatchResult = transitionCommand(id, "DISPATCHED", {
      personaId: "system",
      name: "ระบบ",
      title: "auto-dispatch",
    });
    if (dispatchResult.ok) finalCmd = dispatchResult.command;
  }

  // After rejection, also reset status to DRAFT so drafter can edit + resubmit
  if (body.action === "reject") {
    const back = updateCommand(id, { status: "DRAFT" });
    if (back) finalCmd = back;
  }

  return NextResponse.json({ success: true, data: { command: finalCmd } });
}
