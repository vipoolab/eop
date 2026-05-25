// Seed data — realistic mock commands in various lifecycle stages
// Used to demonstrate tracking dashboard with proportional late detection.
// Called once on first store access.

import type {
  Command,
  EscalationLog,
  KpiAssignment,
  NotificationLog,
  StatusLogEntry,
  UnitProgress,
} from "./types";

/** Days offset from today (negative = past, positive = future) */
function d(offsetDays: number): string {
  const dt = new Date();
  dt.setDate(dt.getDate() + offsetDays);
  return dt.toISOString();
}

/** Hours offset from now (negative = past, positive = future) */
function dHoursAgo(hours: number): string {
  const dt = new Date();
  dt.setHours(dt.getHours() - hours);
  return dt.toISOString();
}

function dHoursFromNow(hours: number): string {
  const dt = new Date();
  dt.setHours(dt.getHours() + hours);
  return dt.toISOString();
}

function makeReport(
  unitId: string,
  personaId: string,
  personaName: string,
  title: string,
  kpiValues: { kpiId: string; value: number; note?: string }[],
  daysAgo: number
) {
  return {
    id: `rep-seed-${unitId}-${daysAgo}`,
    reportedAt: d(-daysAgo),
    reportedBy: personaId,
    reportedByName: personaName,
    reportedByTitle: title,
    notes: undefined,
    kpiValues,
  };
}

function makeUnitProgress(
  unitId: string,
  status: UnitProgress["status"],
  opts: {
    ackDaysAgo?: number;
    startDaysAgo?: number;
    reports?: UnitProgress["reports"];
    personaId?: string;
    personaName?: string;
    personaTitle?: string;
  } = {}
): UnitProgress {
  const persona = opts.personaId ?? "system-seed";
  const name = opts.personaName ?? "ระบบ (seed)";
  const title = opts.personaTitle ?? "ระบบ";
  return {
    unitId,
    status,
    acknowledgedAt: opts.ackDaysAgo !== undefined ? d(-opts.ackDaysAgo) : undefined,
    acknowledgedBy: opts.ackDaysAgo !== undefined ? persona : undefined,
    acknowledgedByName: opts.ackDaysAgo !== undefined ? name : undefined,
    startedAt: opts.startDaysAgo !== undefined ? d(-opts.startDaysAgo) : undefined,
    startedBy: opts.startDaysAgo !== undefined ? persona : undefined,
    startedByName: opts.startDaysAgo !== undefined ? name : undefined,
    reports: opts.reports ?? [],
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// Command 1: ปราบปรามแก๊งคอลเซ็นเตอร์ภาคเหนือ
// Duration: 30 days | Elapsed: ~20 days (66%) | Effective: –20d | Due: +10d
// Units: 4 จังหวัดภาค 5
// KPI: จับกุม 50 ราย/จังหวัด
// 2 หน่วยล่าช้า (ชร=36%, ลป=24%) vs expected 66%
// ─────────────────────────────────────────────────────────────────────────────
const CMD1_ID = "cmd-seed-001-callcenter";
const CMD1_UNITS = ["u-prov-5-ชม", "u-prov-5-ชร", "u-prov-5-ลป", "u-prov-5-ลพ"];
const CMD1_PROGRESS: Record<string, number> = { "u-prov-5-ชม": 38, "u-prov-5-ชร": 18, "u-prov-5-ลป": 12, "u-prov-5-ลพ": 30 };

const cmd1: Command = {
  id: CMD1_ID,
  status: "IN_PROGRESS",
  priority: "NORMAL",
  notifications: [],
  escalations: [],
  userIntent: "ปราบปรามแก๊งคอลเซ็นเตอร์ในพื้นที่ตำรวจภูธรภาค ๕ ให้ได้ผลเป็นรูปธรรม",
  letter: {
    docNumber: "ภ๕ 1234/2569",
    subject: "เรื่อง การปราบปรามแก๊งคอลเซ็นเตอร์ในพื้นที่ตำรวจภูธรภาค ๕",
    recipient: "เรียน ผู้บังคับการตำรวจภูธรจังหวัด ในสังกัด ภ.๕ ทุกจังหวัด",
    introduction: "ด้วยสถานการณ์การหลอกลวงทางโทรศัพท์โดยแก๊งคอลเซ็นเตอร์ในพื้นที่ภาค ๕ มีแนวโน้มเพิ่มขึ้นอย่างต่อเนื่อง ส่งผลกระทบต่อประชาชนเป็นวงกว้าง จึงให้ดำเนินการดังนี้",
    directives: [
      "๑. ให้ บก.สส. ของแต่ละจังหวัดเร่งรัดสืบสวนเครือข่ายแก๊งคอลเซ็นเตอร์ในพื้นที่",
      "๒. ให้ประสานหน่วยงานที่เกี่ยวข้องดำเนินการจับกุมผู้กระทำผิดโดยเร่งด่วน",
      "๓. ให้รายงานความคืบหน้าทุกสัปดาห์ผ่านระบบ EOP",
    ],
    reportInstruction: "ให้รายงานจำนวนผู้ถูกจับกุมทุกสัปดาห์",
    closing: "จึงเรียนมาเพื่อทราบและถือปฏิบัติโดยเคร่งครัด",
    signatureApplied: true,
    signatureText: "พล.ต.ท. กิตติ์รัฐ พันธุ์เพ็ชร์",
    signatureAppliedAt: d(-19),
    signerName: "พล.ต.ท. กิตติ์รัฐ พันธุ์เพ็ชร์",
    signerTitle: "ผบช.ภาค ๕",
  },
  alignment: {
    nationalStrategyItemIds: ["ns-2"],
    masterPlanItemIds: ["mp-10"],
    actionPlanItemIds: ["ap-2-1"],
    explanation: "สอดคล้องกับยุทธศาสตร์ความมั่นคง ด้านการปราบปรามอาชญากรรมข้ามชาติ",
  },
  draftedBy: "ai-engine",
  draftedAt: d(-21),
  targetUnitIds: ["u-prov-5-ชม"],
  cascadeMode: "DIRECT",
  effectiveUnitIds: CMD1_UNITS,
  effectiveDate: d(-20),
  dueDate: d(10),
  kpis: [
    { id: "kpi-c1-arrest", type: "QUANTITATIVE", metric: "จำนวนผู้ถูกจับกุม", unit: "ราย", targetTotal: 200, reportFrequency: "WEEKLY" },
    { id: "kpi-c1-report", type: "QUALITATIVE", metric: "รายงานสรุปผลการปฏิบัติ", reportFrequency: "WEEKLY" },
  ],
  assignments: CMD1_UNITS.flatMap((uid) => [
    { kpiId: "kpi-c1-arrest", unitId: uid, targetShare: 50, status: "REPORTING", currentValue: CMD1_PROGRESS[uid], lastReportedAt: d(-3) },
    { kpiId: "kpi-c1-report", unitId: uid, status: "REPORTING", currentValue: 2 },
  ]) as KpiAssignment[],
  createdBy: "p-aide-bch-5",
  createdByName: "พล.ต.ต. ทรงพล ปัสนานนท์",
  createdByTitle: "รอง ผบช.",
  createdAt: d(-21),
  proposedApproverId: "p-bch-5",
  submittedAt: d(-20),
  submittedBy: "p-aide-bch-5",
  submittedByName: "พล.ต.ต. ทรงพล ปัสนานนท์",
  approvedAt: d(-19),
  approvedBy: "p-bch-5",
  approvedByName: "พล.ต.ท. กิตติ์รัฐ พันธุ์เพ็ชร์",
  approvedByTitle: "ผบช.",
  dispatchedAt: d(-19),
  unitProgress: CMD1_UNITS.map((uid) =>
    makeUnitProgress(uid, "IN_PROGRESS", {
      ackDaysAgo: 18,
      startDaysAgo: 17,
      personaId: "p-prov-cm",
      personaName: "พล.ต.ต. ภาคภูมิ ไชยหงษ์",
      personaTitle: "ผบก.",
      reports: [
        makeReport(uid, "p-prov-cm", "พล.ต.ต. ภาคภูมิ ไชยหงษ์", "ผบก.", [
          { kpiId: "kpi-c1-arrest", value: Math.floor(CMD1_PROGRESS[uid] * 0.6), note: "รายงานสัปดาห์แรก" },
          { kpiId: "kpi-c1-report", value: 1 },
        ], 10),
        makeReport(uid, "p-prov-cm", "พล.ต.ต. ภาคภูมิ ไชยหงษ์", "ผบก.", [
          { kpiId: "kpi-c1-arrest", value: CMD1_PROGRESS[uid] - Math.floor(CMD1_PROGRESS[uid] * 0.6), note: "รายงานสัปดาห์ที่ 2" },
          { kpiId: "kpi-c1-report", value: 1 },
        ], 3),
      ],
    })
  ),
  statusLog: [
    { timestamp: d(-21), fromStatus: "DRAFT", toStatus: "SUBMITTED", byPersonaId: "p-aide-bch-5", byName: "พล.ต.ต. ทรงพล ปัสนานนท์", byTitle: "รอง ผบช.", note: "เสนอเพื่ออนุมัติ" },
    { timestamp: d(-19), fromStatus: "SUBMITTED", toStatus: "APPROVED", byPersonaId: "p-bch-5", byName: "พล.ต.ท. กิตติ์รัฐ พันธุ์เพ็ชร์", byTitle: "ผบช." },
    { timestamp: d(-19), fromStatus: "APPROVED", toStatus: "DISPATCHED", byPersonaId: "system", byName: "ระบบ", byTitle: "auto-dispatch" },
    { timestamp: d(-17), fromStatus: "DISPATCHED", toStatus: "IN_PROGRESS", byPersonaId: "system", byName: "ระบบ", byTitle: "auto-rollup", note: "มีหน่วยเริ่มปฏิบัติแล้ว" },
  ] as StatusLogEntry[],
};

// ─────────────────────────────────────────────────────────────────────────────
// Command 2: ปิดล้อมยาเสพติดภาคอีสานตอนบน
// Duration: 60 days | Elapsed: ~30 days (50%) | Effective: –30d | Due: +30d
// Units: 4 จังหวัดภาค 4
// KPI: จับกุมคดียาเสพติด 80 ราย/จังหวัด
// 2 หน่วยล่าช้า (อด=31%, นค=15%) vs expected 50%
// ─────────────────────────────────────────────────────────────────────────────
const CMD2_ID = "cmd-seed-002-drugs";
const CMD2_UNITS = ["u-prov-4-ขก", "u-prov-4-อด", "u-prov-4-นค", "u-prov-4-ลย"];
const CMD2_PROGRESS: Record<string, number> = { "u-prov-4-ขก": 45, "u-prov-4-อด": 25, "u-prov-4-นค": 12, "u-prov-4-ลย": 38 };

const cmd2: Command = {
  id: CMD2_ID,
  status: "IN_PROGRESS",
  priority: "NORMAL",
  notifications: [],
  escalations: [],
  userIntent: "ปิดล้อมและจับกุมผู้ค้ายาเสพติดรายสำคัญในพื้นที่ภาคอีสานตอนบน",
  letter: {
    docNumber: "ตร. 4590/2569",
    subject: "เรื่อง การปิดล้อมและปราบปรามยาเสพติดในพื้นที่ภาคอีสานตอนบน",
    recipient: "เรียน ผบช.ภาค ๔",
    introduction: "ตามที่ ตร. มีนโยบายเร่งด่วนในการปราบปรามยาเสพติด โดยเฉพาะในพื้นที่ชายแดนภาคอีสาน จึงให้ดำเนินการดังนี้",
    directives: [
      "๑. ให้ ภ.จว. ทุกจังหวัดในภาค ๔ ตั้งด่านตรวจสกัดยาเสพติดตลอด ๒๔ ชั่วโมง",
      "๒. ให้ประสาน DSI และ ปส. ในการสืบสวนเครือข่ายค้ายาข้ามจังหวัด",
      "๓. ให้รายงานผลการจับกุมรายสัปดาห์",
    ],
    closing: "จึงเรียนมาเพื่อทราบและถือปฏิบัติโดยเคร่งครัด",
    signatureApplied: true,
    signatureText: "พล.ต.อ. กฤษฎา ภัทรประสิทธิ์",
    signatureAppliedAt: d(-29),
    signerName: "พล.ต.อ. กฤษฎา ภัทรประสิทธิ์",
    signerTitle: "ผบ.ตร.",
  },
  alignment: {
    nationalStrategyItemIds: ["ns-2"],
    masterPlanItemIds: ["mp-10"],
    actionPlanItemIds: ["ap-2-1"],
    explanation: "สอดคล้องกับแผนปราบปรามยาเสพติดแห่งชาติ",
  },
  draftedBy: "ai-engine",
  draftedAt: d(-31),
  targetUnitIds: ["u-bch-4"],
  cascadeMode: "CASCADE",
  effectiveUnitIds: CMD2_UNITS,
  effectiveDate: d(-30),
  dueDate: d(30),
  kpis: [
    { id: "kpi-c2-arrest", type: "QUANTITATIVE", metric: "จำนวนผู้ถูกจับกุมคดียาเสพติด", unit: "ราย", targetTotal: 320, reportFrequency: "WEEKLY" },
    { id: "kpi-c2-seizure", type: "QUANTITATIVE", metric: "ปริมาณยาเสพติดของกลาง", unit: "กิโลกรัม", targetTotal: 50, reportFrequency: "WEEKLY" },
  ],
  assignments: CMD2_UNITS.flatMap((uid) => [
    { kpiId: "kpi-c2-arrest", unitId: uid, targetShare: 80, status: "REPORTING", currentValue: CMD2_PROGRESS[uid], lastReportedAt: d(-5) },
    { kpiId: "kpi-c2-seizure", unitId: uid, targetShare: 12.5, status: "REPORTING", currentValue: Math.round(CMD2_PROGRESS[uid] * 0.15 * 10) / 10 },
  ]) as KpiAssignment[],
  createdBy: "p-aide-rtp",
  createdByName: "พล.ต.ท. ณรงค์ฤทธิ์ ธรรมรัต",
  createdByTitle: "รอง ผบ.ตร.",
  createdAt: d(-31),
  proposedApproverId: "p-rtp",
  submittedAt: d(-31),
  submittedBy: "p-aide-rtp",
  submittedByName: "พล.ต.ท. ณรงค์ฤทธิ์ ธรรมรัต",
  approvedAt: d(-30),
  approvedBy: "p-rtp",
  approvedByName: "พล.ต.อ. กฤษฎา ภัทรประสิทธิ์",
  approvedByTitle: "ผบ.ตร.",
  dispatchedAt: d(-30),
  unitProgress: CMD2_UNITS.map((uid) =>
    makeUnitProgress(uid, "IN_PROGRESS", {
      ackDaysAgo: 28,
      startDaysAgo: 26,
      reports: [
        makeReport(uid, "system-seed", "ผบก. (seed)", "ผบก.", [
          { kpiId: "kpi-c2-arrest", value: Math.floor(CMD2_PROGRESS[uid] * 0.5) },
          { kpiId: "kpi-c2-seizure", value: Math.round(CMD2_PROGRESS[uid] * 0.07 * 10) / 10 },
        ], 14),
        makeReport(uid, "system-seed", "ผบก. (seed)", "ผบก.", [
          { kpiId: "kpi-c2-arrest", value: CMD2_PROGRESS[uid] - Math.floor(CMD2_PROGRESS[uid] * 0.5) },
          { kpiId: "kpi-c2-seizure", value: Math.round(CMD2_PROGRESS[uid] * 0.08 * 10) / 10 },
        ], 7),
      ],
    })
  ),
  statusLog: [
    { timestamp: d(-31), fromStatus: "DRAFT", toStatus: "SUBMITTED", byPersonaId: "p-aide-rtp", byName: "พล.ต.ท. ณรงค์ฤทธิ์ ธรรมรัต", byTitle: "รอง ผบ.ตร." },
    { timestamp: d(-30), fromStatus: "SUBMITTED", toStatus: "APPROVED", byPersonaId: "p-rtp", byName: "พล.ต.อ. กฤษฎา ภัทรประสิทธิ์", byTitle: "ผบ.ตร." },
    { timestamp: d(-30), fromStatus: "APPROVED", toStatus: "DISPATCHED", byPersonaId: "system", byName: "ระบบ", byTitle: "auto-dispatch" },
    { timestamp: d(-26), fromStatus: "DISPATCHED", toStatus: "IN_PROGRESS", byPersonaId: "system", byName: "ระบบ", byTitle: "auto-rollup" },
  ] as StatusLogEntry[],
};

// ─────────────────────────────────────────────────────────────────────────────
// Command 3: จุดตรวจจราจรเทศกาลปีใหม่ กทม. — CLOSED (สำเร็จแล้ว)
// Duration: 35 days | Ended 5 days ago | All units REPORTED
// Units: บก.น.1, บก.น.2, บก.น.3
// KPI: จุดตรวจ 100 จุด/กอง
// ─────────────────────────────────────────────────────────────────────────────
const CMD3_ID = "cmd-seed-003-checkpoint";
const CMD3_UNITS = ["u-bk-na-1", "u-bk-na-2", "u-bk-na-3"];
const CMD3_ACHIEVED: Record<string, number> = { "u-bk-na-1": 110, "u-bk-na-2": 105, "u-bk-na-3": 98 };

const cmd3: Command = {
  id: CMD3_ID,
  status: "CLOSED",
  priority: "NORMAL",
  notifications: [],
  escalations: [],
  userIntent: "ตั้งจุดตรวจจราจรช่วงเทศกาลปีใหม่เพื่อลดอุบัติเหตุในพื้นที่ กทม.",
  letter: {
    docNumber: "บช.น. 0032/2569",
    subject: "เรื่อง การตั้งจุดตรวจจราจรช่วงเทศกาลปีใหม่ ๒๕๖๙",
    recipient: "เรียน ผู้บังคับการตำรวจนครบาล ๑, ๒, ๓",
    introduction: "เนื่องในช่วงเทศกาลปีใหม่มีการเดินทางของประชาชนเป็นจำนวนมาก จึงให้ดำเนินการดังนี้",
    directives: [
      "๑. ให้ตั้งจุดตรวจจราจรตลอด ๒๔ ชั่วโมง บนถนนสายหลักในพื้นที่รับผิดชอบ",
      "๒. เน้นตรวจจับผู้ขับขี่ที่เมาสุราและไม่สวมหมวกนิรภัย",
    ],
    closing: "จึงเรียนมาเพื่อทราบและถือปฏิบัติ",
    signatureApplied: true,
    signatureText: "พล.ต.ท. สุเมธ ตันติเวชกุล",
    signatureAppliedAt: d(-44),
    signerName: "พล.ต.ท. สุเมธ ตันติเวชกุล",
    signerTitle: "ผบช.น.",
  },
  alignment: {
    nationalStrategyItemIds: ["ns-3"],
    masterPlanItemIds: [],
    actionPlanItemIds: ["ap-3-2"],
    explanation: "สอดคล้องกับแผนความปลอดภัยทางถนน",
  },
  draftedBy: "ai-engine",
  draftedAt: d(-45),
  targetUnitIds: CMD3_UNITS,
  cascadeMode: "DIRECT",
  effectiveUnitIds: CMD3_UNITS,
  effectiveDate: d(-40),
  dueDate: d(-5),
  kpis: [
    { id: "kpi-c3-checkpoint", type: "QUANTITATIVE", metric: "จำนวนจุดตรวจ", unit: "จุด", targetTotal: 300, reportFrequency: "DAILY" },
    { id: "kpi-c3-drunk", type: "QUANTITATIVE", metric: "ผู้ถูกดำเนินคดีเมาแล้วขับ", unit: "ราย", targetTotal: 150, reportFrequency: "DAILY" },
  ],
  assignments: CMD3_UNITS.flatMap((uid) => [
    { kpiId: "kpi-c3-checkpoint", unitId: uid, targetShare: 100, status: "COMPLETED", currentValue: CMD3_ACHIEVED[uid] },
    { kpiId: "kpi-c3-drunk", unitId: uid, targetShare: 50, status: "COMPLETED", currentValue: Math.round(CMD3_ACHIEVED[uid] * 0.45) },
  ]) as KpiAssignment[],
  createdBy: "p-bch-na",
  createdByName: "พล.ต.ท. สุเมธ ตันติเวชกุล",
  createdByTitle: "ผบช.",
  createdAt: d(-45),
  approvedAt: d(-44),
  approvedBy: "p-bch-na",
  approvedByName: "พล.ต.ท. สุเมธ ตันติเวชกุล",
  approvedByTitle: "ผบช.น.",
  dispatchedAt: d(-44),
  closedAt: d(-4),
  closedBy: "p-bch-na",
  closedByName: "พล.ต.ท. สุเมธ ตันติเวชกุล",
  unitProgress: CMD3_UNITS.map((uid) =>
    makeUnitProgress(uid, "REPORTED", {
      ackDaysAgo: 39,
      startDaysAgo: 38,
      reports: [
        makeReport(uid, "system-seed", "ผบก. (seed)", "ผบก.", [
          { kpiId: "kpi-c3-checkpoint", value: CMD3_ACHIEVED[uid], note: "ผลรวมตลอดเทศกาล" },
          { kpiId: "kpi-c3-drunk", value: Math.round(CMD3_ACHIEVED[uid] * 0.45) },
        ], 6),
      ],
    })
  ),
  statusLog: [
    { timestamp: d(-44), fromStatus: "DRAFT", toStatus: "APPROVED", byPersonaId: "p-bch-na", byName: "พล.ต.ท. สุเมธ ตันติเวชกุล", byTitle: "ผบช.น." },
    { timestamp: d(-44), fromStatus: "APPROVED", toStatus: "DISPATCHED", byPersonaId: "system", byName: "ระบบ", byTitle: "auto-dispatch" },
    { timestamp: d(-38), fromStatus: "DISPATCHED", toStatus: "IN_PROGRESS", byPersonaId: "system", byName: "ระบบ", byTitle: "auto-rollup" },
    { timestamp: d(-6), fromStatus: "IN_PROGRESS", toStatus: "REPORTED", byPersonaId: "system", byName: "ระบบ", byTitle: "auto-rollup" },
    { timestamp: d(-4), fromStatus: "REPORTED", toStatus: "CLOSED", byPersonaId: "p-bch-na", byName: "พล.ต.ท. สุเมธ ตันติเวชกุล", byTitle: "ผบช.น.", note: "ปิดงาน — ผลสำเร็จตามเป้า" },
  ] as StatusLogEntry[],
};

// ─────────────────────────────────────────────────────────────────────────────
// Command 4: สืบสวนอาชญากรรมทางเทคโนโลยี — DISPATCHED (เพิ่งส่ง)
// Duration: 60 days | Elapsed: ~5 days (8%)
// Units: บช.สอท. (1 unit, PENDING)
// KPI: คดีสืบสวนสำเร็จ 50 คดี
// ─────────────────────────────────────────────────────────────────────────────
const CMD4_ID = "cmd-seed-004-cybercrime";

const cmd4: Command = {
  id: CMD4_ID,
  status: "DISPATCHED",
  priority: "NORMAL",
  notifications: [],
  escalations: [],
  userIntent: "สืบสวนและจับกุมเครือข่ายอาชญากรรมทางเทคโนโลยีที่หลอกลวงนักลงทุนคริปโต",
  letter: {
    docNumber: "ตร. 5210/2569",
    subject: "เรื่อง การสืบสวนและปราบปรามอาชญากรรมทางเทคโนโลยี (คดีคริปโต)",
    recipient: "เรียน ผู้บัญชาการตำรวจสืบสวนสอบสวนอาชญากรรมทางเทคโนโลยี",
    introduction: "เนื่องจากมีรายงานว่าประชาชนถูกหลอกลวงด้านการลงทุนสกุลเงินดิจิทัลเพิ่มขึ้น จึงให้ดำเนินการ",
    directives: [
      "๑. ให้ติดตามและสืบสวนเครือข่ายหลอกลวงออนไลน์ในรูปแบบการลงทุนคริปโต",
      "๒. ประสาน Interpol และหน่วยงานต่างประเทศที่เกี่ยวข้อง",
      "๓. รายงานความคืบหน้าทุก ๒ สัปดาห์",
    ],
    closing: "จึงเรียนมาเพื่อทราบและถือปฏิบัติ",
    signatureApplied: true,
    signatureText: "พล.ต.อ. กฤษฎา ภัทรประสิทธิ์",
    signatureAppliedAt: d(-4),
    signerName: "พล.ต.อ. กฤษฎา ภัทรประสิทธิ์",
    signerTitle: "ผบ.ตร.",
  },
  alignment: {
    nationalStrategyItemIds: ["ns-2"],
    masterPlanItemIds: ["mp-10"],
    actionPlanItemIds: ["ap-2-2"],
    explanation: "สอดคล้องกับแผนการรักษาความปลอดภัยทางไซเบอร์",
  },
  draftedBy: "ai-engine",
  draftedAt: d(-6),
  targetUnitIds: ["u-bch-special-2"],
  cascadeMode: "DIRECT",
  effectiveUnitIds: ["u-bch-special-2"],
  effectiveDate: d(-5),
  dueDate: d(55),
  kpis: [
    { id: "kpi-c4-cases", type: "QUANTITATIVE", metric: "คดีสืบสวนสำเร็จ", unit: "คดี", targetTotal: 50, reportFrequency: "WEEKLY" },
    { id: "kpi-c4-assets", type: "QUANTITATIVE", metric: "ทรัพย์สินอายัดได้", unit: "ล้านบาท", targetTotal: 100, reportFrequency: "MONTHLY" },
  ],
  assignments: [
    { kpiId: "kpi-c4-cases", unitId: "u-bch-special-2", targetShare: 50, status: "PENDING", currentValue: 0 },
    { kpiId: "kpi-c4-assets", unitId: "u-bch-special-2", targetShare: 100, status: "PENDING", currentValue: 0 },
  ] as KpiAssignment[],
  createdBy: "p-aide-rtp",
  createdByName: "พล.ต.ท. ณรงค์ฤทธิ์ ธรรมรัต",
  createdByTitle: "รอง ผบ.ตร.",
  createdAt: d(-6),
  proposedApproverId: "p-rtp",
  submittedAt: d(-5),
  submittedBy: "p-aide-rtp",
  submittedByName: "พล.ต.ท. ณรงค์ฤทธิ์ ธรรมรัต",
  approvedAt: d(-4),
  approvedBy: "p-rtp",
  approvedByName: "พล.ต.อ. กฤษฎา ภัทรประสิทธิ์",
  approvedByTitle: "ผบ.ตร.",
  dispatchedAt: d(-4),
  unitProgress: [makeUnitProgress("u-bch-special-2", "PENDING")],
  statusLog: [
    { timestamp: d(-5), fromStatus: "DRAFT", toStatus: "SUBMITTED", byPersonaId: "p-aide-rtp", byName: "พล.ต.ท. ณรงค์ฤทธิ์ ธรรมรัต", byTitle: "รอง ผบ.ตร." },
    { timestamp: d(-4), fromStatus: "SUBMITTED", toStatus: "APPROVED", byPersonaId: "p-rtp", byName: "พล.ต.อ. กฤษฎา ภัทรประสิทธิ์", byTitle: "ผบ.ตร." },
    { timestamp: d(-4), fromStatus: "APPROVED", toStatus: "DISPATCHED", byPersonaId: "system", byName: "ระบบ", byTitle: "auto-dispatch" },
  ] as StatusLogEntry[],
};

// ─────────────────────────────────────────────────────────────────────────────
// Command 5: ปฏิบัติการท่องเที่ยวปลอดภัยภาคใต้
// Duration: 30 days | Elapsed: ~15 days (50%) | Effective: –15d | Due: +15d
// Units: 4 จังหวัดภาค 8
// KPI: รายงานตรวจพื้นที่ท่องเที่ยว 200 ครั้ง/จังหวัด
// 2 หน่วยล่าช้า (นศ=43%, กบ=30%) vs expected 50%
// ─────────────────────────────────────────────────────────────────────────────
const CMD5_ID = "cmd-seed-005-tourism";
const CMD5_UNITS = ["u-prov-8-สฎ", "u-prov-8-นศ", "u-prov-8-ภก", "u-prov-8-กบ"];
const CMD5_PROGRESS: Record<string, number> = { "u-prov-8-สฎ": 120, "u-prov-8-นศ": 85, "u-prov-8-ภก": 145, "u-prov-8-กบ": 60 };
const CMD5_STATUS: Record<string, UnitProgress["status"]> = { "u-prov-8-สฎ": "IN_PROGRESS", "u-prov-8-นศ": "IN_PROGRESS", "u-prov-8-ภก": "REPORTED", "u-prov-8-กบ": "IN_PROGRESS" };

const cmd5: Command = {
  id: CMD5_ID,
  status: "IN_PROGRESS",
  priority: "NORMAL",
  notifications: [],
  escalations: [],
  userIntent: "ดูแลความปลอดภัยและอำนวยความสะดวกนักท่องเที่ยวในพื้นที่ท่องเที่ยวหลักภาคใต้ช่วง High Season",
  letter: {
    docNumber: "ภ๘ 0891/2569",
    subject: "เรื่อง การดูแลความปลอดภัยนักท่องเที่ยวในพื้นที่ภาคใต้ช่วง High Season",
    recipient: "เรียน ผู้บังคับการตำรวจภูธรจังหวัด ในสังกัด ภ.๘ ทุกจังหวัด",
    introduction: "เนื่องจากช่วง High Season มีนักท่องเที่ยวทั้งในและต่างประเทศจำนวนมากในพื้นที่ภาคใต้ จึงให้ดำเนินการ",
    directives: [
      "๑. ให้เพิ่มกำลังตรวจตราในพื้นที่แหล่งท่องเที่ยวหลักทุกวัน",
      "๒. ให้ประสาน Tourism Police บูรณาการการทำงาน",
      "๓. รายงานสถานการณ์และคดีสำคัญทุก ๒ วัน",
    ],
    closing: "จึงเรียนมาเพื่อทราบและถือปฏิบัติ",
    signatureApplied: true,
    signatureText: "พล.ต.ท. สุรพงษ์ ถนอมจิตร",
    signatureAppliedAt: d(-14),
    signerName: "พล.ต.ท. สุรพงษ์ ถนอมจิตร",
    signerTitle: "ผบช.ภาค ๘",
  },
  alignment: {
    nationalStrategyItemIds: ["ns-3"],
    masterPlanItemIds: [],
    actionPlanItemIds: ["ap-3-2"],
    explanation: "สอดคล้องกับนโยบายส่งเสริมการท่องเที่ยวและความปลอดภัยสาธารณะ",
  },
  draftedBy: "ai-engine",
  draftedAt: d(-16),
  targetUnitIds: ["u-bch-8"],
  cascadeMode: "CASCADE",
  effectiveUnitIds: CMD5_UNITS,
  effectiveDate: d(-15),
  dueDate: d(15),
  kpis: [
    { id: "kpi-c5-patrol", type: "QUANTITATIVE", metric: "ครั้งที่ตรวจพื้นที่ท่องเที่ยว", unit: "ครั้ง", targetTotal: 800, reportFrequency: "WEEKLY" },
    { id: "kpi-c5-tourist-cases", type: "QUANTITATIVE", metric: "คดีเกี่ยวกับนักท่องเที่ยว", unit: "คดี", targetTotal: 20, reportFrequency: "WEEKLY" },
  ],
  assignments: CMD5_UNITS.flatMap((uid) => [
    { kpiId: "kpi-c5-patrol", unitId: uid, targetShare: 200, status: "REPORTING", currentValue: CMD5_PROGRESS[uid], lastReportedAt: d(-2) },
    { kpiId: "kpi-c5-tourist-cases", unitId: uid, targetShare: 5, status: "REPORTING", currentValue: Math.round(CMD5_PROGRESS[uid] / 25) },
  ]) as KpiAssignment[],
  createdBy: "p-bch-5",
  createdByName: "พล.ต.ท. สุรพงษ์ ถนอมจิตร",
  createdByTitle: "ผบช.",
  createdAt: d(-16),
  approvedAt: d(-14),
  approvedBy: "p-bch-5",
  approvedByName: "พล.ต.ท. สุรพงษ์ ถนอมจิตร",
  approvedByTitle: "ผบช.ภาค ๘",
  dispatchedAt: d(-14),
  unitProgress: CMD5_UNITS.map((uid) => {
    const reports = [
      makeReport(uid, "system-seed", "ผบก. (seed)", "ผบก.", [
        { kpiId: "kpi-c5-patrol", value: CMD5_PROGRESS[uid], note: "รายงานสะสมตั้งแต่เริ่ม" },
        { kpiId: "kpi-c5-tourist-cases", value: Math.round(CMD5_PROGRESS[uid] / 25) },
      ], 2),
    ];
    return makeUnitProgress(uid, CMD5_STATUS[uid], {
      ackDaysAgo: 13,
      startDaysAgo: 12,
      reports: CMD5_STATUS[uid] === "REPORTED" ? reports : reports,
    });
  }),
  statusLog: [
    { timestamp: d(-15), fromStatus: "DRAFT", toStatus: "APPROVED", byPersonaId: "p-bch-5", byName: "พล.ต.ท. สุรพงษ์ ถนอมจิตร", byTitle: "ผบช." },
    { timestamp: d(-14), fromStatus: "APPROVED", toStatus: "DISPATCHED", byPersonaId: "system", byName: "ระบบ", byTitle: "auto-dispatch" },
    { timestamp: d(-12), fromStatus: "DISPATCHED", toStatus: "IN_PROGRESS", byPersonaId: "system", byName: "ระบบ", byTitle: "auto-rollup" },
  ] as StatusLogEntry[],
};

// ─────────────────────────────────────────────────────────────────────────────
// Command 6 (EMERGENCY): เหตุก่อการร้ายห้างสรรพสินค้า — ACTIVE (3 ชั่วโมงก่อน)
// auto-dispatched, all units ACKNOWLEDGED + 2 reporting, 6 notifications
// ─────────────────────────────────────────────────────────────────────────────
const CMD6_ID = "cmd-seed-emergency-001";
const CMD6_UNITS = ["u-bk-na-1", "u-bk-na-2", "u-bk-na-3"];
const CMD6_UNIT_NAMES: Record<string, string> = {
  "u-bk-na-1": "บก.น.๑",
  "u-bk-na-2": "บก.น.๒",
  "u-bk-na-3": "บก.น.๓",
};
const CMD6_HEAD_NAMES: Record<string, string> = {
  "u-bk-na-1": "ผบก. กองบังคับการตำรวจนครบาล ๑",
  "u-bk-na-2": "ผบก. กองบังคับการตำรวจนครบาล ๒",
  "u-bk-na-3": "ผบก. กองบังคับการตำรวจนครบาล ๓",
};

// Six notification logs for emergency 001: bk-na-1 (READ all), bk-na-2 (mixed), bk-na-3 (partial)
const CMD6_NOTIFICATIONS: NotificationLog[] = [
  // — บก.น.๑ : รับทราบเร็ว (READ ครบทุกช่องทาง)
  {
    id: "notif-em01-001",
    channel: "EMAIL",
    recipient: CMD6_HEAD_NAMES["u-bk-na-1"],
    recipientId: "u-bk-na-1",
    sentAt: dHoursAgo(2.95),
    status: "READ",
    readAt: dHoursAgo(2.8),
    message:
      "เร่งด่วนสูงสุด — สั่งการรับมือเหตุก่อการร้ายห้างสรรพสินค้าพันทิป ประตูน้ำ กรุณารับทราบและเริ่มปฏิบัติทันที",
  },
  {
    id: "notif-em01-002",
    channel: "LINE",
    recipient: CMD6_HEAD_NAMES["u-bk-na-1"],
    recipientId: "u-bk-na-1",
    sentAt: dHoursAgo(2.95),
    status: "READ",
    readAt: dHoursAgo(2.85),
    message: "🚨 เหตุก่อการร้าย ห้างพันทิป ประตูน้ำ — รับมือด่วน",
  },
  {
    id: "notif-em01-003",
    channel: "SMS",
    recipient: CMD6_HEAD_NAMES["u-bk-na-1"],
    recipientId: "u-bk-na-1",
    sentAt: dHoursAgo(2.95),
    status: "READ",
    readAt: dHoursAgo(2.85),
    message: "[ตร. EOC] EMERGENCY: ก่อการร้ายพันทิป ตอบรับด่วน",
  },
  {
    id: "notif-em01-004",
    channel: "RADIO",
    recipient: CMD6_HEAD_NAMES["u-bk-na-1"],
    recipientId: "u-bk-na-1",
    sentAt: dHoursAgo(2.93),
    status: "DELIVERED",
    message: "ความถี่ฉุกเฉิน — รับมือเหตุพันทิป",
  },
  // — บก.น.๒ : EMAIL/LINE/SMS READ, RADIO FAILED (สัญญาณตก)
  {
    id: "notif-em01-005",
    channel: "EMAIL",
    recipient: CMD6_HEAD_NAMES["u-bk-na-2"],
    recipientId: "u-bk-na-2",
    sentAt: dHoursAgo(2.95),
    status: "READ",
    readAt: dHoursAgo(2.7),
    message:
      "เร่งด่วนสูงสุด — สั่งการรับมือเหตุก่อการร้ายห้างสรรพสินค้าพันทิป ประตูน้ำ กรุณารับทราบและเริ่มปฏิบัติทันที",
  },
  {
    id: "notif-em01-006",
    channel: "LINE",
    recipient: CMD6_HEAD_NAMES["u-bk-na-2"],
    recipientId: "u-bk-na-2",
    sentAt: dHoursAgo(2.95),
    status: "READ",
    readAt: dHoursAgo(2.75),
    message: "🚨 เหตุก่อการร้าย ห้างพันทิป ประตูน้ำ — รับมือด่วน",
  },
  {
    id: "notif-em01-007",
    channel: "SMS",
    recipient: CMD6_HEAD_NAMES["u-bk-na-2"],
    recipientId: "u-bk-na-2",
    sentAt: dHoursAgo(2.95),
    status: "DELIVERED",
    message: "[ตร. EOC] EMERGENCY: ก่อการร้ายพันทิป ตอบรับด่วน",
  },
  {
    id: "notif-em01-008",
    channel: "RADIO",
    recipient: CMD6_HEAD_NAMES["u-bk-na-2"],
    recipientId: "u-bk-na-2",
    sentAt: dHoursAgo(2.93),
    status: "FAILED",
    message: "วิทยุ — สัญญาณตก ไม่สามารถเชื่อมต่อได้",
  },
  // — บก.น.๓ : EMAIL DELIVERED, LINE READ, SMS READ, RADIO READ
  {
    id: "notif-em01-009",
    channel: "EMAIL",
    recipient: CMD6_HEAD_NAMES["u-bk-na-3"],
    recipientId: "u-bk-na-3",
    sentAt: dHoursAgo(2.95),
    status: "DELIVERED",
    message:
      "เร่งด่วนสูงสุด — สั่งการรับมือเหตุก่อการร้ายห้างสรรพสินค้าพันทิป ประตูน้ำ กรุณารับทราบและเริ่มปฏิบัติทันที",
  },
  {
    id: "notif-em01-010",
    channel: "LINE",
    recipient: CMD6_HEAD_NAMES["u-bk-na-3"],
    recipientId: "u-bk-na-3",
    sentAt: dHoursAgo(2.95),
    status: "READ",
    readAt: dHoursAgo(2.6),
    message: "🚨 เหตุก่อการร้าย ห้างพันทิป ประตูน้ำ — รับมือด่วน",
  },
  {
    id: "notif-em01-011",
    channel: "SMS",
    recipient: CMD6_HEAD_NAMES["u-bk-na-3"],
    recipientId: "u-bk-na-3",
    sentAt: dHoursAgo(2.95),
    status: "READ",
    readAt: dHoursAgo(2.65),
    message: "[ตร. EOC] EMERGENCY: ก่อการร้ายพันทิป ตอบรับด่วน",
  },
  {
    id: "notif-em01-012",
    channel: "RADIO",
    recipient: CMD6_HEAD_NAMES["u-bk-na-3"],
    recipientId: "u-bk-na-3",
    sentAt: dHoursAgo(2.93),
    status: "READ",
    readAt: dHoursAgo(2.7),
    message: "ความถี่ฉุกเฉิน — รับมือเหตุพันทิป",
  },
];

const cmd6: Command = {
  id: CMD6_ID,
  status: "IN_PROGRESS",
  priority: "EMERGENCY",
  emergency: {
    triggeredAt: dHoursAgo(3),
    triggerType: "เหตุก่อการร้าย",
    location: "ห้างสรรพสินค้าพันทิป ประตูน้ำ",
    description: "เหตุการณ์ระเบิด มีผู้บาดเจ็บ ต้องการกำลังเสริม",
    autoDispatched: true,
  },
  userIntent:
    "เหตุการณ์ระเบิดที่ห้างสรรพสินค้าพันทิป ประตูน้ำ มีผู้บาดเจ็บจำนวนมาก ต้องการระดมกำลังเสริมจาก บก.น. ทุกหน่วยในพื้นที่โดยด่วนที่สุด เพื่อปิดล้อม-คัดกรอง-อพยพ-สืบสวน",
  letter: {
    docNumber: "บช.น. ฉ.๐๐๑/๒๕๖๙",
    subject:
      "เรื่อง สั่งการเร่งด่วน — รับมือเหตุก่อการร้ายห้างสรรพสินค้าพันทิป",
    recipient: "เรียน ผบก.น.๑, ผบก.น.๒, ผบก.น.๓",
    introduction:
      "ด้วยเกิดเหตุก่อการร้าย (มีการระเบิด) ที่ห้างสรรพสินค้าพันทิป ประตูน้ำ มีผู้บาดเจ็บจำนวนมาก ผู้ก่อเหตุยังหลบหนี — ให้ทุกหน่วยที่ระบุดำเนินการตามขั้นตอนรับมือเหตุก่อการร้ายระดับสูงสุดทันที",
    directives: [
      "๑. ปิดล้อมพื้นที่ในรัศมี ๕๐๐ เมตร และตั้งจุดคัดกรองเข้า-ออก",
      "๒. ประสาน EOD เข้าตรวจสอบวัตถุต้องสงสัย และเตรียมพร้อมหน่วยเก็บกู้",
      "๓. ประสานหน่วยแพทย์ฉุกเฉิน + รพ.ใกล้เคียง รับผู้บาดเจ็บ",
      "๔. รายงานสถานการณ์ทุก ๑๕ นาที ผ่านระบบ EOP จนกว่าจะสิ้นสุดเหตุ",
      "๕. ห้ามให้ข่าวสื่อก่อนผ่านโฆษก ตร.",
    ],
    reportInstruction:
      "ให้รายงานสถานการณ์-ผู้บาดเจ็บ-ผู้ต้องสงสัย ทุก ๑๕ นาที จนกว่าเหตุยุติ",
    closing:
      "ขอให้ดำเนินการโดยเร็วที่สุดและรายงานอย่างต่อเนื่อง — เป็นเหตุระดับ EMERGENCY",
    signatureApplied: true,
    signatureText: "พล.ต.ท. สุเมธ ตันติเวชกุล",
    signatureAppliedAt: dHoursAgo(3),
    signerName: "พล.ต.ท. สุเมธ ตันติเวชกุล",
    signerTitle: "ผบช.น.",
  },
  alignment: {
    nationalStrategyItemIds: ["ns-1"],
    masterPlanItemIds: [],
    actionPlanItemIds: [],
    explanation: "เหตุฉุกเฉิน — ดำเนินการตามแผนรับมือเหตุก่อการร้ายแห่งชาติ",
  },
  draftedBy: "ai-engine",
  draftedAt: dHoursAgo(3),
  targetUnitIds: ["u-bch-na"],
  cascadeMode: "CASCADE",
  effectiveUnitIds: CMD6_UNITS,
  effectiveDate: dHoursAgo(3),
  dueDate: dHoursFromNow(48),
  kpis: [
    {
      id: "kpi-c6-status",
      type: "QUALITATIVE",
      metric: "รายงานสถานการณ์ทุก ๑๕ นาที",
      reportFrequency: "END_OF_PERIOD",
    },
    {
      id: "kpi-c6-injured",
      type: "QUANTITATIVE",
      metric: "ผู้บาดเจ็บที่ส่ง รพ. แล้ว",
      unit: "ราย",
      targetTotal: 50,
      reportFrequency: "END_OF_PERIOD",
    },
  ],
  assignments: CMD6_UNITS.flatMap((uid) => [
    { kpiId: "kpi-c6-status", unitId: uid, status: "REPORTING", currentValue: 1 },
    {
      kpiId: "kpi-c6-injured",
      unitId: uid,
      status: "REPORTING",
      currentValue: uid === "u-bk-na-1" ? 12 : uid === "u-bk-na-2" ? 8 : 4,
      targetShare: 17,
      lastReportedAt: dHoursAgo(0.5),
    },
  ]) as KpiAssignment[],
  createdBy: "p-bch-na",
  createdByName: "พล.ต.ท. สุเมธ ตันติเวชกุล",
  createdByTitle: "ผบช.",
  createdAt: dHoursAgo(3),
  approvedAt: dHoursAgo(3),
  approvedBy: "p-bch-na",
  approvedByName: "พล.ต.ท. สุเมธ ตันติเวชกุล",
  approvedByTitle: "ผบช.น.",
  dispatchedAt: dHoursAgo(3),
  unitProgress: [
    // bk-na-1 & bk-na-2 ACK + IN_PROGRESS + reported once
    makeUnitProgress("u-bk-na-1", "IN_PROGRESS", {
      ackDaysAgo: 0,
      startDaysAgo: 0,
      reports: [
        {
          id: "rep-em01-1",
          reportedAt: dHoursAgo(0.5),
          reportedBy: "system-seed",
          reportedByName: "ผบก.น.๑",
          reportedByTitle: "ผบก.",
          notes: "ปิดล้อมเรียบร้อย ส่งผู้บาดเจ็บ ๑๒ ราย ไปยัง รพ.พญาไท ๓",
          kpiValues: [
            { kpiId: "kpi-c6-status", value: 1 },
            { kpiId: "kpi-c6-injured", value: 12 },
          ],
        },
      ],
    }),
    makeUnitProgress("u-bk-na-2", "IN_PROGRESS", {
      ackDaysAgo: 0,
      startDaysAgo: 0,
      reports: [
        {
          id: "rep-em01-2",
          reportedAt: dHoursAgo(0.4),
          reportedBy: "system-seed",
          reportedByName: "ผบก.น.๒",
          reportedByTitle: "ผบก.",
          notes: "ตั้งจุดคัดกรองครบทุกทางออก ส่งกำลังเสริม ๔๐ นาย",
          kpiValues: [
            { kpiId: "kpi-c6-status", value: 1 },
            { kpiId: "kpi-c6-injured", value: 8 },
          ],
        },
      ],
    }),
    // bk-na-3 ACK only (acknowledged but not yet reporting)
    makeUnitProgress("u-bk-na-3", "ACKNOWLEDGED", {
      ackDaysAgo: 0,
      personaId: "system-seed",
      personaName: "ผบก.น.๓",
      personaTitle: "ผบก.",
    }),
  ],
  statusLog: [
    {
      timestamp: dHoursAgo(3),
      fromStatus: "DRAFT",
      toStatus: "DISPATCHED",
      byPersonaId: "p-bch-na",
      byName: "พล.ต.ท. สุเมธ ตันติเวชกุล",
      byTitle: "ผบช.น.",
      note: "Auto-dispatch — โหมดฉุกเฉิน (ข้ามขั้นตอนอนุมัติ)",
    },
    {
      timestamp: dHoursAgo(2.8),
      fromStatus: "DISPATCHED",
      toStatus: "IN_PROGRESS",
      byPersonaId: "system",
      byName: "ระบบ",
      byTitle: "auto-rollup",
      note: "บก.น.๑ และ บก.น.๒ เริ่มปฏิบัติ",
    },
  ] as StatusLogEntry[],
  notifications: CMD6_NOTIFICATIONS,
  escalations: [],
};

// ─────────────────────────────────────────────────────────────────────────────
// Command 7 (EMERGENCY): การชุมนุมรุนแรงราชดำเนิน — ACTIVE (6 ชั่วโมงก่อน)
// 1 escalation (u-bk-na-3 ไม่รับทราบ), 4 notifications
// ─────────────────────────────────────────────────────────────────────────────
const CMD7_ID = "cmd-seed-emergency-002";
const CMD7_UNITS = ["u-bk-na-1", "u-bk-na-2"];

const CMD7_NOTIFICATIONS: NotificationLog[] = [
  {
    id: "notif-em02-001",
    channel: "EMAIL",
    recipient: "ผบก. กองบังคับการตำรวจนครบาล ๑",
    recipientId: "u-bk-na-1",
    sentAt: dHoursAgo(5.95),
    status: "READ",
    readAt: dHoursAgo(5.8),
    message:
      "เร่งด่วนสูงสุด — รับมือการชุมนุมรุนแรงราชดำเนิน หน้าทำเนียบรัฐบาล",
  },
  {
    id: "notif-em02-002",
    channel: "LINE",
    recipient: "ผบก. กองบังคับการตำรวจนครบาล ๑",
    recipientId: "u-bk-na-1",
    sentAt: dHoursAgo(5.95),
    status: "READ",
    readAt: dHoursAgo(5.85),
    message: "🚨 ชุมนุมราชดำเนิน — รับมือด่วน",
  },
  {
    id: "notif-em02-003",
    channel: "EMAIL",
    recipient: "ผบก. กองบังคับการตำรวจนครบาล ๒",
    recipientId: "u-bk-na-2",
    sentAt: dHoursAgo(5.95),
    status: "READ",
    readAt: dHoursAgo(5.7),
    message:
      "เร่งด่วนสูงสุด — รับมือการชุมนุมรุนแรงราชดำเนิน หน้าทำเนียบรัฐบาล",
  },
  {
    id: "notif-em02-004",
    channel: "LINE",
    recipient: "ผบก. กองบังคับการตำรวจนครบาล ๒",
    recipientId: "u-bk-na-2",
    sentAt: dHoursAgo(5.95),
    status: "DELIVERED",
    message: "🚨 ชุมนุมราชดำเนิน — รับมือด่วน",
  },
];

const CMD7_ESCALATIONS: EscalationLog[] = [
  {
    id: "esc-em02-001",
    reason: "NO_ACK_TIMEOUT",
    triggeredAt: dHoursAgo(4),
    fromUnitId: "u-bk-na-3",
    toUnitId: "u-bch-na",
    toUnitName: "บช.น. (กองบัญชาการตำรวจนครบาล)",
    note:
      "บก.น.๓ ไม่รับทราบคำสั่งภายใน ๓๐ นาที — Escalate ขึ้น บช.น. เพื่อสั่งกำลังเสริมเอง",
  },
];

const cmd7: Command = {
  id: CMD7_ID,
  status: "IN_PROGRESS",
  priority: "EMERGENCY",
  emergency: {
    triggeredAt: dHoursAgo(6),
    triggerType: "การชุมนุมรุนแรง",
    location: "ถนนราชดำเนิน หน้าทำเนียบรัฐบาล",
    description:
      "ผู้ชุมนุมเกินจำนวนที่อนุญาต มีเหตุปะทะกับเจ้าหน้าที่",
    autoDispatched: true,
  },
  userIntent:
    "ระดมกำลังควบคุมการชุมนุมที่เริ่มรุนแรงบนถนนราชดำเนินหน้าทำเนียบรัฐบาล มีปะทะกับเจ้าหน้าที่",
  letter: {
    docNumber: "บช.น. ฉ.๐๐๒/๒๕๖๙",
    subject:
      "เรื่อง สั่งการเร่งด่วน — รับมือการชุมนุมรุนแรงบนถนนราชดำเนิน",
    recipient: "เรียน ผบก.น.๑, ผบก.น.๒",
    introduction:
      "ด้วยเกิดเหตุการชุมนุมที่เริ่มรุนแรงและมีการปะทะกับเจ้าหน้าที่ บนถนนราชดำเนินหน้าทำเนียบรัฐบาล — ให้ทุกหน่วยที่ระบุดำเนินการตามแผนควบคุมฝูงชนระดับสูง",
    directives: [
      "๑. ระดม คฝ. เข้าควบคุมพื้นที่ พร้อมโล่และอุปกรณ์ป้องกัน",
      "๒. ตั้งแนวกันชนรอบทำเนียบรัฐบาล — ห้ามให้เข้าใกล้รั้ว",
      "๓. เปิดเส้นทางเลี่ยงและประสาน บก.จร. ระบายการจราจร",
      "๔. รายงานสถานการณ์ทุก ๓๐ นาที",
    ],
    reportInstruction: "รายงานสถานการณ์-จำนวนผู้ชุมนุม-การปะทะ ทุก ๓๐ นาที",
    closing: "ขอให้ดำเนินการโดยเร็ว — เป็นเหตุระดับ EMERGENCY",
    signatureApplied: true,
    signatureText: "พล.ต.ท. สุเมธ ตันติเวชกุล",
    signatureAppliedAt: dHoursAgo(6),
    signerName: "พล.ต.ท. สุเมธ ตันติเวชกุล",
    signerTitle: "ผบช.น.",
  },
  alignment: {
    nationalStrategyItemIds: ["ns-1"],
    masterPlanItemIds: [],
    actionPlanItemIds: [],
    explanation: "เหตุฉุกเฉิน — รับมือการชุมนุมรุนแรง",
  },
  draftedBy: "ai-engine",
  draftedAt: dHoursAgo(6),
  targetUnitIds: ["u-bch-na"],
  cascadeMode: "DIRECT",
  effectiveUnitIds: CMD7_UNITS,
  effectiveDate: dHoursAgo(6),
  dueDate: dHoursFromNow(24),
  kpis: [
    {
      id: "kpi-c7-status",
      type: "QUALITATIVE",
      metric: "รายงานสถานการณ์ทุก ๓๐ นาที",
      reportFrequency: "END_OF_PERIOD",
    },
  ],
  assignments: CMD7_UNITS.map((uid) => ({
    kpiId: "kpi-c7-status",
    unitId: uid,
    status: "REPORTING",
    currentValue: 1,
  })) as KpiAssignment[],
  createdBy: "p-bch-na",
  createdByName: "พล.ต.ท. สุเมธ ตันติเวชกุล",
  createdByTitle: "ผบช.",
  createdAt: dHoursAgo(6),
  approvedAt: dHoursAgo(6),
  approvedBy: "p-bch-na",
  approvedByName: "พล.ต.ท. สุเมธ ตันติเวชกุล",
  approvedByTitle: "ผบช.น.",
  dispatchedAt: dHoursAgo(6),
  unitProgress: [
    makeUnitProgress("u-bk-na-1", "IN_PROGRESS", {
      ackDaysAgo: 0,
      startDaysAgo: 0,
      personaId: "system-seed",
      personaName: "ผบก.น.๑",
      personaTitle: "ผบก.",
    }),
    makeUnitProgress("u-bk-na-2", "ACKNOWLEDGED", {
      ackDaysAgo: 0,
      personaId: "system-seed",
      personaName: "ผบก.น.๒",
      personaTitle: "ผบก.",
    }),
  ],
  statusLog: [
    {
      timestamp: dHoursAgo(6),
      fromStatus: "DRAFT",
      toStatus: "DISPATCHED",
      byPersonaId: "p-bch-na",
      byName: "พล.ต.ท. สุเมธ ตันติเวชกุล",
      byTitle: "ผบช.น.",
      note: "Auto-dispatch — โหมดฉุกเฉิน",
    },
    {
      timestamp: dHoursAgo(4),
      fromStatus: "DISPATCHED",
      toStatus: "IN_PROGRESS",
      byPersonaId: "system",
      byName: "ระบบ",
      byTitle: "auto-rollup",
      note: "บก.น.๑ เริ่มปฏิบัติ",
    },
  ] as StatusLogEntry[],
  notifications: CMD7_NOTIFICATIONS,
  escalations: CMD7_ESCALATIONS,
};

// ─────────────────────────────────────────────────────────────────────────────
// Export
// ─────────────────────────────────────────────────────────────────────────────

// ─────────────────────────────────────────────────────────────────────────────
// Command 8: เตรียมความพร้อมจัดงานพระราชพิธีในพื้นที่ ภ.๕ — DISPATCHED (รอ ผบช.ภ.๕ รับทราบ)
// Sent FROM ผบ.ตร. TO ภ.๕ + cascade to ๔ จังหวัด
// All units (incl. parent ภ.๕) PENDING — to show PENDING_ACK + cascade workflow
// ─────────────────────────────────────────────────────────────────────────────
const CMD8_ID = "cmd-seed-pending-001-royal";
const CMD8_UNITS = ["u-bch-5", "u-prov-5-ชม", "u-prov-5-ชร", "u-prov-5-ลป", "u-prov-5-ลพ"];

const cmd8: Command = {
  id: CMD8_ID,
  status: "DISPATCHED",
  priority: "NORMAL",
  userIntent: "เตรียมความพร้อมรับเสด็จและจัดงานพระราชพิธีในพื้นที่ภาคเหนือตอนบน",
  letter: {
    docNumber: "ตร. ๖๘๑๒/๒๕๖๙",
    subject: "เรื่อง การเตรียมความพร้อมจัดงานพระราชพิธีในพื้นที่ตำรวจภูธรภาค ๕",
    recipient: "เรียน ผู้บัญชาการตำรวจภูธรภาค ๕",
    objective: "เพื่อเตรียมความพร้อมในการรักษาความปลอดภัยและอำนวยการจัดงานพระราชพิธีให้เป็นไปด้วยความเรียบร้อย",
    introduction: "ด้วยจะมีการจัดงานพระราชพิธีในพื้นที่ตำรวจภูธรภาค ๕ ในช่วงเดือนหน้า ซึ่งจำเป็นต้องมีการเตรียมความพร้อมทั้งด้านการรักษาความปลอดภัยและการอำนวยการจราจร จึงให้ดำเนินการดังนี้",
    directives: [
      "๑. ให้ ผบช.ภ.๕ พิจารณามอบหมาย ผบก.ภ.จว. ในสังกัด รับผิดชอบรายจังหวัด",
      "๒. จัดทำแผนรักษาความปลอดภัยและแผนจราจรเสนอภายใน ๗ วัน",
      "๓. ประสาน ตชด.ภาค ๓ และฝ่ายปกครองเพื่อบูรณาการการทำงาน",
      "๔. รายงานความคืบหน้าทุก ๓ วัน ทางระบบ EOP",
    ],
    reportInstruction: "ระยะเวลาเตรียมการ ๓๐ วัน รายงานความคืบหน้าทุก ๓ วัน และส่งแผนสรุปก่อนงานล่วงหน้า ๗ วัน",
    closing: "จึงเรียนมาเพื่อทราบและถือปฏิบัติโดยเคร่งครัด",
    signatureApplied: true,
    signatureText: "พล.ต.อ. กฤษฎา ภัทรประสิทธิ์",
    signatureAppliedAt: d(-2),
    signerName: "พล.ต.อ. กฤษฎา ภัทรประสิทธิ์",
    signerTitle: "ผบ.ตร.",
  },
  alignment: {
    nationalStrategyItemIds: ["ns-1"],
    masterPlanItemIds: ["mp-1"],
    actionPlanItemIds: ["ap-1-1"],
    explanation: "สอดคล้องกับยุทธศาสตร์ความมั่นคงและการปกป้องสถาบันหลักของชาติ",
  },
  draftedBy: "ai-engine",
  draftedAt: d(-3),
  targetUnitIds: ["u-bch-5"],
  cascadeMode: "CASCADE",
  effectiveUnitIds: CMD8_UNITS,
  effectiveDate: d(-1),
  dueDate: d(29),
  kpis: [
    { id: "kpi-c8-plan", type: "QUALITATIVE", metric: "แผนรักษาความปลอดภัยและจราจร", reportFrequency: "END_OF_PERIOD" },
    { id: "kpi-c8-officers", type: "QUANTITATIVE", metric: "กำลังพลที่จัดเตรียม", unit: "นาย", targetTotal: 800, reportFrequency: "WEEKLY" },
  ],
  assignments: CMD8_UNITS.flatMap((uid) => [
    { kpiId: "kpi-c8-plan", unitId: uid, status: "PENDING" as const, currentValue: 0 },
    { kpiId: "kpi-c8-officers", unitId: uid, targetShare: 200, status: "PENDING" as const, currentValue: 0 },
  ]) as KpiAssignment[],
  createdBy: "p-aide-rtp",
  createdByName: "พล.ต.ท. ณรงค์ฤทธิ์ ธรรมรัต",
  createdByTitle: "รอง ผบ.ตร.",
  createdAt: d(-3),
  proposedApproverId: "p-rtp",
  submittedAt: d(-3),
  submittedBy: "p-aide-rtp",
  submittedByName: "พล.ต.ท. ณรงค์ฤทธิ์ ธรรมรัต",
  approvedAt: d(-2),
  approvedBy: "p-rtp",
  approvedByName: "พล.ต.อ. กฤษฎา ภัทรประสิทธิ์",
  approvedByTitle: "ผบ.ตร.",
  dispatchedAt: d(-1),
  unitProgress: CMD8_UNITS.map((uid) => makeUnitProgress(uid, "PENDING")),
  notifications: CMD8_UNITS.slice(0, 1).map((uid, i) => ({
    id: `notif-cmd8-${i}`,
    channel: "EMAIL" as const,
    recipient: "ผบช.ภ.๕",
    recipientId: uid,
    sentAt: d(-1),
    status: "DELIVERED" as const,
    message: "หนังสือสั่งการเรื่องการเตรียมจัดงานพระราชพิธี ส่งถึงท่านแล้ว",
  })),
  escalations: [],
  statusLog: [
    { timestamp: d(-3), fromStatus: "DRAFT", toStatus: "SUBMITTED", byPersonaId: "p-aide-rtp", byName: "พล.ต.ท. ณรงค์ฤทธิ์ ธรรมรัต", byTitle: "รอง ผบ.ตร." },
    { timestamp: d(-2), fromStatus: "SUBMITTED", toStatus: "APPROVED", byPersonaId: "p-rtp", byName: "พล.ต.อ. กฤษฎา ภัทรประสิทธิ์", byTitle: "ผบ.ตร." },
    { timestamp: d(-1), fromStatus: "APPROVED", toStatus: "DISPATCHED", byPersonaId: "system", byName: "ระบบ", byTitle: "auto-dispatch" },
  ] as StatusLogEntry[],
};

// ─────────────────────────────────────────────────────────────────────────────
// Command 9: ระดมกวาดล้างยาเสพติด — DISPATCHED (รอ ผบช.น. รับทราบ)
// Sent FROM ผบ.ตร. TO บช.น. + cascade to บก.น.๑-๓
// ─────────────────────────────────────────────────────────────────────────────
const CMD9_ID = "cmd-seed-pending-002-drug-bkk";
const CMD9_UNITS = ["u-bch-na", "u-bk-na-1", "u-bk-na-2", "u-bk-na-3"];

const cmd9: Command = {
  id: CMD9_ID,
  status: "DISPATCHED",
  priority: "URGENT",
  userIntent: "ระดมกวาดล้างยาเสพติดในพื้นที่กรุงเทพมหานคร เน้นจุดเสี่ยงที่เป็นแหล่งซื้อขายและขนส่งยา",
  letter: {
    docNumber: "ตร. ๖๘๔๒/๒๕๖๙",
    subject: "เรื่อง การระดมกวาดล้างยาเสพติดในพื้นที่กรุงเทพมหานคร",
    recipient: "เรียน ผู้บัญชาการตำรวจนครบาล",
    objective: "เพื่อปราบปรามการแพร่ระบาดของยาเสพติดในกรุงเทพมหานคร โดยเฉพาะแหล่งซื้อขายและเครือข่ายขนส่ง",
    introduction: "ด้วยปรากฏข้อมูลข่าวกรองว่ามีเครือข่ายยาเสพติดเคลื่อนไหวในพื้นที่กรุงเทพมหานครเพิ่มขึ้นอย่างต่อเนื่อง โดยเฉพาะบริเวณชุมชนแออัดในพื้นที่ บก.น.๑–๓ ส่งผลให้ประชาชนเดือดร้อน จึงให้ดำเนินการดังนี้",
    directives: [
      "๑. ให้ ผบช.น. มอบหมาย ผบก. ใต้สังกัดดำเนินการกวาดล้างรายพื้นที่",
      "๒. ตั้งจุดตรวจค้นในจุดเสี่ยง เน้นสกัดผู้ขนส่ง",
      "๓. ประสาน ปส. และ DSI ในการสืบสวนเครือข่าย",
      "๔. รายงานผลการจับกุมรายวัน",
    ],
    reportInstruction: "ระยะเวลา ๑๔ วัน รายงานผลรายวันเวลา ๒๐.๐๐ น. ผ่านระบบ EOP",
    closing: "จึงเรียนมาเพื่อทราบและถือปฏิบัติโดยเคร่งครัด",
    signatureApplied: true,
    signatureText: "พล.ต.อ. กฤษฎา ภัทรประสิทธิ์",
    signatureAppliedAt: d(-1),
    signerName: "พล.ต.อ. กฤษฎา ภัทรประสิทธิ์",
    signerTitle: "ผบ.ตร.",
  },
  alignment: {
    nationalStrategyItemIds: ["ns-2"],
    masterPlanItemIds: ["mp-10"],
    actionPlanItemIds: ["ap-2-1"],
    explanation: "สอดคล้องกับยุทธศาสตร์ปราบปรามยาเสพติดตามนโยบายรัฐบาล",
  },
  draftedBy: "ai-engine",
  draftedAt: d(-2),
  targetUnitIds: ["u-bch-na"],
  cascadeMode: "CASCADE",
  effectiveUnitIds: CMD9_UNITS,
  effectiveDate: d(0),
  dueDate: d(14),
  kpis: [
    { id: "kpi-c9-arrest", type: "QUANTITATIVE", metric: "ผู้ต้องหายาเสพติด", unit: "ราย", targetTotal: 300, reportFrequency: "DAILY" },
    { id: "kpi-c9-checkpoint", type: "QUANTITATIVE", metric: "จุดตรวจ", unit: "จุด", targetTotal: 60, reportFrequency: "DAILY" },
  ],
  assignments: CMD9_UNITS.flatMap((uid) => [
    { kpiId: "kpi-c9-arrest", unitId: uid, targetShare: 75, status: "PENDING" as const, currentValue: 0 },
    { kpiId: "kpi-c9-checkpoint", unitId: uid, targetShare: 15, status: "PENDING" as const, currentValue: 0 },
  ]) as KpiAssignment[],
  createdBy: "p-aide-rtp",
  createdByName: "พล.ต.ท. ณรงค์ฤทธิ์ ธรรมรัต",
  createdByTitle: "รอง ผบ.ตร.",
  createdAt: d(-2),
  proposedApproverId: "p-rtp",
  submittedAt: d(-2),
  submittedBy: "p-aide-rtp",
  submittedByName: "พล.ต.ท. ณรงค์ฤทธิ์ ธรรมรัต",
  approvedAt: d(-1),
  approvedBy: "p-rtp",
  approvedByName: "พล.ต.อ. กฤษฎา ภัทรประสิทธิ์",
  approvedByTitle: "ผบ.ตร.",
  dispatchedAt: d(0),
  unitProgress: CMD9_UNITS.map((uid) => makeUnitProgress(uid, "PENDING")),
  notifications: [
    {
      id: "notif-cmd9-1",
      channel: "EMAIL" as const,
      recipient: "ผบช.น.",
      recipientId: "u-bch-na",
      sentAt: d(0),
      status: "DELIVERED" as const,
      message: "หนังสือสั่งการระดมกวาดล้างยาเสพติด — ต้องการการรับทราบและมอบหมาย บก. ในสังกัดทันที",
    },
    {
      id: "notif-cmd9-2",
      channel: "LINE" as const,
      recipient: "ผบช.น.",
      recipientId: "u-bch-na",
      sentAt: d(0),
      status: "READ" as const,
      readAt: d(0),
      message: "[URGENT] หนังสือสั่งการระดมกวาดล้างยาเสพติด",
    },
  ],
  escalations: [],
  statusLog: [
    { timestamp: d(-2), fromStatus: "DRAFT", toStatus: "SUBMITTED", byPersonaId: "p-aide-rtp", byName: "พล.ต.ท. ณรงค์ฤทธิ์ ธรรมรัต", byTitle: "รอง ผบ.ตร." },
    { timestamp: d(-1), fromStatus: "SUBMITTED", toStatus: "APPROVED", byPersonaId: "p-rtp", byName: "พล.ต.อ. กฤษฎา ภัทรประสิทธิ์", byTitle: "ผบ.ตร." },
    { timestamp: d(0), fromStatus: "APPROVED", toStatus: "DISPATCHED", byPersonaId: "system", byName: "ระบบ", byTitle: "auto-dispatch" },
  ] as StatusLogEntry[],
};

export const SEED_COMMANDS: Command[] = [cmd1, cmd2, cmd3, cmd4, cmd5, cmd6, cmd7, cmd8, cmd9];
