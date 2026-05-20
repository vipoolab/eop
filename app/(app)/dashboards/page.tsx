// Dashboards Hub — 5 types per TOR 6.10.10
// (ข.1) ความก้าวหน้าภารกิจ
// (ข.2) พื้นที่/ช่วงเวลาความเสี่ยง
// (ข.3) เหตุฉุกเฉินและการตอบสนอง
// (ข.4) การใช้ทรัพยากร
// (ข.5) ประสิทธิภาพ/ประเมินผลตัวบุคคล

import { redirect } from "next/navigation";
import Link from "next/link";
import { auth } from "@/lib/auth";
import { PageHeader } from "@/components/page-header";
import {
  LayoutDashboard,
  ListChecks,
  AlertTriangle,
  Siren,
  Boxes,
  UserCheck,
  ArrowRight,
} from "lucide-react";

export const dynamic = "force-dynamic";

const DASHBOARDS = [
  {
    id: "missions",
    icon: ListChecks,
    title: "ความก้าวหน้าภารกิจ",
    subtitle: "Mission Progress Dashboard",
    desc: "ติดตามความคืบหน้าของภารกิจสำคัญทั้งหมด · แสดงสถานะ % ความสำเร็จต่อหน่วยงาน",
    href: "/dashboards/missions",
    color: "bg-[#1e3a5f]",
  },
  {
    id: "risk",
    icon: AlertTriangle,
    title: "พื้นที่/ช่วงเวลาความเสี่ยง",
    subtitle: "Risk Hotspot Dashboard",
    desc: "Heatmap แสดงพื้นที่เสี่ยงและช่วงเวลาที่เกิดเหตุบ่อย · AI พยากรณ์",
    href: "/dashboards/risk",
    color: "bg-[#b8860b]",
  },
  {
    id: "incidents",
    icon: Siren,
    title: "เหตุฉุกเฉินและการตอบสนอง",
    subtitle: "Incident Response Dashboard",
    desc: "เหตุการณ์ Real-time จาก 191/CCTV/ข่าวกรอง · ระยะเวลาตอบสนอง",
    href: "/dashboards/incidents",
    color: "bg-rose-700",
  },
  {
    id: "resources",
    icon: Boxes,
    title: "การใช้ทรัพยากร",
    subtitle: "Resource Utilization Dashboard",
    desc: "กำลังพล · งบประมาณ · ครุภัณฑ์ · พื้นที่จอด · ห้องประชุม",
    href: "/dashboards/resources",
    color: "bg-emerald-700",
  },
  {
    id: "performance",
    icon: UserCheck,
    title: "ประสิทธิภาพ/ประเมินผล",
    subtitle: "Performance & Evaluation Dashboard",
    desc: "ผลการปฏิบัติงานบุคคลและทีม · เปรียบเทียบเป้าหมาย",
    href: "/dashboards/performance",
    color: "bg-violet-700",
  },
];

export default async function DashboardsHubPage() {
  const session = await auth();
  if (!session?.user) redirect("/login");

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      <PageHeader
        icon={LayoutDashboard}
        eyebrow="Data & AI · Dashboards"
        title="ศูนย์ Dashboard — 5 ประเภท"
        description="Dashboard เฉพาะทาง 5 ประเภท ตามขอบเขตการใช้งานของผู้บริหาร"
      />

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {DASHBOARDS.map((d, i) => {
          const Icon = d.icon;
          return (
            <Link
              key={d.id}
              href={d.href}
              className="group rounded-sm border border-slate-200 bg-white hover:border-[#1e3a5f]/40 hover:shadow-md transition-all overflow-hidden"
            >
              <div className={`${d.color} px-5 py-3 flex items-center justify-between`}>
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-sm bg-white/15 border border-white/20">
                    <Icon className="h-5 w-5 text-white" />
                  </div>
                  <div>
                    <div className="text-[10px] font-semibold uppercase tracking-wider text-white/70">
                      Type {i + 1} / 5
                    </div>
                    <div className="text-base font-bold text-white">
                      {d.title}
                    </div>
                  </div>
                </div>
                <ArrowRight className="h-5 w-5 text-white opacity-70 group-hover:translate-x-1 transition-transform" />
              </div>
              <div className="px-5 py-4">
                <div className="text-[11px] uppercase tracking-wider text-slate-500 font-semibold mb-2">
                  {d.subtitle}
                </div>
                <p className="text-sm text-slate-600 leading-relaxed">
                  {d.desc}
                </p>
              </div>
            </Link>
          );
        })}
      </div>

      <div className="rounded-sm border border-slate-200 bg-slate-50/50 p-4 text-xs text-slate-600 leading-relaxed">
        <strong className="text-slate-800">หมายเหตุ:</strong>{" "}
        แต่ละ Dashboard ดึงข้อมูลจาก data source ที่เกี่ยวข้องเฉพาะทาง พร้อม drill-down
        ระดับหน่วยงานและช่วงเวลา · รองรับ filter / export / share ผ่าน link
      </div>
    </div>
  );
}
