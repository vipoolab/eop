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

/** 6 หมวดเอกสารตามโครงสร้าง สยศ.ตร. */
export type DocCategory = "ยศ." | "ผบ." | "มค." | "มข." | "วจ." | "อจ.";

export const DOC_CATEGORIES: DocCategory[] = [
  "ยศ.",
  "ผบ.",
  "มค.",
  "มข.",
  "วจ.",
  "อจ.",
];

export const CATEGORY_DESCRIPTIONS: Record<DocCategory, string> = {
  "ยศ.": "กองยุทธศาสตร์",
  "ผบ.": "กองแผนงานอำนวยการ",
  "มค.": "กองแผนงานความมั่นคง",
  "มข.": "กองแผนงานกิจการพิเศษ",
  "วจ.": "กองวิจัย",
  "อจ.": "ฝ่ายอำนวยการ สยศ.ตร.",
};

export const CATEGORY_STYLES: Record<DocCategory, string> = {
  "ยศ.": "bg-blue-50 text-blue-800 border-blue-300 dark:bg-blue-900/30 dark:text-blue-300 dark:border-blue-700",
  "ผบ.": "bg-amber-50 text-amber-800 border-amber-300 dark:bg-amber-900/30 dark:text-amber-300 dark:border-amber-700",
  "มค.": "bg-red-50 text-red-800 border-red-300 dark:bg-red-900/30 dark:text-red-300 dark:border-red-700",
  "มข.": "bg-purple-50 text-purple-800 border-purple-300 dark:bg-purple-900/30 dark:text-purple-300 dark:border-purple-700",
  "วจ.": "bg-teal-50 text-teal-800 border-teal-300 dark:bg-teal-900/30 dark:text-teal-300 dark:border-teal-700",
  "อจ.": "bg-slate-100 text-slate-700 border-slate-300 dark:bg-slate-800 dark:text-slate-200 dark:border-slate-700",
};

export const CATEGORY_KEYWORDS: Record<DocCategory, string[]> = {
  "ยศ.": [
    "ยุทธศาสตร์",
    "แผน 20 ปี",
    "แผนแม่บท",
    "ตัวชี้วัด",
    "KPI",
    "ยุทธศาสตร์ชาติ",
    "แผนปฏิบัติราชการ",
  ],
  "ผบ.": [
    "อำนวยการ",
    "บริหาร",
    "ระเบียบ",
    "คำสั่ง",
    "ประกาศ",
    "หนังสือสั่งการ",
    "ทรัพยากร",
    "งบประมาณ",
  ],
  "มค.": [
    "ความมั่นคง",
    "ก่อการร้าย",
    "ความสงบเรียบร้อย",
    "ชายแดน",
    "ภัยคุกคาม",
    "ข่าวกรอง",
    "การชุมนุม",
    "ปกป้องสถาบัน",
  ],
  "มข.": [
    "กิจการพิเศษ",
    "ภารกิจพิเศษ",
    "ป้องกัน",
    "ปราบปราม",
    "ยาเสพติด",
    "อาชญากรรมข้ามชาติ",
    "ค้ามนุษย์",
    "ตรวจคนเข้าเมือง",
  ],
  "วจ.": [
    "วิจัย",
    "ศึกษา",
    "พัฒนา",
    "วิเคราะห์",
    "ผลการวิจัย",
    "งานวิจัย",
    "นวัตกรรม",
    "ข้อมูลสถิติ",
  ],
  "อจ.": [
    "ธุรการ",
    "การประชุม",
    "บันทึกข้อความ",
    "เวียน",
    "แจ้งเวียน",
    "ลงเวลา",
    "หนังสือเวียน",
    "อำนวยการสยศ",
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
