// Compliance Reports — ก.พ.ร. / ITA / PMQA

import { PageHeader } from "@/components/page-header";
import {
  ShieldCheck,
  FileText,
  Calendar,
  CheckCircle2,
  Clock,
  AlertCircle,
} from "lucide-react";

const REPORTS = [
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

const STATUS_META = {
  in_progress: {
    label: "กำลังจัดทำ",
    icon: Clock,
    color: "text-amber-700",
    bg: "bg-amber-50 border-amber-200",
    bar: "bg-amber-500",
  },
  submitted: {
    label: "ส่งแล้ว — รอตรวจ",
    icon: AlertCircle,
    color: "text-blue-700",
    bg: "bg-blue-50 border-blue-200",
    bar: "bg-blue-500",
  },
  approved: {
    label: "ผ่านการตรวจ",
    icon: CheckCircle2,
    color: "text-emerald-700",
    bg: "bg-emerald-50 border-emerald-200",
    bar: "bg-emerald-500",
  },
} as const;

const FRAMEWORK_COLOR: Record<string, string> = {
  "ก.พ.ร.": "bg-[#1e3a5f] text-white",
  ITA: "bg-[#b8860b] text-white",
  PMQA: "bg-emerald-700 text-white",
  OPDC: "bg-violet-700 text-white",
};

export default function ComplianceReportsPage() {
  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      <PageHeader
        icon={ShieldCheck}
        eyebrow="Compliance & Reporting"
        title="รายงานตามมาตรฐานราชการ"
        description="ก.พ.ร. · ITA · PMQA · OPDC — รวมศูนย์ติดตามการรายงานและการประเมิน พร้อมระบบเตือนกำหนดส่ง"
      />

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <StatCard label="ทั้งหมด" value={REPORTS.length} />
        <StatCard
          label="กำลังจัดทำ"
          value={REPORTS.filter((r) => r.status === "in_progress").length}
          accent="amber"
        />
        <StatCard
          label="รอตรวจ"
          value={REPORTS.filter((r) => r.status === "submitted").length}
          accent="blue"
        />
        <StatCard
          label="ผ่านการตรวจ"
          value={REPORTS.filter((r) => r.status === "approved").length}
          accent="emerald"
        />
      </div>

      <div className="space-y-3">
        {REPORTS.map((r) => {
          const meta = STATUS_META[r.status as keyof typeof STATUS_META];
          const Icon = meta.icon;
          return (
            <div key={r.code} className="rounded-sm border border-slate-200 bg-white p-5">
              <div className="flex items-start justify-between gap-3 mb-3">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1.5 flex-wrap">
                    <span className={`inline-flex items-center px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wider rounded-sm ${FRAMEWORK_COLOR[r.framework]}`}>
                      {r.framework}
                    </span>
                    <span className="font-mono text-[11px] text-slate-500">
                      {r.code}
                    </span>
                    <span className={`inline-flex items-center gap-1 px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wider rounded-sm border ${meta.bg} ${meta.color}`}>
                      <Icon className="h-2.5 w-2.5" />
                      {meta.label}
                    </span>
                  </div>
                  <h3 className="text-base font-semibold text-slate-900 mb-1">
                    {r.name}
                  </h3>
                  <div className="flex items-center gap-3 text-xs text-slate-500 flex-wrap">
                    <span className="inline-flex items-center gap-1">
                      <Calendar className="h-3 w-3" />
                      {r.period}
                    </span>
                    <span>·</span>
                    <span>กำหนดส่ง: {r.deadline}</span>
                    <span>·</span>
                    <span className="inline-flex items-center gap-1">
                      <FileText className="h-3 w-3" />
                      {r.indicators} ตัวชี้วัด
                    </span>
                  </div>
                </div>
                <div className="text-right shrink-0">
                  <div className="font-mono text-xl font-semibold text-slate-900 tabular-nums">
                    {r.progress}%
                  </div>
                </div>
              </div>

              <div className="h-1.5 w-full rounded-sm bg-slate-100 overflow-hidden">
                <div
                  className={`h-full ${meta.bar} transition-all rounded-sm`}
                  style={{ width: `${r.progress}%` }}
                />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function StatCard({
  label,
  value,
  accent,
}: {
  label: string;
  value: number;
  accent?: "amber" | "blue" | "emerald";
}) {
  const colors = {
    amber: "text-amber-700",
    blue: "text-blue-700",
    emerald: "text-emerald-700",
  };
  return (
    <div className="rounded-sm border border-slate-200 bg-white p-4">
      <div className="text-[10px] font-semibold uppercase tracking-wider text-slate-500 mb-1">
        {label}
      </div>
      <div className={`text-2xl font-semibold tabular-nums ${accent ? colors[accent] : "text-slate-900"}`}>
        {value}
      </div>
    </div>
  );
}
