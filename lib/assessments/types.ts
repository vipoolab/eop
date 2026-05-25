// Types for ระบบวางแผนและติดตามกฎระเบียบ (Assessment Planning & Tracking)

export type AssessmentCategory =
  | "ก.พ.ร."
  | "PMQA"
  | "ITA"
  | "แผนปฏิบัติราชการ"
  | "การจัดการความรู้"
  | "อื่นๆ";

export type AssessmentStatus = "DRAFT" | "PUBLISHED" | "CLOSED";

export type SubmissionStatus = "SUBMITTED" | "REVIEWED" | "RETURNED";

export const ASSESSMENT_CATEGORIES: AssessmentCategory[] = [
  "ก.พ.ร.",
  "PMQA",
  "ITA",
  "แผนปฏิบัติราชการ",
  "การจัดการความรู้",
  "อื่นๆ",
];

export interface AssessmentSubmission {
  id: string;
  unitId: string;
  unitName: string;
  submittedAt: string;
  submittedBy: string;
  submittedByName: string;
  submittedByTitle: string;
  fileName?: string;
  notes?: string;
  status: SubmissionStatus;
  reviewNote?: string;
  reviewedAt?: string;
  reviewedByName?: string;
}

export interface Assessment {
  id: string;
  title: string;
  description: string;
  category: AssessmentCategory;
  instructions: string;
  fileName?: string;
  fileType?: string;
  dueDate: string;
  effectiveDate: string;
  targetUnitIds: string[];
  status: AssessmentStatus;
  createdBy: string;
  createdByName: string;
  createdByTitle: string;
  createdAt: string;
  publishedAt?: string;
  closedAt?: string;
  submissions: AssessmentSubmission[];
}

// ── UI label maps ──────────────────────────────

export const ASSESSMENT_STATUS_LABELS: Record<AssessmentStatus, string> = {
  DRAFT: "ร่าง",
  PUBLISHED: "เผยแพร่",
  CLOSED: "ปิดรับ",
};

export const SUBMISSION_STATUS_LABELS: Record<SubmissionStatus, string> = {
  SUBMITTED: "ส่งแล้ว",
  REVIEWED: "ตรวจแล้ว",
  RETURNED: "ตีกลับ",
};

export const ASSESSMENT_STATUS_STYLES: Record<AssessmentStatus, string> = {
  DRAFT: "bg-slate-100 text-slate-700 border-slate-300 dark:bg-slate-800 dark:text-slate-200 dark:border-slate-700",
  PUBLISHED: "bg-blue-50 text-blue-800 border-blue-300 dark:bg-blue-900/30 dark:text-blue-300 dark:border-blue-700",
  CLOSED: "bg-emerald-50 text-emerald-800 border-emerald-300 dark:bg-emerald-900/30 dark:text-emerald-300 dark:border-emerald-700",
};

export const SUBMISSION_STATUS_STYLES: Record<SubmissionStatus, string> = {
  SUBMITTED: "bg-blue-50 text-blue-800 border-blue-300",
  REVIEWED: "bg-emerald-50 text-emerald-800 border-emerald-300",
  RETURNED: "bg-red-50 text-red-800 border-red-300",
};

export const CATEGORY_STYLES: Record<AssessmentCategory, string> = {
  "ก.พ.ร.": "bg-amber-50 text-amber-800 border-amber-300",
  "PMQA": "bg-purple-50 text-purple-800 border-purple-300",
  "ITA": "bg-red-50 text-red-800 border-red-300",
  "แผนปฏิบัติราชการ": "bg-blue-50 text-blue-800 border-blue-300",
  "การจัดการความรู้": "bg-teal-50 text-teal-800 border-teal-300",
  "อื่นๆ": "bg-slate-50 text-slate-700 border-slate-300",
};
