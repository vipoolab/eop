// Dynamic dashboard for the 5 types — TOR 6.10.10
// (missions / risk / incidents / resources / performance)

import { redirect, notFound } from "next/navigation";
import Link from "next/link";
import { auth } from "@/lib/auth";
import { PageHeader } from "@/components/page-header";
import {
  ListChecks,
  AlertTriangle,
  Siren,
  Boxes,
  UserCheck,
  ArrowLeft,
  TrendingUp,
  Clock,
  Users,
} from "lucide-react";

export const dynamic = "force-dynamic";

const DASHBOARDS: Record<
  string,
  {
    icon: typeof ListChecks;
    title: string;
    description: string;
    color: string;
    metrics: Array<{ label: string; value: string; trend?: string }>;
    sections: string[];
  }
> = {
  missions: {
    icon: ListChecks,
    title: "Mission Progress Dashboard",
    description: "ติดตามภารกิจสำคัญ — เปอร์เซ็นต์ความสำเร็จต่อหน่วยงาน · KPI",
    color: "#1e3a5f",
    metrics: [
      { label: "ภารกิจทั้งหมด", value: "47", trend: "+5" },
      { label: "ดำเนินงาน ≥ 75%", value: "18" },
      { label: "ต่ำกว่า 50%", value: "9", trend: "-2" },
      { label: "ครบกำหนดเดือนนี้", value: "12" },
    ],
    sections: [
      "ภารกิจตามหน่วยงาน (6 units)",
      "ภารกิจตามลำดับความสำคัญ",
      "ไทม์ไลน์ครบกำหนด",
      "ผู้รับผิดชอบและตัวชี้วัด",
    ],
  },
  risk: {
    icon: AlertTriangle,
    title: "Risk Hotspot Dashboard",
    description: "พื้นที่เสี่ยง · ช่วงเวลาเสี่ยง · AI พยากรณ์ + แจ้งเตือน",
    color: "#b8860b",
    metrics: [
      { label: "พื้นที่เสี่ยงสูง", value: "8" },
      { label: "ช่วงเวลาเสี่ยงสูงสุด", value: "18-24 น." },
      { label: "เหตุการณ์ที่คาดการณ์", value: "23" },
      { label: "Accuracy ของพยากรณ์", value: "87%" },
    ],
    sections: [
      "Heatmap พื้นที่เสี่ยงระดับจังหวัด",
      "Time-of-day risk profile",
      "AI Predictive Analytics (7 วัน)",
      "Anomaly Detection",
    ],
  },
  incidents: {
    icon: Siren,
    title: "Incident Response Dashboard",
    description: "เหตุฉุกเฉิน Real-time จาก 191 / CCTV / ข่าวกรอง · MTTR",
    color: "#991b1b",
    metrics: [
      { label: "เหตุการณ์ Active", value: "23" },
      { label: "ระดับวิกฤต", value: "7" },
      { label: "MTTR เฉลี่ย", value: "12 นาที" },
      { label: "หน่วยปฏิบัติ", value: "147" },
    ],
    sections: [
      "เหตุการณ์ปัจจุบัน (Live)",
      "แผนที่เหตุการณ์ + Hotspot",
      "ระยะเวลาตอบสนอง (Response Time)",
      "Coordination ข้าม 191/CCTV/ข่าวกรอง",
    ],
  },
  resources: {
    icon: Boxes,
    title: "Resource Utilization Dashboard",
    description: "กำลังพล · งบประมาณ · ครุภัณฑ์ · สถานที่ — การใช้และปริมาณคงเหลือ",
    color: "#166534",
    metrics: [
      { label: "กำลังพล Active", value: "1,247" },
      { label: "อัตราการใช้งบ", value: "68%" },
      { label: "ครุภัณฑ์รอจัดสรร", value: "34" },
      { label: "ห้องประชุมว่าง", value: "12/30" },
    ],
    sections: [
      "กำลังพลตามหน่วยงาน + สถานะ",
      "งบประมาณ - แผน vs ใช้จริง",
      "ครุภัณฑ์ + การเบิกใช้",
      "พื้นที่และทรัพยากรสาธารณูปโภค",
    ],
  },
  performance: {
    icon: UserCheck,
    title: "Performance & Evaluation Dashboard",
    description: "ผลการปฏิบัติงานบุคคลและทีม — KPI · ก.พ.ร. · เปรียบเทียบเป้าหมาย",
    color: "#7c3aed",
    metrics: [
      { label: "บุคลากรประเมิน", value: "327" },
      { label: "ผ่านเกณฑ์ ก.พ.ร.", value: "91%" },
      { label: "Top performers", value: "42" },
      { label: "ต้องพัฒนา", value: "18" },
    ],
    sections: [
      "ผลคะแนน ก.พ.ร. รายบุคคล",
      "ผลงานเทียบกับเป้าหมายปี",
      "การพัฒนาบุคลากร (Training)",
      "Performance Distribution",
    ],
  },
};

export default async function DashboardTypePage({
  params,
}: {
  params: Promise<{ type: string }>;
}) {
  const session = await auth();
  if (!session?.user) redirect("/login");

  const { type } = await params;
  const meta = DASHBOARDS[type];
  if (!meta) notFound();

  const Icon = meta.icon;

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      <Link
        href="/dashboards"
        className="inline-flex items-center gap-1 text-sm text-slate-600 hover:text-slate-900 transition-colors"
      >
        <ArrowLeft className="h-4 w-4" />
        กลับไปยังศูนย์ Dashboard
      </Link>

      <PageHeader
        icon={Icon}
        eyebrow="Data & AI · Dashboards"
        title={meta.title}
        description={meta.description}
      />

      {/* Metrics */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {meta.metrics.map((m) => (
          <div
            key={m.label}
            className="rounded-sm border border-slate-200 bg-white p-4"
          >
            <div className="text-[10px] font-semibold uppercase tracking-wider text-slate-500 mb-1">
              {m.label}
            </div>
            <div className="flex items-baseline gap-2">
              <span
                className="text-2xl font-semibold tabular-nums"
                style={{ color: meta.color }}
              >
                {m.value}
              </span>
              {m.trend && (
                <span className="text-xs text-emerald-700 font-semibold">
                  {m.trend}
                </span>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Sections preview */}
      <div className="rounded-sm border border-slate-200 bg-white p-5">
        <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-500 mb-3">
          ส่วนประกอบของ Dashboard
        </h3>
        <ul className="space-y-2">
          {meta.sections.map((s, i) => (
            <li
              key={i}
              className="flex items-center gap-3 rounded-sm border border-slate-100 bg-slate-50/50 px-3 py-2.5"
            >
              <div
                className="flex h-7 w-7 items-center justify-center rounded-sm text-white text-xs font-bold"
                style={{ backgroundColor: meta.color }}
              >
                {i + 1}
              </div>
              <span className="text-sm text-slate-700">{s}</span>
            </li>
          ))}
        </ul>
      </div>

      {/* Phase 2 callout */}
      <div className="rounded-sm border border-[#b8860b]/30 bg-[#b8860b]/5 p-4 flex items-start gap-3">
        <TrendingUp className="h-4 w-4 text-[#b8860b] mt-0.5 shrink-0" />
        <div className="text-xs text-slate-700 leading-relaxed">
          <strong className="text-[#b8860b]">Dashboard นี้กำลังพัฒนา (Phase 2)</strong>
          {" "}— จะแสดงข้อมูล real-time จากระบบ EOP + integration กับ data sources
          ภายนอก (ก.พ.ร./191/CCTV) พร้อม drill-down + filter + export
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        {[
          { icon: Clock, label: "Refresh", value: "Real-time" },
          { icon: Users, label: "Access", value: "RBAC controlled" },
          { icon: TrendingUp, label: "Export", value: "PDF / Excel / CSV" },
        ].map((f) => {
          const FIcon = f.icon;
          return (
            <div
              key={f.label}
              className="rounded-sm border border-slate-200 bg-white p-4 flex items-center gap-3"
            >
              <FIcon className="h-5 w-5 text-slate-400" />
              <div>
                <div className="text-[10px] uppercase tracking-wider text-slate-500">
                  {f.label}
                </div>
                <div className="text-sm font-semibold text-slate-800">
                  {f.value}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
