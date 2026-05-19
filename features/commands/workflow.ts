// Command Workflow State Machine — TOR 4.1
// กำหนด valid transitions ระหว่าง 9 สถานะ
// และ role ที่อนุญาตให้ทำแต่ละ transition

import type { CommandStatus } from "./types";

type Role = "ADMIN" | "COMMANDER" | "STAFF" | "AUDITOR" | "VIEWER";

export interface Transition {
  /** Action name (ใช้ใน API route + audit log) */
  action: string;
  /** State หลังจาก transition */
  to: CommandStatus;
  /** Roles ที่อนุญาต */
  allowedRoles: Role[];
  /** คำอธิบายแสดงใน UI */
  label: string;
  /** คำอธิบายเพิ่มเติม */
  description?: string;
}

/**
 * State Machine — TOR 4.1 9-state workflow
 *
 * DRAFT → SUBMITTED → APPROVED → PUBLISHED → ACKNOWLEDGED
 *       → IN_PROGRESS → REPORTED → AUDITED → CLOSED
 */
export const WORKFLOW: Record<CommandStatus, Transition[]> = {
  DRAFT: [
    {
      action: "submit",
      to: "SUBMITTED",
      allowedRoles: ["ADMIN", "COMMANDER", "STAFF"],
      label: "ส่งเพื่อพิจารณา",
      description: "ส่งร่างให้ผู้บังคับบัญชาพิจารณาอนุมัติ",
    },
  ],
  SUBMITTED: [
    {
      action: "approve",
      to: "APPROVED",
      allowedRoles: ["ADMIN", "COMMANDER"],
      label: "อนุมัติ",
      description: "อนุมัติคำสั่ง — ลายเซ็นอิเล็กทรอนิกส์",
    },
    {
      action: "reject",
      to: "DRAFT",
      allowedRoles: ["ADMIN", "COMMANDER"],
      label: "ส่งกลับแก้ไข",
      description: "ส่งกลับไปแก้ไข",
    },
  ],
  APPROVED: [
    {
      action: "publish",
      to: "PUBLISHED",
      allowedRoles: ["ADMIN", "COMMANDER"],
      label: "เผยแพร่",
      description: "เผยแพร่และจ่ายคำสั่งให้หน่วยรับ",
    },
  ],
  PUBLISHED: [
    {
      action: "acknowledge",
      to: "ACKNOWLEDGED",
      allowedRoles: ["ADMIN", "COMMANDER", "STAFF"],
      label: "ยืนยันรับทราบทั้งหมด",
      description: "เมื่อหน่วยรับทั้งหมดได้รับทราบ",
    },
  ],
  ACKNOWLEDGED: [
    {
      action: "start",
      to: "IN_PROGRESS",
      allowedRoles: ["ADMIN", "COMMANDER", "STAFF"],
      label: "เริ่มปฏิบัติ",
      description: "เริ่มดำเนินการตามคำสั่ง",
    },
  ],
  IN_PROGRESS: [
    {
      action: "report",
      to: "REPORTED",
      allowedRoles: ["ADMIN", "COMMANDER", "STAFF"],
      label: "ส่งผลปฏิบัติ",
      description: "ส่งผลการปฏิบัติงาน + หลักฐาน",
    },
  ],
  REPORTED: [
    {
      action: "audit",
      to: "AUDITED",
      allowedRoles: ["ADMIN", "AUDITOR", "COMMANDER"],
      label: "ตรวจสอบผล",
      description: "ตรวจสอบความถูกต้องของผลปฏิบัติ",
    },
  ],
  AUDITED: [
    {
      action: "close",
      to: "CLOSED",
      allowedRoles: ["ADMIN", "COMMANDER"],
      label: "ปิดงาน",
      description: "ปิดเรื่องและประเมินผล",
    },
  ],
  CLOSED: [],
};

/**
 * ตรวจสอบว่าสามารถเปลี่ยนสถานะได้ไหม
 */
export function canTransition(
  from: CommandStatus,
  to: CommandStatus,
  role: Role
): boolean {
  const allowed = WORKFLOW[from] ?? [];
  return allowed.some((t) => t.to === to && t.allowedRoles.includes(role));
}

/**
 * หา transition definition จาก action name
 */
export function getTransition(
  from: CommandStatus,
  action: string
): Transition | undefined {
  return (WORKFLOW[from] ?? []).find((t) => t.action === action);
}

/**
 * รายการ transitions ที่ role นี้ทำได้
 */
export function getAvailableTransitions(
  from: CommandStatus,
  role: Role
): Transition[] {
  return (WORKFLOW[from] ?? []).filter((t) =>
    t.allowedRoles.includes(role)
  );
}
