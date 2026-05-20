// Mission & Agenda Management

import { PageHeader } from "@/components/page-header";
import { ListChecks, Target, Calendar, Users, AlertTriangle } from "lucide-react";

const MISSIONS = [
  {
    code: "M-2569-001",
    title: "ปราบปรามยาเสพติดในพื้นที่ภาคใต้",
    description: "เร่งรัดการจับกุมและขยายผลคดียาเสพติด ภาคใต้ 9 จังหวัด",
    owner: "พล.ต.ต. สมชาย แสงทอง",
    unit: "มค.",
    priority: "HIGH",
    progress: 65,
    deadline: "30 ก.ย. 2569",
    sub: "12 หน่วยปฏิบัติ",
  },
  {
    code: "M-2569-002",
    title: "ถวายความปลอดภัยฯ และงานพิเศษพระราชพิธี",
    description: "ปฏิบัติการถวายความปลอดภัยและอำนวยความสะดวกการจราจร",
    owner: "พล.ต.ต. สมชาย แสงทอง",
    unit: "มข.",
    priority: "CRITICAL",
    progress: 90,
    deadline: "เป็นไปตามหมายกำหนดการ",
    sub: "6 หน่วยปฏิบัติ",
  },
  {
    code: "M-2569-003",
    title: "บริหารงานบุคคลและสวัสดิการ ประจำปี 2569",
    description: "ปรับปรุงระบบประเมินผลและสวัสดิการเจ้าหน้าที่",
    owner: "พ.ต.อ. ปกครอง พลเรือน",
    unit: "ผบ.",
    priority: "NORMAL",
    progress: 42,
    deadline: "30 ก.ย. 2569",
    sub: "8 หน่วยปฏิบัติ",
  },
  {
    code: "M-2569-004",
    title: "เตรียมความพร้อมรับสาธารณภัย",
    description: "จัดทำแผนเผชิญเหตุและฝึกซ้อมรับมือภัยพิบัติ",
    owner: "พ.ต.ท. วิชัย ใจดี",
    unit: "มข.",
    priority: "HIGH",
    progress: 78,
    deadline: "15 ส.ค. 2569",
    sub: "10 หน่วยปฏิบัติ",
  },
  {
    code: "M-2569-005",
    title: "การพัฒนาตัวชี้วัด KPI ด้วย Big Data",
    description: "พัฒนาดัชนีชี้วัดประสิทธิภาพการป้องกันอาชญากรรม",
    owner: "พ.ต.ท. วิชัย ใจดี",
    unit: "วจ.",
    priority: "NORMAL",
    progress: 35,
    deadline: "ตลอดปีงบประมาณ",
    sub: "3 หน่วยปฏิบัติ",
  },
];

const PRIORITY_META: Record<string, string> = {
  CRITICAL: "bg-rose-50 text-rose-700 border-rose-200",
  HIGH: "bg-amber-50 text-amber-700 border-amber-200",
  NORMAL: "bg-slate-100 text-slate-600 border-slate-300",
  LOW: "bg-slate-50 text-slate-500 border-slate-200",
};

const PRIORITY_LABEL: Record<string, string> = {
  CRITICAL: "ด่วนที่สุด",
  HIGH: "สูง",
  NORMAL: "ปกติ",
  LOW: "ต่ำ",
};

export default function MissionsPage() {
  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      <PageHeader
        icon={ListChecks}
        eyebrow="Agenda-based"
        title="ภารกิจและวาระสำคัญ"
        description="บริหารวาระและภารกิจของ ตร. — กำหนดเป้าหมาย ผู้รับผิดชอบ และตัวชี้วัด"
      />

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <StatCard label="ภารกิจทั้งหมด" value={MISSIONS.length} />
        <StatCard
          label="ด่วนที่สุด"
          value={MISSIONS.filter((m) => m.priority === "CRITICAL").length}
          accent="rose"
        />
        <StatCard
          label="ดำเนินงาน ≥ 75%"
          value={MISSIONS.filter((m) => m.progress >= 75).length}
          accent="emerald"
        />
        <StatCard
          label="ดำเนินงาน < 50%"
          value={MISSIONS.filter((m) => m.progress < 50).length}
          accent="amber"
        />
      </div>

      <div className="space-y-3">
        {MISSIONS.map((m) => (
          <div
            key={m.code}
            className="rounded-sm border border-slate-200 bg-white p-5"
          >
            <div className="flex items-start justify-between gap-3 mb-3">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1.5 flex-wrap">
                  <span className="font-mono text-[11px] text-slate-500">
                    {m.code}
                  </span>
                  <span className="inline-flex items-center px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wider rounded-sm bg-[#1e3a5f] text-white">
                    {m.unit}
                  </span>
                  <span
                    className={`inline-flex items-center gap-1 px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wider rounded-sm border ${PRIORITY_META[m.priority]}`}
                  >
                    {m.priority === "CRITICAL" && (
                      <AlertTriangle className="h-2.5 w-2.5" />
                    )}
                    {PRIORITY_LABEL[m.priority]}
                  </span>
                </div>
                <h3 className="text-base font-semibold text-slate-900 mb-1">
                  {m.title}
                </h3>
                <p className="text-xs text-slate-600 mb-2">{m.description}</p>
                <div className="flex items-center gap-4 text-[11px] text-slate-500 flex-wrap">
                  <span className="inline-flex items-center gap-1">
                    <Target className="h-3 w-3" />
                    {m.owner}
                  </span>
                  <span className="inline-flex items-center gap-1">
                    <Users className="h-3 w-3" />
                    {m.sub}
                  </span>
                  <span className="inline-flex items-center gap-1">
                    <Calendar className="h-3 w-3" />
                    {m.deadline}
                  </span>
                </div>
              </div>
              <div className="text-right shrink-0">
                <div className="font-mono text-xl font-semibold text-slate-900 tabular-nums">
                  {m.progress}%
                </div>
                <div className="text-[10px] uppercase tracking-wider text-slate-500">
                  ดำเนินการ
                </div>
              </div>
            </div>

            <div className="h-1.5 w-full rounded-sm bg-slate-100 overflow-hidden">
              <div
                className={`h-full rounded-sm transition-all ${
                  m.progress >= 75
                    ? "bg-emerald-500"
                    : m.progress >= 50
                      ? "bg-amber-500"
                      : "bg-rose-500"
                }`}
                style={{ width: `${m.progress}%` }}
              />
            </div>
          </div>
        ))}
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
  accent?: "rose" | "emerald" | "amber";
}) {
  const colors = {
    rose: "text-rose-700",
    emerald: "text-emerald-700",
    amber: "text-amber-700",
  };
  return (
    <div className="rounded-sm border border-slate-200 bg-white p-4">
      <div className="text-[10px] font-semibold uppercase tracking-wider text-slate-500 mb-1">
        {label}
      </div>
      <div
        className={`text-2xl font-semibold tabular-nums ${accent ? colors[accent] : "text-slate-900"}`}
      >
        {value}
      </div>
    </div>
  );
}
