// In-memory store for Commands (หนังสือสั่งการ)

import type {
  Command,
  CommandStatus,
  StatusLogEntry,
  UnitProgress,
  UnitProgressReport,
  UnitStatus,
} from "./types";
import { rollupStatus } from "./workflow";
import { SEED_COMMANDS } from "./seed";

interface Store {
  commands: Map<string, Command>;
  seeded: boolean;
}

declare global {
  // eslint-disable-next-line no-var
  var __commandStore: Store | undefined;
}

function getStore(): Store {
  if (!globalThis.__commandStore) {
    globalThis.__commandStore = { commands: new Map(), seeded: false };
  }
  const store = globalThis.__commandStore;
  // Always add missing seed commands (allows new seeds to be picked up on hot reload)
  for (const cmd of SEED_COMMANDS) {
    if (!store.commands.has(cmd.id)) {
      store.commands.set(cmd.id, cmd);
    }
  }
  store.seeded = true;
  return store;
}

// ── Read ──────────────────────────────────────

export function listCommands(filter?: { status?: CommandStatus }): Command[] {
  const cmds = Array.from(getStore().commands.values());
  const filtered = filter?.status
    ? cmds.filter((c) => c.status === filter.status)
    : cmds;
  return filtered.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

export function getCommand(id: string): Command | null {
  return getStore().commands.get(id) ?? null;
}

// ── Write ─────────────────────────────────────

export function addCommand(cmd: Command): Command {
  getStore().commands.set(cmd.id, cmd);
  return cmd;
}

export function updateCommand(id: string, patch: Partial<Command>): Command | null {
  const c = getStore().commands.get(id);
  if (!c) return null;
  const updated = { ...c, ...patch };
  getStore().commands.set(id, updated);
  return updated;
}

export function deleteCommand(id: string): boolean {
  return getStore().commands.delete(id);
}

// ── ID generators ─────────────────────────────

export function genCommandId(): string {
  return `cmd-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

export function genReportId(): string {
  return `rep-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
}

// Thai-numeral conversion for document numbers (e.g. 1234 → "๑๒๓๔")
const THAI_DIGITS = ["๐", "๑", "๒", "๓", "๔", "๕", "๖", "๗", "๘", "๙"];
function toThaiNumerals(s: string | number): string {
  return String(s)
    .split("")
    .map((c) => (c >= "0" && c <= "9" ? THAI_DIGITS[Number(c)] : c))
    .join("");
}

/**
 * Generate a คำสั่ง document number.
 * Format per ระเบียบสารบรรณ ข้อ ๒๒.๒: "ที่ <seq>/<buddhist-year>"
 * Both seq and year in Thai numerals.
 * Example: "๑๒๓/๒๕๖๙"
 *
 * Note: in real RTP practice, seq starts from ๑ each calendar year per
 * unit's สารบรรณ. Here we use a time-derived value for demo uniqueness.
 */
export function genDocNumber(_unitCode?: string): string {
  const now = new Date();
  const buddhistYear = now.getFullYear() + 543;
  // Seq mod 1000 keeps it 3-digit visually pleasing
  const seqNum = (Math.floor(now.getTime() / 60_000) % 1000) + 1;
  return `${toThaiNumerals(seqNum)}/${toThaiNumerals(buddhistYear)}`;
}

// ── Status transitions ────────────────────────

export interface TransitionAuthor {
  personaId: string;
  name: string;
  title: string;
}

export interface TransitionResult {
  ok: true;
  command: Command;
}
export interface TransitionFail {
  ok: false;
  error: string;
}

export function transitionCommand(
  id: string,
  toStatus: CommandStatus,
  author: TransitionAuthor,
  note?: string,
  extras?: Partial<Command>
): TransitionResult | TransitionFail {
  const cmd = getCommand(id);
  if (!cmd) return { ok: false, error: "ไม่พบคำสั่ง" };

  const log: StatusLogEntry = {
    timestamp: new Date().toISOString(),
    fromStatus: cmd.status,
    toStatus,
    byPersonaId: author.personaId,
    byName: author.name,
    byTitle: author.title,
    note,
  };

  const patch: Partial<Command> = {
    status: toStatus,
    statusLog: [...cmd.statusLog, log],
    ...extras,
  };

  // Set timestamps based on target status
  const now = new Date().toISOString();
  if (toStatus === "SUBMITTED" && !cmd.submittedAt) {
    patch.submittedAt = now;
    patch.submittedBy = author.personaId;
    patch.submittedByName = author.name;
  }
  if (toStatus === "APPROVED" && !cmd.approvedAt) {
    patch.approvedAt = now;
    patch.approvedBy = author.personaId;
    patch.approvedByName = author.name;
    patch.approvedByTitle = author.title;
  }
  if (toStatus === "DISPATCHED" && !cmd.dispatchedAt) {
    patch.dispatchedAt = now;
  }
  if (toStatus === "CLOSED" && !cmd.closedAt) {
    patch.closedAt = now;
    patch.closedBy = author.personaId;
    patch.closedByName = author.name;
  }
  if (toStatus === "REJECTED" && !cmd.rejectedAt) {
    patch.rejectedAt = now;
    patch.rejectedBy = author.personaId;
    patch.rejectionReason = note;
  }

  const updated = updateCommand(id, patch);
  return updated ? { ok: true, command: updated } : { ok: false, error: "อัปเดตล้มเหลว" };
}

// ── Unit-level transitions ────────────────────

export function transitionUnit(
  commandId: string,
  unitId: string,
  toStatus: UnitStatus,
  author: TransitionAuthor,
  extraData?: Partial<UnitProgress>
): TransitionResult | TransitionFail {
  const cmd = getCommand(commandId);
  if (!cmd) return { ok: false, error: "ไม่พบคำสั่ง" };

  const idx = cmd.unitProgress.findIndex((u) => u.unitId === unitId);
  if (idx === -1) {
    return { ok: false, error: "หน่วยไม่ได้รับคำสั่งนี้" };
  }

  const now = new Date().toISOString();
  const cur = cmd.unitProgress[idx];

  const update: UnitProgress = { ...cur, status: toStatus, ...(extraData ?? {}) };
  if (toStatus === "ACKNOWLEDGED" && !cur.acknowledgedAt) {
    update.acknowledgedAt = now;
    update.acknowledgedBy = author.personaId;
    update.acknowledgedByName = author.name;
  }
  if (toStatus === "IN_PROGRESS" && !cur.startedAt) {
    update.startedAt = now;
    update.startedBy = author.personaId;
    update.startedByName = author.name;
  }
  if (toStatus === "CLOSED" && !cur.closedAt) {
    update.closedAt = now;
  }

  const newProgress = [...cmd.unitProgress];
  newProgress[idx] = update;

  // Recompute rollup status
  const newRollup = rollupStatus(cmd.status, newProgress);
  const patch: Partial<Command> = {
    unitProgress: newProgress,
  };
  if (newRollup !== cmd.status) {
    patch.status = newRollup;
    patch.statusLog = [
      ...cmd.statusLog,
      {
        timestamp: now,
        fromStatus: cmd.status,
        toStatus: newRollup,
        byPersonaId: "system",
        byName: "ระบบ",
        byTitle: "auto-rollup",
        note: `Auto-rollup เนื่องจาก ${author.name} (${author.title}) เปลี่ยนสถานะหน่วย`,
      },
    ];
  }

  const updated = updateCommand(commandId, patch);
  return updated ? { ok: true, command: updated } : { ok: false, error: "อัปเดตล้มเหลว" };
}

/** Add a progress report from a unit + advance its status to REPORTED */
export function addUnitReport(
  commandId: string,
  unitId: string,
  report: Omit<UnitProgressReport, "id" | "reportedAt">,
  author: TransitionAuthor
): TransitionResult | TransitionFail {
  const cmd = getCommand(commandId);
  if (!cmd) return { ok: false, error: "ไม่พบคำสั่ง" };

  const idx = cmd.unitProgress.findIndex((u) => u.unitId === unitId);
  if (idx === -1) {
    return { ok: false, error: "หน่วยไม่ได้รับคำสั่งนี้" };
  }

  const cur = cmd.unitProgress[idx];
  const fullReport: UnitProgressReport = {
    ...report,
    id: genReportId(),
    reportedAt: new Date().toISOString(),
  };

  const reports = [...cur.reports, fullReport];
  // Update unit status to REPORTED and bump assignment values
  const result = transitionUnit(
    commandId,
    unitId,
    "REPORTED",
    author,
    { reports }
  );
  if (!result.ok) return result;

  // Update KPI assignments with new currentValue
  const cmdNow = result.command;
  const newAssignments = cmdNow.assignments.map((a) => {
    if (a.unitId !== unitId) return a;
    const matchingVal = report.kpiValues.find((v) => v.kpiId === a.kpiId);
    if (!matchingVal) return a;
    return {
      ...a,
      currentValue: (a.currentValue ?? 0) + matchingVal.value,
      lastReportedAt: fullReport.reportedAt,
      status: "REPORTING" as const,
    };
  });
  const updated = updateCommand(commandId, { assignments: newAssignments });
  return updated ? { ok: true, command: updated } : { ok: false, error: "อัปเดต KPI ล้มเหลว" };
}

// ── Stats ─────────────────────────────────────

export interface CommandStats {
  total: number;
  byStatus: Record<CommandStatus, number>;
  lastDispatchedAt: string | null;
}

export function getCommandStats(): CommandStats {
  const cmds = listCommands();
  const byStatus: Record<CommandStatus, number> = {
    DRAFT: 0,
    SUBMITTED: 0,
    APPROVED: 0,
    DISPATCHED: 0,
    IN_PROGRESS: 0,
    REPORTED: 0,
    CLOSED: 0,
    REJECTED: 0,
  };
  let lastDispatched: string | null = null;
  for (const c of cmds) {
    byStatus[c.status] = (byStatus[c.status] ?? 0) + 1;
    if (c.dispatchedAt && (!lastDispatched || c.dispatchedAt > lastDispatched)) {
      lastDispatched = c.dispatchedAt;
    }
  }
  return { total: cmds.length, byStatus, lastDispatchedAt: lastDispatched };
}
