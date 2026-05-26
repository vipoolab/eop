// GET /api/commands — list
// POST /api/commands — create command (final step of wizard)

import { NextRequest, NextResponse } from "next/server";
import {
  listCommands,
  addCommand,
  genCommandId,
  genDocNumber,
  getCommandStats,
} from "@/lib/commands/store";
import { distributeAllKpis } from "@/lib/commands/kpi-distributor";
import {
  createNotificationsForDispatch,
} from "@/lib/commands/emergency";
import { getDescendants, getUnit, getActivePersona } from "@/lib/police-org/store";
import type {
  Command,
  CommandLetter,
  CommandAlignment,
  CascadeMode,
  CommandPriority,
  KpiDefinition,
  StatusLogEntry,
  UnitProgress,
} from "@/lib/commands/types";

export const dynamic = "force-dynamic";

export async function GET() {
  return NextResponse.json({
    success: true,
    data: {
      commands: listCommands(),
      stats: getCommandStats(),
    },
  });
}

interface CreateBody {
  userIntent: string;
  letter: CommandLetter;
  alignment: CommandAlignment;
  draftedBy: string;
  draftDurationMs?: number;
  draftTokens?: number;
  targetUnitIds: string[];
  cascadeMode: CascadeMode;
  effectiveDate: string;
  dueDate: string;
  kpis: KpiDefinition[];
  /**
   * Submit action:
   *  - "draft"    → save as DRAFT (creator only)
   *  - "submit"   → save as SUBMITTED (escalate to supervisor)
   *  - "dispatch" → save as DISPATCHED (commander self-approves, no submission flow)
   */
  action: "draft" | "submit" | "dispatch";
  priority?: CommandPriority;
}

export async function POST(req: NextRequest) {
  const body = (await req.json()) as CreateBody;

  if (!body.letter || !body.targetUnitIds?.length) {
    return NextResponse.json(
      { success: false, message: "ข้อมูลไม่ครบ — ต้องมี letter และ target อย่างน้อย ๑ หน่วย" },
      { status: 400 }
    );
  }

  const persona = getActivePersona();
  const userUnit = getUnit(persona.unitId);

  // For DRAFT_ONLY persona, "dispatch" is not allowed → fall back to submit
  let action = body.action;
  if (persona.authority === "DRAFT_ONLY" && action === "dispatch") {
    action = "submit";
  }

  // Compute effective units
  const effectiveIds = new Set<string>(body.targetUnitIds);
  if (body.cascadeMode === "CASCADE") {
    for (const tid of body.targetUnitIds) {
      for (const d of getDescendants(tid)) effectiveIds.add(d.id);
    }
  }
  const effectiveUnitIds = Array.from(effectiveIds);

  // KPIs distributed to effective units
  const assignments = distributeAllKpis(body.kpis ?? [], effectiveUnitIds);

  // Initial unit progress entries — only matter after DISPATCHED, but we
  // create them upfront so the rollup helpers see consistent shape.
  const unitProgress: UnitProgress[] = effectiveUnitIds.map((uid) => ({
    unitId: uid,
    status: "PENDING",
    reports: [],
  }));

  const docNumber = genDocNumber(userUnit?.code ?? "ตร.");
  const now = new Date().toISOString();

  // Determine initial status + signature application
  let status: Command["status"];
  const letter: CommandLetter = { ...body.letter, docNumber: body.letter.docNumber ?? docNumber };

  // ── Populate v3 header/signature fields from persona (for คำสั่ง format) ──
  // Header unit name — full name of the issuing unit (or ตร. as fallback)
  letter.unitFullName = letter.unitFullName ?? userUnit?.name ?? "สำนักงานตำรวจแห่งชาติ";
  // Signer rank line (above the parenthetical name)
  letter.signerRank = letter.signerRank ?? persona.rank;
  // Date/divider style: HQ-level units (bureau or ตร.) use abbreviated date + no
  // divider; station-level (level 3) uses the full date words + asterisk divider.
  const isStationLevel = (userUnit?.level ?? 0) >= 3;
  letter.dateStyle = letter.dateStyle ?? (isStationLevel ? "full" : "abbreviated");
  letter.dividerStyle = letter.dividerStyle ?? (isStationLevel ? "asterisks" : "none");

  if (action === "draft") {
    status = "DRAFT";
  } else if (action === "submit") {
    status = "SUBMITTED";
  } else {
    // dispatch — commander self-approves + auto-dispatch
    status = "DISPATCHED";
    if (persona.digitalSignature) {
      letter.signatureApplied = true;
      letter.signatureText = persona.digitalSignature;
      letter.signatureAppliedAt = now;
      letter.signerName = persona.name;
      letter.signerTitle = persona.role;
      letter.signerDate = now;
    }
  }

  const initialLog: StatusLogEntry = {
    timestamp: now,
    fromStatus: "DRAFT" as Command["status"],
    toStatus: status,
    byPersonaId: persona.id,
    byName: persona.name,
    byTitle: persona.role,
    note:
      action === "draft"
        ? "บันทึกเป็นร่าง"
        : action === "submit"
        ? "เสนอเพื่อขออนุมัติ"
        : "อนุมัติและเผยแพร่โดยผู้บังคับบัญชาเอง",
  };

  const priority: CommandPriority = body.priority ?? "NORMAL";

  const cmd: Command = {
    id: genCommandId(),
    status,
    priority,
    userIntent: body.userIntent,
    letter,
    alignment: body.alignment,
    draftedBy: body.draftedBy,
    draftedAt: now,
    draftDurationMs: body.draftDurationMs,
    draftTokens: body.draftTokens,
    targetUnitIds: body.targetUnitIds,
    cascadeMode: body.cascadeMode,
    effectiveUnitIds,
    effectiveDate: body.effectiveDate,
    dueDate: body.dueDate,
    kpis: body.kpis ?? [],
    assignments,
    createdBy: persona.id,
    createdByName: persona.name,
    createdByTitle: persona.role,
    createdAt: now,
    proposedApproverId:
      action === "submit" ? persona.supervisorPersonaId : undefined,
    dispatchedAt: action === "dispatch" ? now : undefined,
    submittedAt: action === "submit" ? now : undefined,
    submittedBy: action === "submit" ? persona.id : undefined,
    submittedByName: action === "submit" ? persona.name : undefined,
    approvedAt: action === "dispatch" ? now : undefined,
    approvedBy: action === "dispatch" ? persona.id : undefined,
    approvedByName: action === "dispatch" ? persona.name : undefined,
    approvedByTitle: action === "dispatch" ? persona.role : undefined,
    unitProgress,
    statusLog: [initialLog],
    notifications: [],
    escalations: [],
  };

  // Fan-out notifications on dispatch for URGENT/EMERGENCY
  if (action === "dispatch" && priority !== "NORMAL") {
    const unitNames: Record<string, string> = {};
    for (const uid of effectiveUnitIds) {
      const u = getUnit(uid);
      unitNames[uid] = u?.shortName ?? u?.name ?? uid;
    }
    cmd.notifications = createNotificationsForDispatch(cmd, unitNames);
  }

  addCommand(cmd);

  return NextResponse.json({ success: true, data: { command: cmd } });
}
