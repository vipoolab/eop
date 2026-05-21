// Compliance types — TOR 5.4.3

export type ComplianceStandard = "GOR_POR_ROR" | "ITA" | "PMQA" | "GOV4_0" | "CUSTOM";
export type ReportStatus = "DRAFT" | "SUBMITTED" | "REVIEWED" | "APPROVED";

export const STANDARD_LABELS: Record<ComplianceStandard, string> = {
  GOR_POR_ROR: "ก.พ.ร.",
  ITA: "ITA",
  PMQA: "PMQA",
  GOV4_0: "ระบบราชการ 4.0",
  CUSTOM: "อื่นๆ",
};

export const STANDARD_DESCRIPTIONS: Record<ComplianceStandard, string> = {
  GOR_POR_ROR: "สำนักงาน ก.พ.ร. — ตัวชี้วัดผลการปฏิบัติราชการ",
  ITA: "ITA — Integrity & Transparency Assessment",
  PMQA: "PMQA — Public sector Management Quality Award",
  GOV4_0: "ระบบราชการ 4.0 — OPDC รายงานประจำปี",
  CUSTOM: "แบบกำหนดเอง",
};

export const STANDARD_COLORS: Record<ComplianceStandard, string> = {
  GOR_POR_ROR: "bg-blue-50 text-blue-700 border-blue-200",
  ITA: "bg-emerald-50 text-emerald-700 border-emerald-200",
  PMQA: "bg-violet-50 text-violet-700 border-violet-200",
  GOV4_0: "bg-amber-50 text-amber-700 border-amber-200",
  CUSTOM: "bg-slate-100 text-slate-700 border-slate-200",
};

export const STATUS_LABELS: Record<ReportStatus, string> = {
  DRAFT: "ร่าง",
  SUBMITTED: "ส่ง Reviewer",
  REVIEWED: "ตรวจแล้ว",
  APPROVED: "อนุมัติส่ง",
};

export const STATUS_COLORS: Record<ReportStatus, string> = {
  DRAFT: "bg-slate-100 text-slate-700 border-slate-200",
  SUBMITTED: "bg-blue-100 text-blue-700 border-blue-300",
  REVIEWED: "bg-amber-100 text-amber-700 border-amber-300",
  APPROVED: "bg-emerald-100 text-emerald-700 border-emerald-300",
};

/** Deadline urgency — color-coded for at-a-glance UI */
export type DeadlineUrgency = "none" | "safe" | "soon" | "urgent" | "critical" | "overdue";

export const URGENCY_COLORS: Record<DeadlineUrgency, string> = {
  none: "bg-slate-100 text-slate-600 border-slate-200",
  safe: "bg-emerald-50 text-emerald-700 border-emerald-200",
  soon: "bg-amber-50 text-amber-700 border-amber-200",
  urgent: "bg-orange-50 text-orange-700 border-orange-200",
  critical: "bg-rose-50 text-rose-700 border-rose-300",
  overdue: "bg-slate-900 text-white border-slate-900",
};

export function getDeadlineUrgency(
  dueDate: Date | null | undefined,
  now: Date = new Date()
): { urgency: DeadlineUrgency; daysLeft: number | null; label: string } {
  if (!dueDate) return { urgency: "none", daysLeft: null, label: "—" };
  const diffMs = new Date(dueDate).getTime() - now.getTime();
  const days = Math.ceil(diffMs / (1000 * 60 * 60 * 24));
  if (days < 0) return { urgency: "overdue", daysLeft: days, label: `เลย ${Math.abs(days)} วัน` };
  if (days < 7) return { urgency: "critical", daysLeft: days, label: `เหลือ ${days} วัน` };
  if (days < 15) return { urgency: "urgent", daysLeft: days, label: `เหลือ ${days} วัน` };
  if (days < 30) return { urgency: "soon", daysLeft: days, label: `เหลือ ${days} วัน` };
  return { urgency: "safe", daysLeft: days, label: `เหลือ ${days} วัน` };
}

/** Effective score: reviewer wins if set, else self */
export function effectiveScore(
  selfScore: number | null,
  reviewerScore: number | null
): number | null {
  if (reviewerScore !== null && reviewerScore !== undefined) return reviewerScore;
  if (selfScore !== null && selfScore !== undefined) return selfScore;
  return null;
}

/**
 * Calculate report total: % based on weighted sum of effectiveScore/5
 * Items without score counted as 0
 */
export function calculateReportScore(
  items: Array<{
    weight: number;
    selfScore: number | null;
    reviewerScore: number | null;
  }>
): { score: number; maxScore: number; percent: number; answered: number } {
  let totalScore = 0;
  let maxScore = 0;
  let answered = 0;
  for (const it of items) {
    const eff = effectiveScore(it.selfScore, it.reviewerScore);
    maxScore += it.weight * 5;
    if (eff !== null) {
      totalScore += eff * it.weight;
      answered += 1;
    }
  }
  const percent = maxScore > 0 ? (totalScore / maxScore) * 100 : 0;
  return { score: totalScore, maxScore, percent, answered };
}
