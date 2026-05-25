// Workflow state machine + permission rules

import type {
  Command,
  CommandStatus,
  UnitStatus,
  UnitProgress,
} from "./types";
import type { Persona } from "@/lib/police-org/types";

// ── Transitions ────────────────────────────────

export type CommandAction =
  | "submit" // DRAFT → SUBMITTED
  | "approve" // SUBMITTED → APPROVED (and auto-dispatch)
  | "reject" // SUBMITTED → REJECTED (back to drafter)
  | "dispatch" // APPROVED → DISPATCHED
  | "close" // REPORTED → CLOSED
  | "revoke"; // DRAFT/SUBMITTED → REJECTED (cancel)

export type UnitAction =
  | "acknowledge" // PENDING → ACKNOWLEDGED
  | "start" // ACKNOWLEDGED → IN_PROGRESS
  | "report" // IN_PROGRESS → REPORTED (with values)
  | "reopen"; // REPORTED → IN_PROGRESS (correction)

/** Defines which (fromStatus → toStatus) transitions are allowed via which action */
const STATUS_TRANSITIONS: Record<CommandAction, [CommandStatus, CommandStatus][]> = {
  submit: [["DRAFT", "SUBMITTED"]],
  approve: [["SUBMITTED", "APPROVED"]],
  reject: [["SUBMITTED", "REJECTED"]],
  dispatch: [["APPROVED", "DISPATCHED"]],
  close: [
    ["REPORTED", "CLOSED"],
    ["IN_PROGRESS", "CLOSED"], // allow early close
  ],
  revoke: [
    ["DRAFT", "REJECTED"],
    ["SUBMITTED", "REJECTED"],
  ],
};

export function canTransition(
  from: CommandStatus,
  action: CommandAction
): CommandStatus | null {
  const pair = STATUS_TRANSITIONS[action]?.find(([f]) => f === from);
  return pair ? pair[1] : null;
}

// ── Per-unit transitions ──────────────────────

const UNIT_TRANSITIONS: Record<UnitAction, [UnitStatus, UnitStatus][]> = {
  acknowledge: [["PENDING", "ACKNOWLEDGED"]],
  start: [["ACKNOWLEDGED", "IN_PROGRESS"]],
  report: [
    ["IN_PROGRESS", "REPORTED"],
    ["REPORTED", "REPORTED"], // re-submission stays at REPORTED
  ],
  reopen: [["REPORTED", "IN_PROGRESS"]],
};

export function canUnitTransition(
  from: UnitStatus,
  action: UnitAction
): UnitStatus | null {
  const pair = UNIT_TRANSITIONS[action]?.find(([f]) => f === from);
  return pair ? pair[1] : null;
}

// ── Permissions ───────────────────────────────
// In demo mode every persona is technically admin, but UI shows
// contextual actions based on persona's *role* relative to the command.

export interface PermissionContext {
  command: Command;
  persona: Persona;
}

/**
 * Is this persona the original drafter (or someone with equivalent authority)?
 */
export function isDrafterOfCommand(ctx: PermissionContext): boolean {
  return ctx.command.createdBy === ctx.persona.id;
}

/**
 * Is this persona the intended approver?
 *
 * If the command specifies a proposedApproverId, that persona is the approver.
 * Otherwise any persona with APPROVE authority and a unit above the drafter
 * is implicitly allowed (simplified for demo).
 */
export function isApproverOfCommand(ctx: PermissionContext): boolean {
  if (ctx.command.proposedApproverId === ctx.persona.id) return true;
  // Fallback: if no explicit approver assigned, anyone with APPROVE authority can approve
  if (
    !ctx.command.proposedApproverId &&
    ctx.persona.authority === "APPROVE" &&
    ctx.persona.id !== ctx.command.createdBy
  ) {
    return true;
  }
  return false;
}

/** Is this persona the head of a unit that received the command? */
export function isTargetUnitHead(ctx: PermissionContext): UnitProgress | null {
  return (
    (ctx.command.unitProgress ?? []).find(
      (u) => u.unitId === ctx.persona.unitId
    ) ?? null
  );
}

/** Can this persona close the command? */
export function canCloseCommand(ctx: PermissionContext): boolean {
  return (
    (isApproverOfCommand(ctx) || ctx.command.createdBy === ctx.persona.id) &&
    (ctx.command.status === "REPORTED" || ctx.command.status === "IN_PROGRESS")
  );
}

/** Which command-level actions are available for this persona? */
export function availableCommandActions(ctx: PermissionContext): CommandAction[] {
  const out: CommandAction[] = [];
  const { command } = ctx;

  if (command.status === "DRAFT" && isDrafterOfCommand(ctx)) {
    out.push("submit");
    out.push("revoke");
  }
  if (command.status === "SUBMITTED" && isApproverOfCommand(ctx)) {
    out.push("approve");
    out.push("reject");
  }
  if (command.status === "APPROVED" && isApproverOfCommand(ctx)) {
    // After approval, dispatch can be triggered (auto in our flow, manual fallback here)
    out.push("dispatch");
  }
  if (canCloseCommand(ctx)) {
    out.push("close");
  }
  return out;
}

/** Which per-unit actions are available for this persona's unit? */
export function availableUnitActions(ctx: PermissionContext): UnitAction[] {
  const unit = isTargetUnitHead(ctx);
  if (!unit) return [];
  if (ctx.command.status !== "DISPATCHED" && ctx.command.status !== "IN_PROGRESS")
    return [];

  const out: UnitAction[] = [];
  if (unit.status === "PENDING") out.push("acknowledge");
  if (unit.status === "ACKNOWLEDGED") out.push("start");
  if (unit.status === "IN_PROGRESS" || unit.status === "REPORTED") out.push("report");
  return out;
}

// ── Rollup status from unit progress ──────────

/** Compute the command-level rollup status given current unit progresses */
export function rollupStatus(
  current: CommandStatus,
  unitProgress: UnitProgress[] | undefined
): CommandStatus {
  // If command is in a "post-dispatch" state, derive from units
  if (current === "DISPATCHED" || current === "IN_PROGRESS" || current === "REPORTED") {
    if (!unitProgress || unitProgress.length === 0) return current;
    const allReported = unitProgress.every((u) => u.status === "REPORTED" || u.status === "CLOSED");
    if (allReported) return "REPORTED";
    const anyStarted = unitProgress.some(
      (u) => u.status === "IN_PROGRESS" || u.status === "REPORTED"
    );
    if (anyStarted) return "IN_PROGRESS";
    return "DISPATCHED";
  }
  return current;
}

// ── Late detection (proportional: progress vs time) ──

/**
 * How much time has elapsed relative to the command window [effectiveDate → dueDate].
 * Returns 0–1, clamped.
 */
export function computeElapsedRatio(cmd: Command): number {
  const start = new Date(cmd.effectiveDate).getTime();
  const end = new Date(cmd.dueDate).getTime();
  if (end <= start) return 1;
  return Math.min(1, Math.max(0, (Date.now() - start) / (end - start)));
}

/**
 * KPI progress ratio for a single unit across all QUANTITATIVE KPIs (0–1).
 * Units with no QUANTITATIVE KPIs return 0.
 */
export function computeUnitProgressRatio(cmd: Command, unitId: string): number {
  const quantKpis = cmd.kpis.filter((k) => k.type === "QUANTITATIVE");
  if (quantKpis.length === 0) return 1; // qualitative-only = not late by KPI
  let totalTarget = 0;
  let totalCurrent = 0;
  for (const k of quantKpis) {
    const a = cmd.assignments.find((x) => x.kpiId === k.id && x.unitId === unitId);
    if (!a?.targetShare) continue;
    totalTarget += a.targetShare;
    totalCurrent += a.currentValue ?? 0;
  }
  if (totalTarget === 0) return 1;
  return Math.min(1, totalCurrent / totalTarget);
}

export interface UnitLateStatus {
  unitId: string;
  isLate: boolean;
  progressRatio: number; // 0-1
  elapsedRatio: number;  // 0-1
}

/** Mark a unit as "late" if its KPI progress is >10% behind the elapsed time ratio. */
export function computeUnitLateStatuses(cmd: Command): UnitLateStatus[] {
  const elapsedRatio = computeElapsedRatio(cmd);
  return (cmd.unitProgress ?? []).map((u) => {
    const done = u.status === "REPORTED" || u.status === "CLOSED";
    const progressRatio = computeUnitProgressRatio(cmd, u.unitId);
    const isLate = !done && progressRatio < elapsedRatio - 0.1;
    return { unitId: u.unitId, isLate, progressRatio, elapsedRatio };
  });
}

// ── Aggregate stats for tracking dashboard ────

export interface CommandTrackingStats {
  total: number;
  pending: number;
  acknowledged: number;
  inProgress: number;
  reported: number;
  late: number;
  ackPercent: number;
  reportPercent: number;
  elapsedRatio: number;
}

export function computeTrackingStats(cmd: Command): CommandTrackingStats {
  const progressList = cmd.unitProgress ?? [];
  const total = progressList.length;
  let pending = 0,
    acknowledged = 0,
    inProgress = 0,
    reported = 0;

  for (const u of progressList) {
    if (u.status === "PENDING") pending++;
    else if (u.status === "ACKNOWLEDGED") acknowledged++;
    else if (u.status === "IN_PROGRESS") inProgress++;
    else if (u.status === "REPORTED" || u.status === "CLOSED") reported++;
  }

  const lateStatuses = computeUnitLateStatuses(cmd);
  const late = lateStatuses.filter((s) => s.isLate).length;
  const elapsedRatio = computeElapsedRatio(cmd);

  return {
    total,
    pending,
    acknowledged,
    inProgress,
    reported,
    late,
    ackPercent: total ? Math.round(((total - pending) / total) * 100) : 0,
    reportPercent: total ? Math.round((reported / total) * 100) : 0,
    elapsedRatio,
  };
}

// ── KPI aggregation per command ───────────────

export interface KpiRollup {
  kpiId: string;
  type: "QUANTITATIVE" | "QUALITATIVE";
  metric: string;
  unit?: string;
  targetTotal?: number;
  achievedTotal?: number;
  percent?: number;
  reportingUnits: number;
  totalUnits: number;
}

export function computeKpiRollups(cmd: Command): KpiRollup[] {
  const progressList = cmd.unitProgress ?? [];
  return cmd.kpis.map((k) => {
    const assignments = cmd.assignments.filter((a) => a.kpiId === k.id);
    const reports = progressList.flatMap((u) => u.reports ?? []);
    const kpiValues = reports.flatMap((r) =>
      r.kpiValues.filter((v) => v.kpiId === k.id).map((v) => v.value)
    );
    const reportingUnits = new Set(
      reports
        .filter((r) => r.kpiValues.some((v) => v.kpiId === k.id))
        .map((r) => r.reportedBy)
    ).size;

    if (k.type === "QUANTITATIVE") {
      const achievedTotal = kpiValues.reduce((a, b) => a + b, 0);
      const percent = k.targetTotal
        ? Math.min(100, Math.round((achievedTotal / k.targetTotal) * 100))
        : undefined;
      return {
        kpiId: k.id,
        type: k.type,
        metric: k.metric,
        unit: k.unit,
        targetTotal: k.targetTotal,
        achievedTotal,
        percent,
        reportingUnits,
        totalUnits: assignments.length,
      };
    }
    return {
      kpiId: k.id,
      type: k.type,
      metric: k.metric,
      reportingUnits,
      totalUnits: assignments.length,
    };
  });
}
