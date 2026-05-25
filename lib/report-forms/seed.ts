// 10 realistic mock report forms for Thai police qualitative KPI reporting

import type { ReportForm, FormField } from "./types";

function f(
  id: string,
  type: FormField["type"],
  label: string,
  required: boolean,
  opts?: Partial<FormField>
): FormField {
  return { id, type, label, required, ...opts };
}

// ── Form 1: จับกุมผู้ต้องหา ────────────────────────────────────────────────
const form1: ReportForm = {
  id: "form-arrest-001",
  name: "แบบรายงานผลการจับกุมผู้ต้องหา",
  description: "บันทึกผลการจับกุมผู้ต้องหาในแต่ละคดี พร้อมข้อหาและหลักฐานที่ได้",
  category: "การปราบปราม",
  isActive: true,
  createdAt: "2025-11-01T08:00:00.000Z",
  createdBy: "system",
  createdByName: "ระบบ (seed)",
  version: 1,
  fields: [
    f("f1-name", "text", "ชื่อ-นามสกุลผู้ต้องหา", true, { placeholder: "เช่น นายสมชาย ใจดี" }),
    f("f1-charge", "select", "ข้อหาหลัก", true, {
      options: [
        "หลอกลวงทางโทรศัพท์ (แก๊งคอลเซ็นเตอร์)",
        "ยาเสพติดให้โทษ (จำหน่าย)",
        "ยาเสพติดให้โทษ (ครอบครอง)",
        "ลักทรัพย์",
        "ทำร้ายร่างกาย",
        "อาวุธปืน",
        "อื่นๆ",
      ],
    }),
    f("f1-date", "date", "วันเวลาจับกุม", true),
    f("f1-location", "text", "สถานที่จับกุม", true, { placeholder: "เขต/อำเภอ/จังหวัด" }),
    f("f1-warrant", "radio", "มีหมายจับ", true, { options: ["มี", "ไม่มี (จับตามอำนาจ ม.78)"] }),
    f("f1-units", "textarea", "หน่วยร่วมปฏิบัติการ", false, {
      placeholder: "ระบุหน่วยงานที่ร่วม เช่น DSI, ปส., กองปราบ",
      validation: { maxLength: 500 },
    }),
    f("f1-evidence", "checkbox", "ของกลางที่ยึดได้", false, {
      options: ["โทรศัพท์มือถือ", "คอมพิวเตอร์/แท็บเลต", "เงินสด", "บัญชีธนาคาร", "อาวุธปืน", "ยาเสพติด", "พาหนะ", "อื่นๆ"],
    }),
    f("f1-note", "textarea", "หมายเหตุ/รายละเอียดเพิ่มเติม", false, {
      placeholder: "ข้อมูลเพิ่มเติมที่เป็นประโยชน์ต่อคดี",
    }),
  ],
};

// ── Form 2: สืบสวนคดี ──────────────────────────────────────────────────────
const form2: ReportForm = {
  id: "form-investigation-002",
  name: "แบบรายงานความคืบหน้าการสืบสวนคดี",
  description: "รายงานสถานะและความก้าวหน้าของการสืบสวนคดีสำคัญในแต่ละรอบ",
  category: "การสืบสวน",
  isActive: true,
  createdAt: "2025-11-01T08:00:00.000Z",
  createdBy: "system",
  createdByName: "ระบบ (seed)",
  version: 1,
  fields: [
    f("f2-casenum", "text", "เลขคดีอาญา", true, { placeholder: "เช่น 001/2568" }),
    f("f2-type", "select", "ประเภทคดี", true, {
      options: [
        "คดีอาชญากรรมทางเทคโนโลยี",
        "คดียาเสพติด",
        "คดีฆาตกรรม",
        "คดีทุจริต",
        "คดีค้ามนุษย์",
        "คดีอาวุธ",
        "คดีอื่นๆ",
      ],
    }),
    f("f2-progress", "select", "ระดับความคืบหน้า", true, {
      options: ["เริ่มต้น (0–25%)", "กำลังดำเนินการ (26–50%)", "คืบหน้ามาก (51–75%)", "ใกล้สรุปคดี (76–99%)", "สรุปคดีแล้ว (100%)"],
    }),
    f("f2-suspects", "number", "จำนวนผู้ต้องสงสัยที่ระบุตัวได้", false, {
      validation: { min: 0, max: 999 },
    }),
    f("f2-evidence", "textarea", "หลักฐานสำคัญที่ได้รับ", true, {
      placeholder: "สรุปหลักฐานที่รวบรวมได้ในรอบนี้",
    }),
    f("f2-obstacles", "textarea", "อุปสรรค/ปัญหาที่พบ", false, {
      placeholder: "ระบุถ้ามีอุปสรรคในการสืบสวน",
    }),
    f("f2-nextstep", "textarea", "แผนการดำเนินการต่อ", true, {
      placeholder: "ขั้นตอนที่จะดำเนินการในลำดับถัดไป",
    }),
    f("f2-classified", "radio", "ระดับการเผยแพร่ข้อมูล", true, {
      options: ["ปกติ", "ลับ", "ลับมาก"],
    }),
  ],
};

// ── Form 3: ตรวจพื้นที่ ────────────────────────────────────────────────────
const form3: ReportForm = {
  id: "form-patrol-003",
  name: "แบบรายงานการตรวจพื้นที่รับผิดชอบ",
  description: "บันทึกผลการตรวจตราพื้นที่ จุดเสี่ยง และสถานการณ์ที่พบในแต่ละรอบ",
  category: "การป้องกัน",
  isActive: true,
  createdAt: "2025-11-15T08:00:00.000Z",
  createdBy: "system",
  createdByName: "ระบบ (seed)",
  version: 1,
  fields: [
    f("f3-route", "text", "เส้นทาง/พื้นที่ที่ตรวจ", true, { placeholder: "เช่น ถนนสุขุมวิท ซอย 1–21" }),
    f("f3-starttime", "date", "วันที่ออกตรวจ", true),
    f("f3-duration", "number", "ระยะเวลาตรวจ (ชั่วโมง)", true, { validation: { min: 1, max: 24 } }),
    f("f3-officers", "number", "จำนวนเจ้าหน้าที่", true, { validation: { min: 1 } }),
    f("f3-riskpoints", "textarea", "จุดเสี่ยงที่พบ", false, {
      placeholder: "สถานที่หรือสถานการณ์เสี่ยงที่สังเกตเห็น",
    }),
    f("f3-incidents", "select", "เหตุการณ์ที่พบ", true, {
      options: ["ไม่พบเหตุผิดปกติ", "พบเหตุเล็กน้อย (จัดการได้)", "พบเหตุสำคัญ (แจ้งเพิ่มกำลัง)", "เกิดเหตุอาชญากรรม"],
    }),
    f("f3-incident_detail", "textarea", "รายละเอียดเหตุการณ์", false, {
      placeholder: "กรอกถ้าพบเหตุ",
    }),
    f("f3-recommend", "textarea", "ข้อเสนอแนะ", false, {
      placeholder: "แนวทางปรับปรุงการตรวจตราในพื้นที่",
    }),
    f("f3-rating", "rating", "ระดับความปลอดภัยโดยรวมของพื้นที่", true),
  ],
};

// ── Form 4: จุดตรวจจราจร ──────────────────────────────────────────────────
const form4: ReportForm = {
  id: "form-checkpoint-004",
  name: "แบบรายงานผลการตั้งจุดตรวจจราจร",
  description: "บันทึกสถิติและผลการตั้งจุดตรวจจราจร รวมถึงคดีที่ดำเนินการ",
  category: "การจราจร",
  isActive: true,
  createdAt: "2025-11-15T08:00:00.000Z",
  createdBy: "system",
  createdByName: "ระบบ (seed)",
  version: 1,
  fields: [
    f("f4-location", "text", "ที่ตั้งจุดตรวจ", true, { placeholder: "เช่น แยกอโศก ถนนสุขุมวิท" }),
    f("f4-date", "date", "วันที่ตั้งจุดตรวจ", true),
    f("f4-hours", "number", "จำนวนชั่วโมงที่ตั้งจุดตรวจ", true, { validation: { min: 1, max: 24 } }),
    f("f4-vehicles", "number", "จำนวนยานพาหนะที่ตรวจ (คัน)", true, { validation: { min: 0 } }),
    f("f4-violations", "checkbox", "ประเภทความผิดที่พบ", false, {
      options: [
        "ไม่สวมหมวกนิรภัย",
        "ไม่คาดเข็มขัดนิรภัย",
        "ใช้โทรศัพท์ขณะขับ",
        "เมาแล้วขับ",
        "ไม่มีใบขับขี่",
        "ไม่มีทะเบียน/ภาษีหมดอายุ",
        "อื่นๆ",
      ],
    }),
    f("f4-drunk", "number", "ผู้ต้องหาคดีเมาแล้วขับ (ราย)", false, { validation: { min: 0 } }),
    f("f4-summary", "textarea", "สรุปผลการตั้งจุดตรวจ", true, {
      placeholder: "ภาพรวมและเหตุการณ์สำคัญระหว่างตั้งจุดตรวจ",
    }),
  ],
};

// ── Form 5: ฝึกอบรม ────────────────────────────────────────────────────────
const form5: ReportForm = {
  id: "form-training-005",
  name: "แบบรายงานผลการฝึกอบรมและพัฒนากำลังพล",
  description: "บันทึกผลการจัดฝึกอบรมพัฒนาศักยภาพกำลังพลในแต่ละหลักสูตร",
  category: "การฝึกอบรม",
  isActive: true,
  createdAt: "2025-12-01T08:00:00.000Z",
  createdBy: "system",
  createdByName: "ระบบ (seed)",
  version: 1,
  fields: [
    f("f5-title", "text", "ชื่อหลักสูตร/หัวข้อการฝึก", true, { placeholder: "เช่น การสืบสวนอาชญากรรมดิจิทัล" }),
    f("f5-date", "date", "วันที่จัดฝึกอบรม", true),
    f("f5-days", "number", "จำนวนวันฝึก", true, { validation: { min: 1 } }),
    f("f5-attendees", "number", "จำนวนผู้เข้าร่วม (คน)", true, { validation: { min: 1 } }),
    f("f5-trainer", "text", "ชื่อวิทยากร/หน่วยงานที่จัด", true),
    f("f5-topics", "textarea", "สาระสำคัญที่อบรม", true, {
      placeholder: "หัวข้อย่อยและเนื้อหาหลักที่บรรยาย",
    }),
    f("f5-score", "number", "คะแนนเฉลี่ยผู้เข้าอบรม (เต็ม 100)", false, {
      validation: { min: 0, max: 100 },
    }),
    f("f5-satisfaction", "rating", "ระดับความพึงพอใจโดยรวม (1–5)", true),
    f("f5-outcome", "textarea", "ผลที่คาดว่าจะนำไปใช้ประโยชน์", true, {
      placeholder: "การนำความรู้ไปประยุกต์ใช้ในงานจริง",
    }),
  ],
};

// ── Form 6: ประสานงานหน่วยงานภายนอก ──────────────────────────────────────
const form6: ReportForm = {
  id: "form-coordination-006",
  name: "แบบรายงานการประสานงานหน่วยงานภายนอก",
  description: "บันทึกผลการประสานความร่วมมือกับหน่วยงานภาครัฐและเอกชนที่เกี่ยวข้อง",
  category: "การอำนวยความสะดวก",
  isActive: true,
  createdAt: "2025-12-01T08:00:00.000Z",
  createdBy: "system",
  createdByName: "ระบบ (seed)",
  version: 1,
  fields: [
    f("f6-agency", "text", "ชื่อหน่วยงานที่ประสาน", true, { placeholder: "เช่น DSI, ป.ป.ส., กรมสอบสวนคดีพิเศษ" }),
    f("f6-purpose", "select", "วัตถุประสงค์การประสาน", true, {
      options: [
        "แลกเปลี่ยนข้อมูลข่าวกรอง",
        "ร่วมปฏิบัติการ",
        "ขอความช่วยเหลือทางเทคนิค",
        "ประชุมประสานแผน",
        "ส่งมอบคดี/ผู้ต้องหา",
        "อื่นๆ",
      ],
    }),
    f("f6-date", "date", "วันที่ประสาน", true),
    f("f6-result", "radio", "ผลการประสาน", true, {
      options: ["สำเร็จตามวัตถุประสงค์", "สำเร็จบางส่วน", "ยังไม่สำเร็จ (อยู่ระหว่างดำเนินการ)"],
    }),
    f("f6-outcome", "textarea", "สิ่งที่ได้รับจากการประสาน", true, {
      placeholder: "ข้อมูล ความร่วมมือ หรือทรัพยากรที่ได้รับ",
    }),
    f("f6-obstacles", "textarea", "อุปสรรคในการประสาน", false),
    f("f6-followup", "textarea", "แนวทางดำเนินการต่อ", false),
  ],
};

// ── Form 7: ข่าวกรอง ────────────────────────────────────────────────────────
const form7: ReportForm = {
  id: "form-intelligence-007",
  name: "แบบรายงานสถานการณ์ด้านการข่าว",
  description: "รายงานข้อมูลข่าวกรองและสถานการณ์สำคัญในพื้นที่ สำหรับการตัดสินใจระดับบริหาร",
  category: "การสืบสวน",
  isActive: true,
  createdAt: "2025-12-15T08:00:00.000Z",
  createdBy: "system",
  createdByName: "ระบบ (seed)",
  version: 1,
  fields: [
    f("f7-period", "date", "วันที่รายงาน", true),
    f("f7-area", "text", "พื้นที่/เขตที่รายงาน", true, { placeholder: "เขต/อำเภอ/จังหวัด" }),
    f("f7-threat", "select", "ระดับภัยคุกคาม", true, {
      options: ["ต่ำ (ปกติ)", "ปานกลาง (ต้องเฝ้าระวัง)", "สูง (ต้องดำเนินการเร่งด่วน)"],
    }),
    f("f7-issue", "textarea", "ประเด็นสำคัญที่พบ", true, {
      placeholder: "สรุปสถานการณ์หรือข่าวกรองที่ได้รับ (ไม่ระบุแหล่งข่าว)",
    }),
    f("f7-credibility", "radio", "ระดับความน่าเชื่อถือของข้อมูล", true, {
      options: ["สูง (ยืนยันแล้ว)", "ปานกลาง (น่าเชื่อถือ)", "ต่ำ (ต้องตรวจสอบเพิ่ม)"],
    }),
    f("f7-action", "textarea", "การดำเนินการที่แนะนำ", true, {
      placeholder: "มาตรการหรือขั้นตอนที่ควรดำเนินการ",
    }),
    f("f7-urgent", "radio", "ต้องการการตัดสินใจเร่งด่วน", true, {
      options: ["ใช่ — ต้องการภายใน 24 ชั่วโมง", "ไม่ใช่ — รายงานตามรอบ"],
    }),
  ],
};

// ── Form 8: ท่องเที่ยวปลอดภัย ────────────────────────────────────────────
const form8: ReportForm = {
  id: "form-tourism-008",
  name: "แบบรายงานการดูแลความปลอดภัยแหล่งท่องเที่ยว",
  description: "บันทึกสถานการณ์และการดูแลนักท่องเที่ยวในแหล่งท่องเที่ยวที่ได้รับมอบหมาย",
  category: "การอำนวยความสะดวก",
  isActive: true,
  createdAt: "2025-12-15T08:00:00.000Z",
  createdBy: "system",
  createdByName: "ระบบ (seed)",
  version: 1,
  fields: [
    f("f8-site", "text", "ชื่อแหล่งท่องเที่ยว", true, { placeholder: "เช่น ถนนข้าวสาร, หาดป่าตอง" }),
    f("f8-date", "date", "วันที่รายงาน", true),
    f("f8-tourists", "number", "จำนวนนักท่องเที่ยวโดยประมาณ (คน)", false, { validation: { min: 0 } }),
    f("f8-nationality", "checkbox", "สัญชาตินักท่องเที่ยวส่วนใหญ่", false, {
      options: ["ไทย", "จีน", "ยุโรป/อเมริกา", "อาเซียน", "ญี่ปุ่น/เกาหลี", "อื่นๆ"],
    }),
    f("f8-incidents", "select", "เหตุการณ์ที่เกิดขึ้น", true, {
      options: [
        "ไม่มีเหตุการณ์ผิดปกติ",
        "ช่วยเหลือนักท่องเที่ยว (ไม่ใช่คดี)",
        "คดีลักทรัพย์/ล้วงกระเป๋า",
        "คดีทำร้ายร่างกาย",
        "คดีฉ้อโกง",
        "อื่นๆ",
      ],
    }),
    f("f8-assist", "textarea", "รายละเอียดการช่วยเหลือนักท่องเที่ยว", false),
    f("f8-safety", "rating", "ระดับความปลอดภัยโดยรวมของแหล่งท่องเที่ยว", true),
    f("f8-problem", "textarea", "ปัญหา/ข้อกังวลที่ต้องรายงาน", false),
  ],
};

// ── Form 9: ยาเสพติด ──────────────────────────────────────────────────────
const form9: ReportForm = {
  id: "form-drugs-009",
  name: "แบบรายงานผลการบังคับใช้กฎหมายยาเสพติด",
  description: "บันทึกสถิติการจับกุมและยึดทรัพย์ในคดียาเสพติด พร้อมข้อมูลเครือข่ายผู้ค้า",
  category: "การปราบปราม",
  isActive: true,
  createdAt: "2026-01-01T08:00:00.000Z",
  createdBy: "system",
  createdByName: "ระบบ (seed)",
  version: 1,
  fields: [
    f("f9-period", "date", "ช่วงเวลาที่รายงาน (วันสิ้นสุด)", true),
    f("f9-drugtype", "checkbox", "ประเภทยาเสพติดที่พบ", true, {
      options: ["ยาบ้า (เมทแอมเฟตามีน)", "ไอซ์ (คริสตัล)", "เฮโรอีน", "โคเคน", "กัญชา (ผิดกฎหมาย)", "คีตามีน", "อื่นๆ"],
    }),
    f("f9-quantity", "number", "ปริมาณยาเสพติดของกลาง (กิโลกรัม)", true, { validation: { min: 0 } }),
    f("f9-suspects", "number", "จำนวนผู้ต้องหา (ราย)", true, { validation: { min: 0 } }),
    f("f9-network", "select", "ระดับเครือข่ายที่จับได้", true, {
      options: ["ผู้ใช้/ผู้เสพ", "ผู้ค้าปลีกรายย่อย", "ผู้ค้าส่ง", "เครือข่ายระดับกลาง", "เครือข่ายข้ามชาติ"],
    }),
    f("f9-assets", "number", "ทรัพย์สินที่อายัดได้ (บาท)", false, { validation: { min: 0 } }),
    f("f9-analysis", "textarea", "วิเคราะห์รูปแบบการค้าและแนวโน้ม", false, {
      placeholder: "พื้นที่ที่พบการระบาด, ช่องทางนำเข้า, กลุ่มเป้าหมาย",
    }),
  ],
};

// ── Form 10: ความพึงพอใจประชาชน ──────────────────────────────────────────
const form10: ReportForm = {
  id: "form-satisfaction-010",
  name: "แบบรายงานสรุปความพึงพอใจของประชาชน",
  description: "สรุปผลการสำรวจความพึงพอใจของประชาชนต่อการให้บริการ เพื่อพัฒนาคุณภาพงาน",
  category: "ทั่วไป",
  isActive: true,
  createdAt: "2026-01-01T08:00:00.000Z",
  createdBy: "system",
  createdByName: "ระบบ (seed)",
  version: 1,
  fields: [
    f("f10-period", "date", "ช่วงเวลาสำรวจ (วันสิ้นสุด)", true),
    f("f10-channel", "checkbox", "ช่องทางที่สำรวจ", true, {
      options: ["ณ จุดบริการ", "ออนไลน์ (เว็บ/แอป)", "โทรศัพท์", "แบบฟอร์มกระดาษ"],
    }),
    f("f10-samples", "number", "จำนวนผู้ตอบแบบสำรวจ (คน)", true, { validation: { min: 1 } }),
    f("f10-overall", "rating", "คะแนนความพึงพอใจเฉลี่ยโดยรวม (1–5)", true),
    f("f10-speed", "rating", "ด้านความรวดเร็วในการให้บริการ", true),
    f("f10-courtesy", "rating", "ด้านความสุภาพและมิตรไมตรี", true),
    f("f10-strength", "textarea", "จุดแข็งที่ประชาชนชื่นชม", false, {
      placeholder: "สรุปคำชมที่ได้รับบ่อยที่สุด",
    }),
    f("f10-improve", "textarea", "จุดที่ควรปรับปรุงตามข้อเสนอประชาชน", true, {
      placeholder: "ข้อร้องเรียน/ข้อเสนอแนะที่ได้รับบ่อย",
    }),
    f("f10-action", "textarea", "แผนการปรับปรุงจากผลสำรวจ", true, {
      placeholder: "มาตรการที่จะดำเนินการเพื่อแก้ไขจุดอ่อน",
    }),
  ],
};

export const SEED_FORMS: ReportForm[] = [
  form1, form2, form3, form4, form5,
  form6, form7, form8, form9, form10,
];
