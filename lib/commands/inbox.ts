// Inbox query helpers — what does the current persona need to act on?

import { listCommands } from "./store";
import type { Command, UnitStatus } from "./types";
import type { Persona } from "@/lib/police-org/types";

export type InboxCategory =
  | "PENDING_APPROVAL" // SUBMITTED → currentPersona is approver
  | "PENDING_ACK" // DISPATCHED + unit PENDING
  | "PENDING_START" // unit ACKNOWLEDGED, ready to start
  | "PENDING_REPORT" // unit IN_PROGRESS, must report
  | "PENDING_CLOSE" // all units REPORTED, creator/approver can close
  | "MY_DRAFT" // DRAFT created by me — to continue editing/submitting
  | "MONITORING"; // dispatched commands I created — track only

export interface InboxItem {
  command: Command;
  category: InboxCategory;
  /** What unit-level status (if relevant) */
  unitStatus?: UnitStatus;
  /** Days remaining (negative = overdue) */
  daysLeft: number;
  isOverdue: boolean;
}

export interface InboxGroup {
  category: InboxCategory;
  label: string;
  description: string;
  items: InboxItem[];
  /** Visual accent for this group */
  accent: "amber" | "blue" | "emerald" | "red" | "slate";
}

const CATEGORY_META: Record<
  InboxCategory,
  { label: string; description: string; accent: InboxGroup["accent"] }
> = {
  PENDING_APPROVAL: {
    label: "รออนุมัติ",
    description: "หนังสือสั่งการที่ผู้ใต้บังคับบัญชาเสนอมาให้คุณอนุมัติ — ใช้ลายเซ็นดิจิทัลของคุณลงนามได้ทันที",
    accent: "amber",
  },
  PENDING_ACK: {
    label: "รอรับทราบ",
    description: "คำสั่งใหม่ที่ส่งถึงหน่วยของคุณ — กดรับทราบเพื่อเริ่มงาน",
    accent: "blue",
  },
  PENDING_START: {
    label: "รอเริ่มปฏิบัติ",
    description: "คุณรับทราบแล้ว — กดเพื่อเริ่มลงมือปฏิบัติ",
    accent: "blue",
  },
  PENDING_REPORT: {
    label: "รอส่งผล",
    description: "กำลังปฏิบัติอยู่ — กรอกค่า KPI แล้วส่งรายงาน",
    accent: "emerald",
  },
  PENDING_CLOSE: {
    label: "พร้อมปิดงาน",
    description: "ทุกหน่วยส่งผลครบแล้ว — คุณสามารถกดปิดงาน",
    accent: "emerald",
  },
  MY_DRAFT: {
    label: "ร่างของฉัน",
    description: "ร่างที่ยังไม่ได้เสนอ — เปิดเพื่อเสนอหรือแก้ไข",
    accent: "slate",
  },
  MONITORING: {
    label: "กำลังติดตาม",
    description: "คำสั่งที่คุณออกและกำลังทำงาน — ดูความคืบหน้าได้",
    accent: "slate",
  },
};

const CATEGORY_ORDER: InboxCategory[] = [
  "PENDING_APPROVAL",
  "PENDING_ACK",
  "PENDING_START",
  "PENDING_REPORT",
  "PENDING_CLOSE",
  "MY_DRAFT",
  "MONITORING",
];

function classify(cmd: Command, persona: Persona): InboxCategory | null {
  // Skip terminal states
  if (cmd.status === "CLOSED" || cmd.status === "REJECTED") return null;

  // Pending approval (approver view)
  if (cmd.status === "SUBMITTED") {
    if (
      cmd.proposedApproverId === persona.id ||
      (cmd.proposedApproverId === undefined && persona.authority === "APPROVE")
    ) {
      return "PENDING_APPROVAL";
    }
    return null;
  }

  // Target unit actions (dispatched/in-progress)
  const unitProgress = (cmd.unitProgress ?? []).find(
    (u) => u.unitId === persona.unitId
  );
  if (unitProgress && (cmd.status === "DISPATCHED" || cmd.status === "IN_PROGRESS")) {
    if (unitProgress.status === "PENDING") return "PENDING_ACK";
    if (unitProgress.status === "ACKNOWLEDGED") return "PENDING_START";
    if (unitProgress.status === "IN_PROGRESS") return "PENDING_REPORT";
  }

  // Drafter's own DRAFT
  if (cmd.createdBy === persona.id && cmd.status === "DRAFT") {
    return "MY_DRAFT";
  }

  // Ready to close (creator or approver)
  if (
    cmd.status === "REPORTED" &&
    (cmd.createdBy === persona.id || cmd.approvedBy === persona.id)
  ) {
    return "PENDING_CLOSE";
  }

  // Monitoring — my dispatched commands still running
  if (
    cmd.createdBy === persona.id &&
    (cmd.status === "DISPATCHED" || cmd.status === "IN_PROGRESS" || cmd.status === "REPORTED")
  ) {
    return "MONITORING";
  }
  // Also monitor approved-by-me
  if (
    cmd.approvedBy === persona.id &&
    (cmd.status === "DISPATCHED" || cmd.status === "IN_PROGRESS" || cmd.status === "REPORTED") &&
    cmd.createdBy !== persona.id
  ) {
    return "MONITORING";
  }

  return null;
}

export function buildInbox(persona: Persona): {
  groups: InboxGroup[];
  totalActionable: number;
} {
  const cmds = listCommands();
  const now = Date.now();
  const groupedItems: Record<InboxCategory, InboxItem[]> = {
    PENDING_APPROVAL: [],
    PENDING_ACK: [],
    PENDING_START: [],
    PENDING_REPORT: [],
    PENDING_CLOSE: [],
    MY_DRAFT: [],
    MONITORING: [],
  };

  for (const cmd of cmds) {
    const cat = classify(cmd, persona);
    if (!cat) continue;
    const unitProgress = (cmd.unitProgress ?? []).find(
      (u) => u.unitId === persona.unitId
    );
    const due = new Date(cmd.dueDate).getTime();
    const daysLeft = Math.ceil((due - now) / (24 * 60 * 60 * 1000));
    groupedItems[cat].push({
      command: cmd,
      category: cat,
      unitStatus: unitProgress?.status,
      daysLeft,
      isOverdue: daysLeft < 0 && cmd.status !== "REPORTED" && cmd.status !== "CLOSED",
    });
  }

  // Sort each group by most-recent / most-overdue first
  for (const cat of CATEGORY_ORDER) {
    groupedItems[cat].sort((a, b) => {
      if (a.isOverdue !== b.isOverdue) return a.isOverdue ? -1 : 1;
      return a.daysLeft - b.daysLeft;
    });
  }

  const groups: InboxGroup[] = CATEGORY_ORDER.filter(
    (cat) => groupedItems[cat].length > 0
  ).map((cat) => ({
    category: cat,
    ...CATEGORY_META[cat],
    items: groupedItems[cat],
  }));

  // Actionable count excludes pure monitoring/drafts
  const actionableCats: InboxCategory[] = [
    "PENDING_APPROVAL",
    "PENDING_ACK",
    "PENDING_START",
    "PENDING_REPORT",
    "PENDING_CLOSE",
  ];
  const totalActionable = actionableCats.reduce(
    (s, cat) => s + groupedItems[cat].length,
    0
  );

  return { groups, totalActionable };
}
