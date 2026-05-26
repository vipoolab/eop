// Types for ระบบร่างหนังสือสั่งการ (Command Drafting Workflow)
//
// Full lifecycle (8 stages):
//   DRAFT       — junior staff drafts a proposal
//   SUBMITTED   — proposal sent to supervisor for approval
//   APPROVED    — supervisor approved with digital signature
//   DISPATCHED  — command broadcast to target units
//   ↓ per-unit lifecycle (parallel):
//     PENDING → ACKNOWLEDGED → IN_PROGRESS → REPORTED
//   IN_PROGRESS — at least one unit is acting (rollup)
//   REPORTED    — all units have submitted reports (rollup)
//   CLOSED      — owner closed the command

export type CommandStatus =
  | "DRAFT"
  | "SUBMITTED"
  | "APPROVED"
  | "DISPATCHED"
  | "IN_PROGRESS"
  | "REPORTED"
  | "CLOSED"
  | "REJECTED";

export type UnitStatus =
  | "PENDING" // ยังไม่รับทราบ
  | "ACKNOWLEDGED" // รับทราบแล้ว
  | "IN_PROGRESS" // เริ่มปฏิบัติ
  | "REPORTED" // ส่งผลแล้ว
  | "CLOSED"; // ปิดงาน (รวมระดับ command)

export type WizardStep =
  | "INTENT"
  | "DRAFT"
  | "TARGETS"
  | "SCHEDULE"
  | "KPI"
  | "REVIEW";

// ── Letter ────────────────────────────────────
// Format: "คำสั่ง" (one of three subtypes of หนังสือสั่งการ) per
// ระเบียบสำนักนายกรัฐมนตรีว่าด้วยงานสารบรรณ พ.ศ. ๒๕๒๖ ข้อ ๒๒.
//
// Structure:
//   คำสั่งสำนักงานตำรวจแห่งชาติ
//        ที่ ๑๒๓/๒๕๖๙
//   เรื่อง <subject>
//   ────────────────────
//   <objective> ── ความนำ: ที่มา/เหตุผล
//   <legalBasis> ── อาศัยอำนาจตาม...
//   จึงสั่งให้ดำเนินการดังต่อไปนี้
//        ๑. <directives[0]>
//        ๒. <directives[1]>
//        ...
//   <effectiveClause> ── ทั้งนี้ ตั้งแต่บัดนี้เป็นต้นไป...
//                       สั่ง ณ วันที่ ...
//   (signature)
export interface CommandLetter {
  /** เลขที่คำสั่ง — รูปแบบ "๑๒๓/๒๕๖๙" (เลขไทย) */
  docNumber?: string;
  /** PoC #1 — หัวเรื่อง (ไม่ต้องขึ้นต้น "เรื่อง" — UI ใส่ให้) */
  subject: string;
  /**
   * PoC #2 — หน่วยรับคำสั่ง (สำหรับการกระจาย+ติดตาม)
   * ใน format "คำสั่ง" ไม่ปรากฏเป็น "เรียน" ในเอกสาร — แต่เก็บไว้
   * เพื่อกำหนดเป้าหมายของคำสั่ง และใช้แสดงข้างนอกเอกสาร (sidebar)
   */
  recipient: string;
  /** PoC #3 — ที่มา/เหตุผล/วัตถุประสงค์ (ความนำ ๑-๒ ย่อหน้า) */
  objective?: string;
  /** อ้างถึง (ระเบียบ/หนังสือก่อนหน้า) */
  references?: string[];
  /** สิ่งที่ส่งมาด้วย */
  attachments?: string[];
  /**
   * อาศัยอำนาจตาม... (ส่วนสำคัญของคำสั่ง — ระบุกฎหมาย/ระเบียบที่ให้อำนาจ)
   * ตัวอย่าง: "อาศัยอำนาจตามความในมาตรา ๑๑ แห่งพระราชบัญญัติตำรวจ
   *           แห่งชาติ พ.ศ. ๒๕๖๕ ผู้บัญชาการตำรวจแห่งชาติ จึงสั่งให้..."
   */
  legalBasis?: string;
  /**
   * (Legacy) introduction — เนื้อความเต็มแบบไม่แยกส่วน
   * ใช้สำหรับ command เก่าก่อน migrate มาเป็น format คำสั่ง
   */
  introduction?: string;
  /** PoC #4 — ข้อสั่งการหลัก (เลขไทย ๑./๒./๓.) */
  directives: string[];
  /** PoC #5 — ระยะเวลา/วิธีรายงานผล (รวมในข้อสั่งการหรือแยก) */
  reportInstruction?: string;
  /**
   * คำลงท้าย "ทั้งนี้ ตั้งแต่บัดนี้เป็นต้นไป" หรือระบุช่วงเวลา
   * ตัวอย่าง: "ทั้งนี้ ตั้งแต่บัดนี้เป็นต้นไป จนถึงวันที่ ๒๕ มิถุนายน พ.ศ. ๒๕๖๙"
   */
  effectiveClause?: string;
  /**
   * (Legacy) closing — "จึงเรียนมาเพื่อทราบและถือปฏิบัติ..."
   * ใช้กับ format หนังสือภายนอกเดิม — คำสั่งใหม่ใช้ effectiveClause แทน
   */
  closing?: string;
  /** วันที่ลงนาม "สั่ง ณ วันที่ ..." (ISO string) */
  signedAtDate?: string;
  signerName?: string;
  signerTitle?: string;
  signerDate?: string;
  // Digital signature applied at approval time
  signatureApplied?: boolean;
  signatureText?: string;
  signatureAppliedAt?: string;

  // ───── v3 fields (match real RTP คำสั่ง samples) ─────
  /**
   * ชื่อเต็มหน่วยที่ออกคำสั่ง — ใช้ใน header "คำสั่ง<unitFullName>"
   * เช่น "สำนักงานตำรวจแห่งชาติ" หรือ "สถานีตำรวจภูธรบ้านหลวง จังหวัดน่าน"
   * ถ้าไม่ระบุ default = "สำนักงานตำรวจแห่งชาติ"
   */
  unitFullName?: string;
  /** ต่อท้าย subject เช่น "(เพิ่มเติม)" / "(ฉบับที่ ๒)" */
  subjectSuffix?: string;
  /**
   * true → เป็นคำสั่งแก้ไข/เพิ่มเติมคำสั่งเดิม
   * → ใช้คำลงท้าย "นอกนั้นให้เป็นไปตามคำสั่งเดิมทุกประการ"
   */
  isAmendment?: boolean;
  /** ยศของผู้ลงนาม (บรรทัดบน signature) เช่น "พลตำรวจเอก" */
  signerRank?: string;
  /**
   * กรณีลงนามแทน — "ปฏิบัติราชการแทน" + ตำแหน่งเจ้าของอำนาจ
   * เช่น signerTitle="รองผู้บัญชาการตำรวจแห่งชาติ ปฏิบัติราชการแทน"
   *      signerActingFor="ผู้บัญชาการตำรวจแห่งชาติ"
   */
  signerActingFor?: string;
  /** "นิยาม" — คำศัพท์ที่นิยามไว้ต้นคำสั่ง (optional) */
  glossary?: { term: string; definition: string }[];
  /** รูปแบบวันที่: "abbreviated" = พ.ศ. (ตร.) / "full" = เดือน...พุทธศักราช (สภ.) */
  dateStyle?: "abbreviated" | "full";
  /** เส้นคั่นใต้ "เรื่อง": none (ตร.) / asterisks (สภ.) / underline */
  dividerStyle?: "none" | "asterisks" | "underline";
}

// ── Plan alignment ────────────────────────────
export interface CommandAlignment {
  nationalStrategyItemIds: string[];
  masterPlanItemIds: string[];
  actionPlanItemIds: string[];
  explanation: string;
}

// ── KPI ───────────────────────────────────────
export type KpiType = "QUANTITATIVE" | "QUALITATIVE";

export interface KpiDefinition {
  id: string;
  type: KpiType;
  metric: string;
  unit?: string;
  targetTotal?: number;
  reportFrequency: "DAILY" | "WEEKLY" | "MONTHLY" | "END_OF_PERIOD";
  description?: string;
  reportFormId?: string; // linked ReportForm id — used for QUALITATIVE KPIs
}

export interface KpiAssignment {
  kpiId: string;
  unitId: string;
  targetShare?: number;
  status: "PENDING" | "REPORTING" | "COMPLETED" | "OVERDUE";
  currentValue?: number;
  lastReportedAt?: string;
}

// ── Per-unit progress tracking ────────────────
export interface UnitProgressReport {
  id: string;
  reportedAt: string;
  reportedBy: string; // persona id
  reportedByName: string;
  reportedByTitle: string;
  notes?: string;
  kpiValues: { kpiId: string; value: number; note?: string }[];
}

export interface UnitProgress {
  unitId: string;
  status: UnitStatus;
  acknowledgedAt?: string;
  acknowledgedBy?: string; // persona id
  acknowledgedByName?: string;
  startedAt?: string;
  startedBy?: string;
  startedByName?: string;
  closedAt?: string;
  reports: UnitProgressReport[];
}

// ── Status log entry (audit trail) ────────────
export interface StatusLogEntry {
  timestamp: string;
  fromStatus: CommandStatus;
  toStatus: CommandStatus;
  byPersonaId: string;
  byName: string;
  byTitle: string;
  note?: string;
}

// ── Targets ───────────────────────────────────
export type CascadeMode = "DIRECT" | "CASCADE";

// ── Priority + Emergency ──────────────────────
export type CommandPriority = "NORMAL" | "URGENT" | "EMERGENCY";

export type EmergencyTriggerType =
  | "เหตุก่อการร้าย"
  | "ภัยพิบัติ"
  | "การชุมนุมรุนแรง"
  | "เหตุคนร้ายติดอาวุธ"
  | "อาชญากรรมต่อเนื่อง"
  | "อื่นๆ";

export interface EmergencyMeta {
  triggeredAt: string;
  triggerType: EmergencyTriggerType;
  location?: string;
  description: string;
  /** True if this command was auto-dispatched (bypassed approval flow) */
  autoDispatched: boolean;
}

// ── Notification + Escalation ─────────────────
export type NotificationChannel = "EMAIL" | "LINE" | "SMS" | "PUSH" | "RADIO";

export interface NotificationLog {
  id: string;
  channel: NotificationChannel;
  recipient: string; // unit name or persona name (display)
  recipientId: string; // unit id or persona id
  sentAt: string;
  status: "SENT" | "DELIVERED" | "READ" | "FAILED";
  readAt?: string;
  message: string;
}

export type EscalationReason = "NO_ACK_TIMEOUT" | "OVERDUE_REPORT" | "MANUAL";

export interface EscalationLog {
  id: string;
  reason: EscalationReason;
  triggeredAt: string;
  fromUnitId: string;
  toUnitId: string; // escalated to (higher level)
  toUnitName: string;
  note: string;
}

// ── Command (entity) ──────────────────────────
export interface Command {
  id: string;
  status: CommandStatus;

  // Step 1
  userIntent: string;

  // Step 2 (AI)
  letter: CommandLetter;
  alignment: CommandAlignment;
  draftedBy: string; // AI model
  draftedAt: string;
  draftDurationMs?: number;
  draftTokens?: number;

  // Step 3
  targetUnitIds: string[];
  cascadeMode: CascadeMode;
  effectiveUnitIds: string[];

  // Step 4
  effectiveDate: string;
  dueDate: string;

  // Step 5
  kpis: KpiDefinition[];
  assignments: KpiAssignment[];

  // ── Workflow ──
  // Creator (persona who drafted)
  createdBy: string;
  createdByName: string;
  createdByTitle: string;
  createdAt: string;

  // Approval flow
  proposedApproverId?: string; // persona id of intended approver
  submittedAt?: string;
  submittedBy?: string;
  submittedByName?: string;

  approvedAt?: string;
  approvedBy?: string;
  approvedByName?: string;
  approvedByTitle?: string;
  rejectedAt?: string;
  rejectedBy?: string;
  rejectionReason?: string;

  dispatchedAt?: string;
  closedAt?: string;
  closedBy?: string;
  closedByName?: string;

  // Per-unit progress (one entry per effective unit)
  unitProgress: UnitProgress[];

  // Audit trail
  statusLog: StatusLogEntry[];

  // ── Priority + Emergency ──
  /** Defaults to NORMAL when absent for backward compatibility */
  priority?: CommandPriority;
  /** Set when priority is EMERGENCY */
  emergency?: EmergencyMeta;
  /** Notification fan-out log (channel/recipient/status). */
  notifications: NotificationLog[];
  /** Escalation events (e.g. no-ack timeout → bumped up the chain). */
  escalations: EscalationLog[];
}

// ── AI Drafter I/O ────────────────────────────
// PoC-style 3-input draft format
export interface DraftInputFields {
  keywords: string;      // คำสำคัญ (e.g. "คอลเซ็นเตอร์, จับกุม, ภาคเหนือ")
  baseInfo: string;      // ข้อมูลตั้งต้น (data points, who/what/where)
  context: string;       // บริบทที่เกี่ยวข้อง (background, situation)
}

export interface DrafterInput {
  // PoC-style 3-input fields (preferred)
  fields?: DraftInputFields;
  // Legacy free-text intent (fallback for compat)
  intent: string;

  signerName: string;
  signerTitle: string;
  signerUnit: string;
  candidatePlans: {
    nationalStrategy: { id: string; number: string; name: string; description?: string }[];
    masterPlans: { id: string; number: string; name: string; description?: string }[];
    actionPlans: { id: string; number: string; name: string; description?: string }[];
  };
  // List of units this persona may target (so AI can suggest matching ones)
  candidateUnits?: { id: string; code: string; name: string; shortName?: string; level: number }[];
}

export interface DrafterOutput {
  letter: CommandLetter;
  alignment: CommandAlignment;
  suggestedKpis: KpiDefinition[];
  // AI-suggested targets + duration — wizard pre-fills these for user review
  suggestedTargetUnitIds?: string[];
  suggestedCascadeMode?: CascadeMode;
  suggestedDurationDays?: number;
}

// ── Stage labels for UI ───────────────────────
export const STATUS_LABELS: Record<CommandStatus, string> = {
  DRAFT: "ร่าง",
  SUBMITTED: "เสนอเพื่ออนุมัติ",
  APPROVED: "อนุมัติแล้ว",
  DISPATCHED: "เผยแพร่",
  IN_PROGRESS: "กำลังปฏิบัติ",
  REPORTED: "ส่งผลครบ",
  CLOSED: "ปิดงาน",
  REJECTED: "ตีกลับ",
};

export const STATUS_FLOW: CommandStatus[] = [
  "DRAFT",
  "SUBMITTED",
  "APPROVED",
  "DISPATCHED",
  "IN_PROGRESS",
  "REPORTED",
  "CLOSED",
];

export const UNIT_STATUS_LABELS: Record<UnitStatus, string> = {
  PENDING: "รอรับทราบ",
  ACKNOWLEDGED: "รับทราบแล้ว",
  IN_PROGRESS: "กำลังปฏิบัติ",
  REPORTED: "ส่งผลแล้ว",
  CLOSED: "ปิด",
};

export const UNIT_STATUS_FLOW: UnitStatus[] = [
  "PENDING",
  "ACKNOWLEDGED",
  "IN_PROGRESS",
  "REPORTED",
  "CLOSED",
];

export const PRIORITY_LABELS: Record<CommandPriority, string> = {
  NORMAL: "ปกติ",
  URGENT: "ด่วน",
  EMERGENCY: "ด่วนที่สุด / ฉุกเฉิน",
};

export const EMERGENCY_TRIGGER_TYPES: EmergencyTriggerType[] = [
  "เหตุก่อการร้าย",
  "ภัยพิบัติ",
  "การชุมนุมรุนแรง",
  "เหตุคนร้ายติดอาวุธ",
  "อาชญากรรมต่อเนื่อง",
  "อื่นๆ",
];
