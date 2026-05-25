// /intelligence/dashboards/progress — KPI / Progress dashboard

import Link from "next/link";
import { Target, ChevronLeft, CheckCircle2, AlertTriangle, Activity } from "lucide-react";
import { PageHeader } from "@/components/page-header";
import { getStats, listDocuments } from "@/lib/strategic/store";

export const dynamic = "force-dynamic";

interface UnitProgress {
  unit: string;
  target: number;
  actual: number;
  pct: number;
  status: "ON_TRACK" | "AT_RISK" | "BEHIND";
}

const UNIT_PROGRESS: UnitProgress[] = [
  { unit: "บช.น.", target: 100, actual: 88, pct: 88, status: "ON_TRACK" },
  { unit: "ภ.๑", target: 100, actual: 92, pct: 92, status: "ON_TRACK" },
  { unit: "ภ.๒", target: 100, actual: 76, pct: 76, status: "AT_RISK" },
  { unit: "ภ.๓", target: 100, actual: 68, pct: 68, status: "AT_RISK" },
  { unit: "ภ.๔", target: 100, actual: 82, pct: 82, status: "ON_TRACK" },
  { unit: "ภ.๕", target: 100, actual: 94, pct: 94, status: "ON_TRACK" },
  { unit: "ภ.๖", target: 100, actual: 71, pct: 71, status: "AT_RISK" },
  { unit: "ภ.๗", target: 100, actual: 84, pct: 84, status: "ON_TRACK" },
  { unit: "ภ.๘", target: 100, actual: 89, pct: 89, status: "ON_TRACK" },
  { unit: "ภ.๙", target: 100, actual: 58, pct: 58, status: "BEHIND" },
  { unit: "บช.ปส.", target: 100, actual: 87, pct: 87, status: "ON_TRACK" },
  { unit: "บช.สอท.", target: 100, actual: 74, pct: 74, status: "AT_RISK" },
];

const KPIS = [
  { name: "อัตราการลดอาชญากรรม", target: 10, actual: 8.4, unit: "%" },
  { name: "ระยะเวลาตอบสนอง ๑๙๑", target: 10, actual: 8.75, unit: "นาที" },
  { name: "ความพึงพอใจประชาชน", target: 85, actual: 82.4, unit: "%" },
  { name: "อัตราการเคลียร์คดี", target: 75, actual: 78.2, unit: "%" },
  { name: "การจับกุมยาเสพติด (เครือข่าย)", target: 50, actual: 62, unit: "ราย" },
  { name: "การฝึกอบรมเจ้าหน้าที่ดิจิทัล", target: 90, actual: 85, unit: "%" },
];

export default function ProgressDashboardPage() {
  const stats = getStats();
  const docs = listDocuments();
  const onTrack = UNIT_PROGRESS.filter((u) => u.status === "ON_TRACK").length;
  const atRisk = UNIT_PROGRESS.filter((u) => u.status === "AT_RISK").length;
  const behind = UNIT_PROGRESS.filter((u) => u.status === "BEHIND").length;
  const avg = Math.round(
    UNIT_PROGRESS.reduce((acc, u) => acc + u.pct, 0) / UNIT_PROGRESS.length
  );

  return (
    <div className="space-y-6">
      <PageHeader
        icon={Target}
        eyebrow="แดชบอร์ดเฉพาะทาง"
        title="แดชบอร์ดความก้าวหน้า"
        description="ติดตามผลการดำเนินงานตามแผนยุทธศาสตร์ — KPI ของแต่ละ บช./ภ./บก. รวมถึง KPI หลักของ ตร."
        actions={
          <Link
            href="/intelligence/dashboards"
            className="inline-flex items-center gap-1.5 rounded-sm border border-slate-200 hover:border-slate-300 text-sm font-medium px-3 py-2 transition-colors text-slate-700"
          >
            <ChevronLeft className="h-4 w-4" />
            กลับ
          </Link>
        }
      />

      {/* Top stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <StatBox
          icon={Activity}
          label="ความสำเร็จเฉลี่ย"
          value={`${avg}%`}
          accent="navy"
        />
        <StatBox
          icon={CheckCircle2}
          label="หน่วยทำได้ตามเป้า"
          value={`${onTrack}/${UNIT_PROGRESS.length}`}
          accent="emerald"
        />
        <StatBox
          icon={AlertTriangle}
          label="หน่วยมีความเสี่ยง"
          value={`${atRisk}`}
          accent="amber"
        />
        <StatBox
          icon={AlertTriangle}
          label="หน่วยล่าช้า"
          value={`${behind}`}
          accent="red"
        />
      </div>

      {/* Strategic plans link */}
      <div className="rounded-sm border border-blue-200 bg-blue-50 p-4">
        <div className="text-sm font-semibold text-blue-900">
          🔗 อ้างอิงแผนยุทธศาสตร์ใน{" "}
          <Link href="/strategic" className="underline">
            คลังแผนยุทธศาสตร์
          </Link>
          {" "}
          ({docs.length} ฉบับ · {stats.totalItems ?? 0}{" "}
          แผนปฏิบัติราชการ)
        </div>
      </div>

      {/* Unit progress */}
      <section className="bg-white border border-slate-200 rounded-sm overflow-hidden">
        <div className="border-b border-slate-100 px-5 py-3">
          <h2 className="text-sm font-semibold text-slate-900">
            ความก้าวหน้าราย บช.
          </h2>
        </div>
        <div className="p-5 space-y-3">
          {UNIT_PROGRESS.map((u) => {
            const color =
              u.status === "ON_TRACK"
                ? "bg-emerald-500"
                : u.status === "AT_RISK"
                  ? "bg-amber-500"
                  : "bg-red-500";
            return (
              <div key={u.unit} className="space-y-1">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-semibold text-slate-900">{u.unit}</span>
                  <span className="tabular-nums text-slate-600">
                    {u.actual}/{u.target} ({u.pct}%)
                  </span>
                </div>
                <div className="h-3 bg-slate-100 rounded-sm overflow-hidden">
                  <div
                    className={`h-full ${color} rounded-sm transition-all`}
                    style={{ width: `${u.pct}%` }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* KPI table */}
      <section className="bg-white border border-slate-200 rounded-sm overflow-hidden">
        <div className="border-b border-slate-100 px-5 py-3">
          <h2 className="text-sm font-semibold text-slate-900">
            ตัวชี้วัดหลัก (KPI) ระดับ ตร.
          </h2>
        </div>
        <div className="divide-y divide-slate-100">
          {KPIS.map((k) => {
            const pct = (k.actual / k.target) * 100;
            const achieved = pct >= 100;
            const color = achieved
              ? "bg-emerald-500"
              : pct >= 80
                ? "bg-blue-500"
                : pct >= 60
                  ? "bg-amber-500"
                  : "bg-red-500";
            return (
              <div key={k.name} className="px-5 py-3.5">
                <div className="flex items-center justify-between mb-1.5">
                  <div className="text-sm font-semibold text-slate-900">
                    {k.name}
                  </div>
                  <div className="text-sm tabular-nums">
                    <span className="font-bold text-slate-900">
                      {k.actual} {k.unit}
                    </span>
                    <span className="text-slate-400 ml-2 text-xs">
                      / เป้า {k.target} {k.unit}
                    </span>
                    {achieved && (
                      <span className="ml-2 text-[10px] font-semibold bg-emerald-100 text-emerald-800 border border-emerald-200 rounded-sm px-1.5 py-0.5">
                        บรรลุ ✓
                      </span>
                    )}
                  </div>
                </div>
                <div className="h-2 bg-slate-100 rounded-sm overflow-hidden">
                  <div
                    className={`h-full ${color} rounded-sm`}
                    style={{ width: `${Math.min(100, pct)}%` }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </section>
    </div>
  );
}

function StatBox({
  icon: Icon,
  label,
  value,
  accent,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: string;
  accent: "navy" | "emerald" | "amber" | "red";
}) {
  const colors: Record<typeof accent, string> = {
    navy: "bg-[#1e3a5f] text-white",
    emerald: "bg-emerald-600 text-white",
    amber: "bg-amber-600 text-white",
    red: "bg-red-600 text-white",
  };
  return (
    <div className="rounded-sm border border-slate-200 bg-white p-4 flex items-center gap-3">
      <div className={`h-10 w-10 rounded-sm flex items-center justify-center ${colors[accent]}`}>
        <Icon className="h-4 w-4" />
      </div>
      <div>
        <div className="text-[10px] font-semibold uppercase tracking-wider text-slate-500">
          {label}
        </div>
        <div className="text-2xl font-bold text-slate-900 leading-none mt-1">
          {value}
        </div>
      </div>
    </div>
  );
}
