// Command types — TOR 5.4.4 Command & Operation System
// 9-state workflow per TOR clause 4.1

export type CommandStatus =
  | "DRAFT" // ร่าง
  | "SUBMITTED" // เสนอ
  | "APPROVED" // อนุมัติ
  | "PUBLISHED" // เผยแพร่ + การจ่ายคำสั่ง
  | "ACKNOWLEDGED" // รับทราบ
  | "IN_PROGRESS" // เริ่มปฏิบัติ
  | "REPORTED" // ส่งผลหลักฐาน
  | "AUDITED" // ตรวจสอบ
  | "CLOSED"; // ปิดงาน/ประเมินผล

export type CommandPriority =
  | "LOW"
  | "NORMAL"
  | "HIGH"
  | "URGENT"
  | "CRITICAL";

// ─────────────────────────────────────────────
// UI Display labels
// ─────────────────────────────────────────────

export const STATUS_LABELS: Record<CommandStatus, string> = {
  DRAFT: "ร่าง",
  SUBMITTED: "เสนอ",
  APPROVED: "อนุมัติ",
  PUBLISHED: "เผยแพร่",
  ACKNOWLEDGED: "รับทราบ",
  IN_PROGRESS: "ปฏิบัติ",
  REPORTED: "ส่งผล",
  AUDITED: "ตรวจ",
  CLOSED: "ปิด",
};

export const STATUS_COLORS: Record<CommandStatus, string> = {
  DRAFT: "bg-slate-100 text-slate-700 border-slate-300",
  SUBMITTED: "bg-blue-50 text-blue-700 border-blue-300",
  APPROVED: "bg-emerald-50 text-emerald-700 border-emerald-300",
  PUBLISHED: "bg-cyan-50 text-cyan-700 border-cyan-300",
  ACKNOWLEDGED: "bg-violet-50 text-violet-700 border-violet-300",
  IN_PROGRESS: "bg-amber-50 text-amber-700 border-amber-300",
  REPORTED: "bg-orange-50 text-orange-700 border-orange-300",
  AUDITED: "bg-pink-50 text-pink-700 border-pink-300",
  CLOSED: "bg-slate-100 text-slate-600 border-slate-300",
};

export const PRIORITY_LABELS: Record<CommandPriority, string> = {
  LOW: "ต่ำ",
  NORMAL: "ปกติ",
  HIGH: "สูง",
  URGENT: "ด่วน",
  CRITICAL: "ด่วนที่สุด",
};

export const PRIORITY_COLORS: Record<CommandPriority, string> = {
  LOW: "bg-slate-100 text-slate-600",
  NORMAL: "bg-blue-100 text-blue-700",
  HIGH: "bg-amber-100 text-amber-700",
  URGENT: "bg-orange-100 text-orange-700",
  CRITICAL: "bg-red-100 text-red-700",
};

// ─────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────

/** สถานะลำดับเลขสำหรับ Kanban ordering */
export const STATUS_ORDER: CommandStatus[] = [
  "DRAFT",
  "SUBMITTED",
  "APPROVED",
  "PUBLISHED",
  "ACKNOWLEDGED",
  "IN_PROGRESS",
  "REPORTED",
  "AUDITED",
  "CLOSED",
];

/** Format Thai doc number — เช่น "ตร 0001.69/0042" */
export function formatDocNo(num: number, year: number = 2569): string {
  const padded = String(num).padStart(4, "0");
  return `ตร ๐๐๐๑.๖๙/${toThaiDigits(padded)}`;
}

export function toThaiDigits(s: string): string {
  const map: Record<string, string> = {
    "0": "๐",
    "1": "๑",
    "2": "๒",
    "3": "๓",
    "4": "๔",
    "5": "๕",
    "6": "๖",
    "7": "๗",
    "8": "๘",
    "9": "๙",
  };
  return s
    .split("")
    .map((c) => map[c] ?? c)
    .join("");
}
