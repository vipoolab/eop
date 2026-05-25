// /intelligence/dashboards — Hub of 5 specialty dashboards

import Link from "next/link";
import {
  LayoutDashboard,
  ChevronLeft,
  Target,
  AlertTriangle,
  Siren,
  Warehouse,
  Trophy,
  ArrowRight,
} from "lucide-react";
import { PageHeader } from "@/components/page-header";

export const dynamic = "force-dynamic";

const DASHBOARDS = [
  {
    href: "/intelligence/dashboards/progress",
    icon: Target,
    title: "แดชบอร์ดความก้าวหน้า",
    description:
      "ติดตาม KPI ของหน่วยทั่วประเทศ — เทียบเป้าหมายกับผลจริง ระดับชั้นการบรรลุของแต่ละบช.",
    accent: "bg-blue-50 text-blue-700 border-blue-200",
  },
  {
    href: "/intelligence/dashboards/risk",
    icon: AlertTriangle,
    title: "แดชบอร์ดพื้นที่เสี่ยง",
    description:
      "Crime Hotspots — แสดงพื้นที่ที่มีคดีหนาแน่น เปรียบเทียบจังหวัด แสดงประเภทคดีหลัก",
    accent: "bg-red-50 text-red-700 border-red-200",
  },
  {
    href: "/intelligence/dashboards/emergency",
    icon: Siren,
    title: "แดชบอร์ดสถานการณ์ฉุกเฉิน",
    description:
      "เหตุฉุกเฉินที่กำลังดำเนินการ — แสดงสถานะ Real-time จาก ๑๙๑/CCTV/Intelligence",
    accent: "bg-orange-50 text-orange-700 border-orange-200",
  },
  {
    href: "/intelligence/dashboards/resources",
    icon: Warehouse,
    title: "แดชบอร์ดทรัพยากร",
    description:
      "กำลังพลตำรวจ ยานพาหนะ อุปกรณ์ พร้อมสถานะการใช้งานในแต่ละหน่วยทั่วประเทศ",
    accent: "bg-emerald-50 text-emerald-700 border-emerald-200",
  },
  {
    href: "/intelligence/dashboards/performance",
    icon: Trophy,
    title: "แดชบอร์ดผลการดำเนินงาน",
    description:
      "เปรียบเทียบผลงานระหว่างหน่วย — ระยะเวลาตอบสนอง อัตราการเคลียร์คดี ความพึงพอใจ",
    accent: "bg-amber-50 text-amber-700 border-amber-200",
  },
];

export default function DashboardsHubPage() {
  return (
    <div className="space-y-6">
      <PageHeader
        icon={LayoutDashboard}
        eyebrow="ระบบ AI"
        title="แดชบอร์ดเฉพาะทาง ๕ ประเภท"
        description="แดชบอร์ดข้อมูลแบบ Real-time สำหรับการตัดสินใจของผู้บริหารระดับต่าง ๆ"
        actions={
          <Link
            href="/intelligence"
            className="inline-flex items-center gap-1.5 rounded-sm border border-slate-200 hover:border-slate-300 text-sm font-medium px-3 py-2 transition-colors text-slate-700"
          >
            <ChevronLeft className="h-4 w-4" />
            กลับ
          </Link>
        }
      />

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
        {DASHBOARDS.map((d) => {
          const Icon = d.icon;
          return (
            <Link
              key={d.href}
              href={d.href}
              className="group rounded-sm border border-slate-200 bg-white p-4 hover:border-[#1e3a5f] hover:shadow-sm transition-all"
            >
              <div className="flex items-start gap-3">
                <div
                  className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-sm border ${d.accent}`}
                >
                  <Icon className="h-5 w-5" />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="text-sm font-semibold text-slate-900 group-hover:text-[#1e3a5f]">
                    {d.title}
                  </div>
                  <div className="text-xs leading-relaxed text-slate-600 mt-1.5">
                    {d.description}
                  </div>
                </div>
              </div>
              <div className="mt-3 pt-2.5 border-t border-slate-100 flex items-center justify-end gap-1 text-[11px] text-[#1e3a5f] font-medium">
                เปิดแดชบอร์ด
                <ArrowRight className="h-3 w-3" />
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
