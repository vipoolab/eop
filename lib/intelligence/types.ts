// Types for ระบบบริหารจัดการข้อมูลและปัญญาประดิษฐ์ (System 6 — Data & AI Management)
//
// 8 capabilities:
//   1. OCR ภาษาไทย
//   2. AI Document Classification (6 หมวด)
//   3. Predictive Analytics
//   4. Executive Summary AI
//   5. Search (4 modes)
//   6. Dashboards (5 ประเภท)
//   7. Heatmap (geographic hot spots)
//   8. API integration display (191/CCTV/Intelligence)

// ── Document classification ───────────────────

/**
 * ๑๑ หมวดเอกสารตามประเภทงาน — กำหนดตาม TOR EOP ข้อ (๔)
 * "การจำแนกเอกสารต้องสามารถจัดหมวดหมู่ตามประเภทงาน"
 */
export type DocCategory =
  | "งานปราบปรามอาชญากรรม"
  | "งานป้องกันอาชญากรรม"
  | "งานควบคุมสถานบริการและอบายมุข"
  | "งานจราจรและอุบัติเหตุ"
  | "งานรักษาความสงบเรียบร้อย"
  | "งานกิจการพิเศษและความมั่นคง"
  | "งานบรรเทาสาธารณภัย"
  | "งานถวายความปลอดภัย"
  | "งานจิตอาสาและบริการประชาชน"
  | "งานบริหารทรัพยากรบุคคลและฝึกอบรม"
  | "อื่นๆ";

export const DOC_CATEGORIES: DocCategory[] = [
  "งานปราบปรามอาชญากรรม",
  "งานป้องกันอาชญากรรม",
  "งานควบคุมสถานบริการและอบายมุข",
  "งานจราจรและอุบัติเหตุ",
  "งานรักษาความสงบเรียบร้อย",
  "งานกิจการพิเศษและความมั่นคง",
  "งานบรรเทาสาธารณภัย",
  "งานถวายความปลอดภัย",
  "งานจิตอาสาและบริการประชาชน",
  "งานบริหารทรัพยากรบุคคลและฝึกอบรม",
  "อื่นๆ",
];

export const CATEGORY_STYLES: Record<DocCategory, string> = {
  "งานปราบปรามอาชญากรรม":
    "bg-red-50 text-red-800 border-red-300 dark:bg-red-900/30 dark:text-red-300 dark:border-red-700",
  "งานป้องกันอาชญากรรม":
    "bg-blue-50 text-blue-800 border-blue-300 dark:bg-blue-900/30 dark:text-blue-300 dark:border-blue-700",
  "งานควบคุมสถานบริการและอบายมุข":
    "bg-pink-50 text-pink-800 border-pink-300 dark:bg-pink-900/30 dark:text-pink-300 dark:border-pink-700",
  "งานจราจรและอุบัติเหตุ":
    "bg-orange-50 text-orange-800 border-orange-300 dark:bg-orange-900/30 dark:text-orange-300 dark:border-orange-700",
  "งานรักษาความสงบเรียบร้อย":
    "bg-amber-50 text-amber-800 border-amber-300 dark:bg-amber-900/30 dark:text-amber-300 dark:border-amber-700",
  "งานกิจการพิเศษและความมั่นคง":
    "bg-indigo-50 text-indigo-800 border-indigo-300 dark:bg-indigo-900/30 dark:text-indigo-300 dark:border-indigo-700",
  "งานบรรเทาสาธารณภัย":
    "bg-emerald-50 text-emerald-800 border-emerald-300 dark:bg-emerald-900/30 dark:text-emerald-300 dark:border-emerald-700",
  "งานถวายความปลอดภัย":
    "bg-violet-50 text-violet-800 border-violet-300 dark:bg-violet-900/30 dark:text-violet-300 dark:border-violet-700",
  "งานจิตอาสาและบริการประชาชน":
    "bg-green-50 text-green-800 border-green-300 dark:bg-green-900/30 dark:text-green-300 dark:border-green-700",
  "งานบริหารทรัพยากรบุคคลและฝึกอบรม":
    "bg-teal-50 text-teal-800 border-teal-300 dark:bg-teal-900/30 dark:text-teal-300 dark:border-teal-700",
  "อื่นๆ":
    "bg-slate-100 text-slate-700 border-slate-300 dark:bg-slate-800 dark:text-slate-200 dark:border-slate-700",
};

/**
 * Keywords for the offline keyword-fallback classifier only (used when AI
 * is unavailable). The primary AI classifier reasons over full content.
 */
export const CATEGORY_KEYWORDS: Record<DocCategory, string[]> = {
  "งานปราบปรามอาชญากรรม": [
    "ปราบปราม",
    "จับกุม",
    "สืบสวน",
    "ดำเนินคดี",
    "ผู้ต้องหา",
    "ยาเสพติด",
    "ฉ้อโกง",
    "ค้ามนุษย์",
    "อาชญากรรม",
  ],
  "งานป้องกันอาชญากรรม": [
    "ป้องกันอาชญากรรม",
    "สายตรวจ",
    "จุดตรวจ",
    "เฝ้าระวัง",
    "ลาดตระเวน",
    "ตู้แดง",
    "ชุมชน",
    "ประชาสัมพันธ์ป้องกัน",
  ],
  "งานควบคุมสถานบริการและอบายมุข": [
    "สถานบริการ",
    "อบายมุข",
    "การพนัน",
    "ผับ",
    "บาร์",
    "สถานบันเทิง",
    "ตรวจสถานประกอบการ",
    "เวลาเปิด-ปิด",
  ],
  "งานจราจรและอุบัติเหตุ": [
    "จราจร",
    "อุบัติเหตุ",
    "ใบสั่ง",
    "กล้องจับความเร็ว",
    "ด่านตรวจ",
    "ปริมาณรถ",
    "ขับเร็ว",
    "เมาแล้วขับ",
  ],
  "งานรักษาความสงบเรียบร้อย": [
    "ความสงบเรียบร้อย",
    "การชุมนุม",
    "ควบคุมฝูงชน",
    "เทศกาล",
    "งานเฉลิมฉลอง",
    "พื้นที่สาธารณะ",
  ],
  "งานกิจการพิเศษและความมั่นคง": [
    "ความมั่นคง",
    "ก่อการร้าย",
    "ชายแดน",
    "ภัยคุกคาม",
    "ข่าวกรอง",
    "ตรวจคนเข้าเมือง",
    "กิจการพิเศษ",
    "ปกป้องสถาบัน",
  ],
  "งานบรรเทาสาธารณภัย": [
    "สาธารณภัย",
    "บรรเทาภัย",
    "อุทกภัย",
    "อัคคีภัย",
    "แผ่นดินไหว",
    "ค้นหาผู้รอดชีวิต",
    "อพยพ",
    "ภัยพิบัติ",
  ],
  "งานถวายความปลอดภัย": [
    "ถวายความปลอดภัย",
    "ถวายอารักขา",
    "พระบรมวงศานุวงศ์",
    "ขบวนเสด็จ",
    "พระราชพิธี",
    "VVIP",
  ],
  "งานจิตอาสาและบริการประชาชน": [
    "จิตอาสา",
    "บริการประชาชน",
    "พบประชาชน",
    "จิตสาธารณะ",
    "เราทำความดี",
    "ออกหน่วยบริการ",
  ],
  "งานบริหารทรัพยากรบุคคลและฝึกอบรม": [
    "บุคลากร",
    "ฝึกอบรม",
    "หลักสูตร",
    "แต่งตั้ง",
    "โยกย้าย",
    "บรรจุ",
    "ลงเวลา",
    "บริหารบุคคล",
    "สวัสดิการ",
  ],
  "อื่นๆ": [
    "บันทึกข้อความ",
    "หนังสือเวียน",
    "ระเบียบ",
    "คำสั่ง",
    "ประกาศ",
    "ประชุม",
    "แผน",
    "ยุทธศาสตร์",
    "วิจัย",
    "งบประมาณ",
  ],
};

// ── Documents ─────────────────────────────────

export type DocFileType = "PDF" | "DOCX" | "JPG" | "PNG";

export interface IntelDocument {
  id: string;
  title: string;
  fileName: string;
  fileType: DocFileType;
  category: DocCategory;
  /** 0-1 — AI classifier confidence */
  classifierConfidence: number;
  fromUnit: string;
  fromUnitId: string;
  /** OCR-extracted text content */
  extractedText: string;
  summary: string;
  uploadedAt: string;
  pageCount?: number;
  tags: string[];
}

// ── Incidents ─────────────────────────────────

export type IncidentType =
  | "ลักทรัพย์"
  | "ทำร้ายร่างกาย"
  | "ยาเสพติด"
  | "อุบัติเหตุ"
  | "ฉ้อโกง"
  | "อาชญากรรมออนไลน์"
  | "ก่อความวุ่นวาย"
  | "อื่นๆ";

export const INCIDENT_TYPES: IncidentType[] = [
  "ลักทรัพย์",
  "ทำร้ายร่างกาย",
  "ยาเสพติด",
  "อุบัติเหตุ",
  "ฉ้อโกง",
  "อาชญากรรมออนไลน์",
  "ก่อความวุ่นวาย",
  "อื่นๆ",
];

export type IncidentSeverity = "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";

export const SEVERITY_LABELS: Record<IncidentSeverity, string> = {
  LOW: "ต่ำ",
  MEDIUM: "ปานกลาง",
  HIGH: "สูง",
  CRITICAL: "วิกฤต",
};

export const SEVERITY_STYLES: Record<IncidentSeverity, string> = {
  LOW: "bg-slate-100 text-slate-700 border-slate-300",
  MEDIUM: "bg-amber-50 text-amber-800 border-amber-300",
  HIGH: "bg-orange-50 text-orange-800 border-orange-300",
  CRITICAL: "bg-red-50 text-red-800 border-red-300",
};

export type IncidentSource =
  | "191"
  | "ประชาชนแจ้ง"
  | "ตำรวจตรวจพบ"
  | "CCTV"
  | "ข่าวกรอง";

export type IncidentStatus = "OPEN" | "INVESTIGATING" | "CLOSED";

export const INCIDENT_STATUS_LABELS: Record<IncidentStatus, string> = {
  OPEN: "รับแจ้ง",
  INVESTIGATING: "อยู่ระหว่างสืบสวน",
  CLOSED: "ปิดคดี",
};

export interface IncidentLocation {
  lat: number;
  lng: number;
  address: string;
  province: string;
  district: string;
}

export interface Incident {
  id: string;
  type: IncidentType;
  severity: IncidentSeverity;
  description: string;
  location: IncidentLocation;
  occurredAt: string;
  reportedAt: string;
  source: IncidentSource;
  unitId: string;
  status: IncidentStatus;
  arrests?: number;
}

// ── Predictive trends ─────────────────────────

export type TrendDirection = "up" | "down" | "flat";

export interface TrendPoint {
  period: string; // "ม.ค. ๖๘", "ก.พ. ๖๘", ...
  value: number;
}

export interface PredictedPoint {
  period: string;
  value: number;
  confidence: number; // 0-1
}

export interface PredictiveTrend {
  id: string;
  metric: string; // e.g., "คดียาเสพติด ภ.๔"
  category: IncidentType;
  unitId: string;
  /** 12-month historical series */
  historical: TrendPoint[];
  /** 3-month predicted series */
  predicted: PredictedPoint[];
  /** Detected driver factors affecting the trend */
  driverFactors: string[];
  /** AI recommendation */
  recommendation: string;
  /** Overall direction summary */
  direction: TrendDirection;
  /** Percentage change forecast (e.g., +12.5 means +12.5%) */
  forecastChangePct: number;
}

// ── Executive summary ─────────────────────────

export interface SummaryTrend {
  metric: string;
  change: number; // percent
  direction: TrendDirection;
}

export interface SummaryDataPoint {
  label: string;
  value: number;
}

export interface ExecutiveSummary {
  id: string;
  period: string;
  scope: string; // "ภาพรวมประเทศ" | "บช.น." | "ภ.๕" | ...
  generatedAt: string;
  headline: string;
  keyFindings: string[];
  trends: SummaryTrend[];
  recommendations: string[];
  data: SummaryDataPoint[];
}

// ── Search ────────────────────────────────────

export type SearchMode = "BASIC" | "ADVANCED" | "FULLTEXT" | "SEMANTIC";

export const SEARCH_MODE_LABELS: Record<SearchMode, string> = {
  BASIC: "ค้นหาทั่วไป",
  ADVANCED: "ค้นหาขั้นสูง",
  FULLTEXT: "ค้นหาเต็มข้อความ",
  SEMANTIC: "ค้นหาเชิงความหมาย",
};

export type SearchResultType =
  | "command"
  | "document"
  | "incident"
  | "assessment"
  | "form";

export const RESULT_TYPE_LABELS: Record<SearchResultType, string> = {
  command: "หนังสือสั่งการ",
  document: "เอกสาร",
  incident: "เหตุการณ์",
  assessment: "แบบประเมิน",
  form: "แบบฟอร์ม",
};

export interface SearchResult {
  id: string;
  type: SearchResultType;
  title: string;
  snippet: string;
  href: string;
  /** 0-1, higher = better match */
  score: number;
  matchedTerms: string[];
}

export interface SearchFilters {
  types?: SearchResultType[];
  dateFrom?: string;
  dateTo?: string;
  unitId?: string;
}
