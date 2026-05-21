// Incident Service — TOR ๖.๔
// CRUD + Assign + Respond + Link + Close — ทั้งหมด audit log

import { prisma } from "@/lib/prisma";
import type {
  CreateIncidentInput,
  UpdateIncidentInput,
  AssignIncidentInput,
  RespondIncidentInput,
  LinkIncidentInput,
  CloseIncidentInput,
} from "./validators";

type Role = "ADMIN" | "COMMANDER" | "STAFF" | "AUDITOR" | "VIEWER";

interface AuthUser {
  id: string;
  role: Role;
}

export class IncidentError extends Error {
  constructor(public status: number, message: string) {
    super(message);
    this.name = "IncidentError";
  }
}

/** Auto-generate code: INC-{BE-year}-{seq} */
async function nextIncidentCode(): Promise<string> {
  const year = new Date().getFullYear() + 543;
  const prefix = `INC-${year}-`;
  const latest = await prisma.incident.findFirst({
    where: { code: { startsWith: prefix } },
    orderBy: { code: "desc" },
    select: { code: true },
  });
  let seq = 1;
  if (latest) {
    const last = parseInt(latest.code.slice(prefix.length), 10);
    if (!isNaN(last)) seq = last + 1;
  }
  return `${prefix}${String(seq).padStart(4, "0")}`;
}

// ─── Create ───────────────────────────────────
export async function createIncident(input: CreateIncidentInput, user: AuthUser) {
  if (!["ADMIN", "COMMANDER", "STAFF"].includes(user.role)) {
    throw new IncidentError(403, "ไม่มีสิทธิ์สร้างเหตุการณ์");
  }

  const code = await nextIncidentCode();
  const inc = await prisma.incident.create({
    data: {
      code,
      type: input.type,
      title: input.title,
      description: input.description ?? null,
      location: input.location ?? null,
      lat: input.lat ?? null,
      lng: input.lng ?? null,
      severity: input.severity,
      status: "open",
      assignedUnitId: input.assignedUnitId ?? null,
      missionId: input.missionId ?? null,
      externalRef: input.externalRef ?? null,
      occurredAt: input.occurredAt ?? new Date(),
    },
  });

  await prisma.auditLog.create({
    data: {
      userId: user.id,
      action: "incident.create",
      target: `incident:${inc.id}`,
      details: {
        code: inc.code,
        type: inc.type,
        title: inc.title,
        severity: inc.severity,
      },
    },
  });

  return inc;
}

// ─── Update metadata ──────────────────────────
export async function updateIncident(
  id: string,
  input: UpdateIncidentInput,
  user: AuthUser
) {
  if (!["ADMIN", "COMMANDER"].includes(user.role)) {
    throw new IncidentError(403, "ไม่มีสิทธิ์แก้ไข");
  }
  const inc = await prisma.incident.findUnique({ where: { id }, select: { status: true } });
  if (!inc) throw new IncidentError(404, "ไม่พบเหตุการณ์");
  if (inc.status === "closed") {
    throw new IncidentError(400, "เหตุการณ์ปิดแล้ว แก้ไขไม่ได้");
  }

  const updated = await prisma.incident.update({
    where: { id },
    data: {
      ...(input.type !== undefined && { type: input.type }),
      ...(input.title !== undefined && { title: input.title }),
      ...(input.description !== undefined && { description: input.description }),
      ...(input.location !== undefined && { location: input.location }),
      ...(input.lat !== undefined && { lat: input.lat }),
      ...(input.lng !== undefined && { lng: input.lng }),
      ...(input.severity !== undefined && { severity: input.severity }),
    },
  });

  await prisma.auditLog.create({
    data: {
      userId: user.id,
      action: "incident.update",
      target: `incident:${id}`,
      details: { changes: Object.keys(input) },
    },
  });

  return updated;
}

// ─── Assign unit ──────────────────────────────
export async function assignIncident(
  id: string,
  input: AssignIncidentInput,
  user: AuthUser
) {
  if (!["ADMIN", "COMMANDER"].includes(user.role)) {
    throw new IncidentError(403, "ไม่มีสิทธิ์มอบหมาย");
  }
  const inc = await prisma.incident.findUnique({
    where: { id },
    select: { status: true, assignedUnitId: true },
  });
  if (!inc) throw new IncidentError(404, "ไม่พบเหตุการณ์");
  if (inc.status === "closed") {
    throw new IncidentError(400, "เหตุการณ์ปิดแล้ว");
  }

  const unit = await prisma.unit.findUnique({ where: { id: input.unitId }, select: { code: true, name: true } });
  if (!unit) throw new IncidentError(404, "ไม่พบหน่วยงาน");

  await prisma.incident.update({
    where: { id },
    data: {
      assignedUnitId: input.unitId,
      status: inc.status === "open" ? "investigating" : inc.status,
    },
  });

  await prisma.auditLog.create({
    data: {
      userId: user.id,
      action: "incident.assign",
      target: `incident:${id}`,
      details: { unitCode: unit.code, unitName: unit.name, note: input.note },
    },
  });
}

// ─── Mark responded ───────────────────────────
export async function respondIncident(
  id: string,
  input: RespondIncidentInput,
  user: AuthUser
) {
  if (!["ADMIN", "COMMANDER", "STAFF"].includes(user.role)) {
    throw new IncidentError(403, "ไม่มีสิทธิ์");
  }
  const inc = await prisma.incident.findUnique({ where: { id }, select: { status: true } });
  if (!inc) throw new IncidentError(404, "ไม่พบเหตุการณ์");
  if (inc.status === "closed") throw new IncidentError(400, "เหตุการณ์ปิดแล้ว");

  await prisma.incident.update({
    where: { id },
    data: {
      respondedById: user.id,
      respondedAt: new Date(),
      status: "investigating",
    },
  });

  await prisma.auditLog.create({
    data: {
      userId: user.id,
      action: "incident.respond",
      target: `incident:${id}`,
      details: { note: input.note },
    },
  });
}

// ─── Link to Mission/Command ──────────────────
export async function linkIncident(
  id: string,
  input: LinkIncidentInput,
  user: AuthUser
) {
  if (!["ADMIN", "COMMANDER"].includes(user.role)) {
    throw new IncidentError(403, "ไม่มีสิทธิ์");
  }
  await prisma.incident.update({
    where: { id },
    data: {
      ...(input.missionId !== undefined && { missionId: input.missionId }),
      ...(input.commandId !== undefined && { commandId: input.commandId }),
    },
  });
  await prisma.auditLog.create({
    data: {
      userId: user.id,
      action: "incident.link",
      target: `incident:${id}`,
      details: { missionId: input.missionId, commandId: input.commandId },
    },
  });
}

// ─── Close ─────────────────────────────────────
export async function closeIncident(
  id: string,
  input: CloseIncidentInput,
  user: AuthUser
) {
  if (!["ADMIN", "COMMANDER"].includes(user.role)) {
    throw new IncidentError(403, "เฉพาะ COMMANDER/ADMIN ปิดคดีได้");
  }
  const inc = await prisma.incident.findUnique({ where: { id }, select: { status: true } });
  if (!inc) throw new IncidentError(404, "ไม่พบเหตุการณ์");
  if (inc.status === "closed") throw new IncidentError(400, "เหตุการณ์ปิดแล้ว");

  await prisma.incident.update({
    where: { id },
    data: { status: "closed", closedAt: new Date() },
  });

  await prisma.auditLog.create({
    data: {
      userId: user.id,
      action: "incident.close",
      target: `incident:${id}`,
      details: { resolution: input.resolution },
    },
  });
}
