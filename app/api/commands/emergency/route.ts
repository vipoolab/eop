// POST /api/commands/emergency — auto-create + auto-dispatch an EMERGENCY command
//
// Skips DRAFT/SUBMITTED/APPROVED — goes straight to DISPATCHED.
// Fans out notifications immediately based on getChannelsForPriority(EMERGENCY).
// Body: { triggerType, location, description, targetUnitIds, instructions }

import { NextRequest, NextResponse } from "next/server";
import {
  addCommand,
  genCommandId,
  genDocNumber,
} from "@/lib/commands/store";
import {
  createNotificationsForDispatch,
} from "@/lib/commands/emergency";
import { distributeAllKpis } from "@/lib/commands/kpi-distributor";
import {
  getActivePersona,
  getDescendants,
  getUnit,
} from "@/lib/police-org/store";
import type {
  Command,
  CommandLetter,
  EmergencyTriggerType,
  KpiDefinition,
  StatusLogEntry,
  UnitProgress,
} from "@/lib/commands/types";

export const dynamic = "force-dynamic";

interface EmergencyBody {
  triggerType: EmergencyTriggerType;
  location?: string;
  description: string;
  targetUnitIds: string[];
  instructions?: string;
  cascadeMode?: "DIRECT" | "CASCADE";
}

export async function POST(req: NextRequest) {
  const body = (await req.json()) as EmergencyBody;

  if (!body.triggerType || !body.description || !body.targetUnitIds?.length) {
    return NextResponse.json(
      {
        success: false,
        message: "ข้อมูลไม่ครบ — ต้องมี triggerType, description, targetUnitIds",
      },
      { status: 400 }
    );
  }

  const persona = getActivePersona();
  const userUnit = getUnit(persona.unitId);
  const cascadeMode = body.cascadeMode ?? "CASCADE";

  // Expand effective unit ids
  const effectiveIds = new Set<string>(body.targetUnitIds);
  if (cascadeMode === "CASCADE") {
    for (const tid of body.targetUnitIds) {
      for (const d of getDescendants(tid)) effectiveIds.add(d.id);
    }
  }
  const effectiveUnitIds = Array.from(effectiveIds);

  // Build a quick map of unit names for notification logs
  const unitNames: Record<string, string> = {};
  for (const uid of effectiveUnitIds) {
    const u = getUnit(uid);
    unitNames[uid] = u?.shortName ?? u?.name ?? uid;
  }

  const now = new Date().toISOString();
  const docNumber = genDocNumber(`${userUnit?.code ?? "ตร."} ฉ.`);

  const subject = `เรื่อง สั่งการเร่งด่วน — ${body.triggerType}${
    body.location ? ` บริเวณ ${body.location}` : ""
  }`;

  const directives: string[] = [];
  directives.push(
    `๑. ให้ทุกหน่วยที่ระบุดำเนินการตามแผนรับมือ ${body.triggerType} ระดับสูงสุดทันที`
  );
  if (body.location) {
    directives.push(`๒. ปิดล้อมและคัดกรองพื้นที่ ${body.location} ตามขั้นตอน`);
  }
  directives.push(
    "๓. รายงานสถานการณ์ทุก ๑๕ นาที ผ่านระบบ EOP จนกว่าเหตุจะยุติ"
  );
  if (body.instructions && body.instructions.trim()) {
    directives.push(`๔. คำสั่งเพิ่มเติม: ${body.instructions.trim()}`);
  }

  const letter: CommandLetter = {
    docNumber,
    subject,
    recipient:
      effectiveUnitIds.length === 1
        ? `เรียน ${unitNames[effectiveUnitIds[0]]}`
        : `เรียน หน่วยที่ระบุ (${effectiveUnitIds.length} หน่วย)`,
    introduction: `ด้วยเกิดเหตุการณ์${body.triggerType}${
      body.location ? ` ที่ ${body.location}` : ""
    } — ${body.description} จึงสั่งการเร่งด่วนระดับสูงสุดให้ดำเนินการตามนี้`,
    directives,
    reportInstruction:
      "ให้รายงานสถานการณ์ทุก ๑๕ นาที จนกว่าเหตุจะยุติ",
    closing: "ขอให้ดำเนินการโดยเร็วที่สุด — เป็นเหตุระดับ EMERGENCY",
    signatureApplied: !!persona.digitalSignature,
    signatureText: persona.digitalSignature ?? persona.name,
    signatureAppliedAt: now,
    signerName: persona.name,
    signerTitle: persona.role,
    signerDate: now,
  };

  // KPIs — generic status report
  const kpis: KpiDefinition[] = [
    {
      id: `kpi-${genCommandId().slice(0, 8)}`,
      type: "QUALITATIVE",
      metric: "รายงานสถานการณ์ทุก ๑๕ นาที",
      reportFrequency: "END_OF_PERIOD",
    },
  ];
  const assignments = distributeAllKpis(kpis, effectiveUnitIds);

  const unitProgress: UnitProgress[] = effectiveUnitIds.map((uid) => ({
    unitId: uid,
    status: "PENDING",
    reports: [],
  }));

  // 48-hour window for emergency by default
  const dueAt = new Date();
  dueAt.setHours(dueAt.getHours() + 48);

  const initialLog: StatusLogEntry = {
    timestamp: now,
    fromStatus: "DRAFT",
    toStatus: "DISPATCHED",
    byPersonaId: persona.id,
    byName: persona.name,
    byTitle: persona.role,
    note: "Auto-dispatch — โหมดฉุกเฉิน (ข้ามขั้นตอนอนุมัติ)",
  };

  const cmd: Command = {
    id: genCommandId(),
    status: "DISPATCHED",
    priority: "EMERGENCY",
    emergency: {
      triggeredAt: now,
      triggerType: body.triggerType,
      location: body.location,
      description: body.description,
      autoDispatched: true,
    },
    userIntent:
      body.instructions?.trim() ||
      `${body.triggerType}${body.location ? ` ที่ ${body.location}` : ""} — ${body.description}`,
    letter,
    alignment: {
      nationalStrategyItemIds: [],
      masterPlanItemIds: [],
      actionPlanItemIds: [],
      explanation: "เหตุฉุกเฉิน — ไม่ต้องจับคู่แผนยุทธศาสตร์ในขณะส่งคำสั่ง",
    },
    draftedBy: "ai-engine",
    draftedAt: now,
    targetUnitIds: body.targetUnitIds,
    cascadeMode,
    effectiveUnitIds,
    effectiveDate: now,
    dueDate: dueAt.toISOString(),
    kpis,
    assignments,
    createdBy: persona.id,
    createdByName: persona.name,
    createdByTitle: persona.role,
    createdAt: now,
    approvedAt: now,
    approvedBy: persona.id,
    approvedByName: persona.name,
    approvedByTitle: persona.role,
    dispatchedAt: now,
    unitProgress,
    statusLog: [initialLog],
    notifications: [],
    escalations: [],
  };

  // Fan-out notifications
  cmd.notifications = createNotificationsForDispatch(cmd, unitNames);

  addCommand(cmd);

  return NextResponse.json({ success: true, data: { command: cmd } });
}
