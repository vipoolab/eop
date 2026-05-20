// Compliance Reports catalog — single source of truth
// Used by both /compliance/reports page and /api/reports/export

export type ReportStatus = "in_progress" | "submitted" | "approved";

export interface CatalogReport {
  code: string;
  name: string;
  framework: "ก.พ.ร." | "ITA" | "PMQA" | "OPDC";
  period: string;
  deadline: string;
  progress: number;
  status: ReportStatus;
  indicators: number;
}

export const COMPLIANCE_REPORTS: CatalogReport[] = [
  {
    code: "GPR-Q2-2569",
    name: "ก.พ.ร. — ผลการปฏิบัติราชการ ไตรมาส 2/2569",
    framework: "ก.พ.ร.",
    period: "เม.ย. — มิ.ย. 2569",
    deadline: "15 ก.ค. 2569",
    progress: 78,
    status: "in_progress",
    indicators: 12,
  },
  {
    code: "ITA-2569",
    name: "ITA — Integrity & Transparency Assessment",
    framework: "ITA",
    period: "ปีงบประมาณ 2569",
    deadline: "30 ก.ย. 2569",
    progress: 45,
    status: "in_progress",
    indicators: 28,
  },
  {
    code: "PMQA-2568",
    name: "PMQA — รางวัลคุณภาพการบริหารจัดการภาครัฐ",
    framework: "PMQA",
    period: "ปีงบประมาณ 2568",
    deadline: "ส่งแล้ว — รอผล",
    progress: 100,
    status: "submitted",
    indicators: 7,
  },
  {
    code: "OPDC-2569",
    name: "สำนักงาน ก.พ.ร. — รายงานประจำปี",
    framework: "OPDC",
    period: "ปีงบประมาณ 2569",
    deadline: "30 ต.ค. 2569",
    progress: 22,
    status: "in_progress",
    indicators: 18,
  },
  {
    code: "GPR-Q1-2569",
    name: "ก.พ.ร. — ผลการปฏิบัติราชการ ไตรมาส 1/2569",
    framework: "ก.พ.ร.",
    period: "ต.ค. — ธ.ค. 2568",
    deadline: "ส่งแล้ว · ผ่าน",
    progress: 100,
    status: "approved",
    indicators: 12,
  },
];

export function findReportByCode(code: string): CatalogReport | undefined {
  return COMPLIANCE_REPORTS.find((r) => r.code === code);
}
