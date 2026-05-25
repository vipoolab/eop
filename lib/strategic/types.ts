// Types for คลังแผนยุทธศาสตร์ — 3 ระดับ
//
// Plan hierarchy:
//   PlanDocument (level 1, 2, or 3) — one uploaded file
//     └─ PlanItem (recursive tree of "ข้อ" inside the document)
//
// Document-level relations:
//   level 2 doc → parentDocId = id of level 1 doc (the singleton)
//   level 3 doc → parentDocId = id of a level 2 doc

export type PlanLevel = 1 | 2 | 3;

export const PLAN_LEVEL_LABELS: Record<PlanLevel, string> = {
  1: "ยุทธศาสตร์ชาติ",
  2: "แผนแม่บท",
  3: "แผนปฏิบัติราชการ",
};

export const PLAN_LEVEL_SHORT: Record<PlanLevel, string> = {
  1: "ระดับ 1",
  2: "ระดับ 2",
  3: "ระดับ 3",
};

export type ParseStatus = "PENDING" | "PARSING" | "PARSED" | "FAILED";

export interface PlanItem {
  id: string;
  documentId: string;
  parentItemId: string | null;
  number: string; // "1", "1.1", "1.2.1"
  name: string;
  description?: string;
  meta?: {
    kpi?: string;
    targetYear?: string;
    owner?: string; // หน่วยงานรับผิดชอบ
    budget?: number;
  };
  order: number;
  children?: PlanItem[]; // populated by tree builder
}

export interface PlanDocument {
  id: string;
  level: PlanLevel;
  title: string;
  description?: string;
  metadata?: {
    startYear?: number;
    endYear?: number;
    vision?: string;
    issuedBy?: string; // ผู้ออกแผน
    agency?: string;
    fiscalYear?: string;
  };

  parentDocId: string | null; // level 2 → level 1; level 3 → level 2

  // Upload metadata
  fileName?: string;
  fileSize?: number;
  uploadedAt: string; // ISO date
  uploadedBy?: string;

  // AI parsing
  parseStatus: ParseStatus;
  parsedAt?: string;
  parsedBy?: string; // model name e.g. "claude-opus-4-7"
  parseError?: string;
  parseTokens?: number;
  parseDurationMs?: number;

  // Mock vs real upload
  isSeed?: boolean;
}

// API shapes
export interface PlanTreeNode extends PlanDocument {
  items: PlanItem[]; // root items, with .children populated
  childDocs: PlanTreeNode[]; // child documents
  itemCount: number;
  totalItemCount: number; // including descendants
}

export interface PlanSummaryStats {
  level1Count: number; // always 0 or 1
  level2Count: number;
  level3Count: number;
  totalItems: number; // all PlanItems across all docs
  lastUpdatedAt: string | null;
}

// Parser output from Claude
export interface ParsedPlanResult {
  title: string;
  description?: string;
  metadata?: PlanDocument["metadata"];
  items: ParsedPlanItem[];
}

export interface ParsedPlanItem {
  number: string;
  name: string;
  description?: string;
  meta?: PlanItem["meta"];
  sub_items?: ParsedPlanItem[];
}
