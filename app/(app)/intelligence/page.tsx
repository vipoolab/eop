// /intelligence — Hub page for System 6
// Shows 7 feature cards + stats row + API integration display

import Link from "next/link";
import {
  Brain,
  ScanLine,
  Tags,
  TrendingUp,
  FileBarChart,
  Search,
  LayoutDashboard,
  Map,
  FileText,
  AlertTriangle,
  Activity,
  Sparkles,
  Radio,
  Video,
  Antenna,
} from "lucide-react";
import { PageHeader } from "@/components/page-header";
import { getIntelStats } from "@/lib/intelligence/store";

export const dynamic = "force-dynamic";

const FEATURE_CARDS = [
  {
    href: "/intelligence/ocr",
    icon: ScanLine,
    title: "OCR ภาษาไทย",
    description:
      "ดึงข้อความจากไฟล์รูปภาพ/PDF ภาษาไทย ความแม่นยำ > 96% พร้อมตรวจหารายงานตำรวจอัตโนมัติ",
    accent: "bg-blue-50 text-blue-700 border-blue-200",
  },
  {
    href: "/intelligence/classify",
    icon: Tags,
    title: "จำแนกประเภทเอกสาร",
    description: "AI Classify เอกสารเข้า ๖ หมวด (ยศ./ผบ./มค./มข./วจ./อจ.) พร้อมระบุคีย์เวิร์ดที่ใช้",
    accent: "bg-amber-50 text-amber-700 border-amber-200",
  },
  {
    href: "/intelligence/predict",
    icon: TrendingUp,
    title: "พยากรณ์แนวโน้ม",
    description:
      "Predictive Analytics — ทำนายแนวโน้มอาชญากรรม ๓ เดือนข้างหน้า พร้อม Driver Factors และคำแนะนำ",
    accent: "bg-emerald-50 text-emerald-700 border-emerald-200",
  },
  {
    href: "/intelligence/summary",
    icon: FileBarChart,
    title: "สรุปผู้บริหาร (AI)",
    description: "AI Executive Summary — สรุปข้อมูลภาพรวมเป็นการ์ดเล่าเรื่องระดับผู้บริหาร พร้อม Recommendations",
    accent: "bg-purple-50 text-purple-700 border-purple-200",
  },
  {
    href: "/intelligence/search",
    icon: Search,
    title: "ค้นหาอัจฉริยะ",
    description: "ค้นหา ๔ โหมด: ทั่วไป / ขั้นสูง / เต็มข้อความ / เชิงความหมาย (Semantic + ขยายคำพ้อง)",
    accent: "bg-red-50 text-red-700 border-red-200",
  },
  {
    href: "/intelligence/dashboards",
    icon: LayoutDashboard,
    title: "แดชบอร์ดเฉพาะทาง",
    description: "๕ ประเภท: ความก้าวหน้า / พื้นที่เสี่ยง / สถานการณ์ฉุกเฉิน / ทรัพยากร / ผลการดำเนินงาน",
    accent: "bg-teal-50 text-teal-700 border-teal-200",
  },
  {
    href: "/intelligence/heatmap",
    icon: Map,
    title: "Heatmap พื้นที่เสี่ยง",
    description: "แผนที่จุดเสี่ยงทั่วประเทศ — แสดงเหตุการณ์ตามจังหวัด ตามประเภทคดี และระดับความรุนแรง",
    accent: "bg-orange-50 text-orange-700 border-orange-200",
  },
];

const API_INTEGRATIONS = [
  {
    name: "API ๑๙๑ (เหตุฉุกเฉิน)",
    icon: Radio,
    status: "เชื่อมต่อ (Demo)",
    lastSync: "เมื่อ ๒ นาทีที่แล้ว",
    todayCalls: 28432,
    color: "text-red-700 bg-red-50 border-red-200",
  },
  {
    name: "CCTV กลาง (กทม.)",
    icon: Video,
    status: "เชื่อมต่อ (Demo)",
    lastSync: "Real-time stream",
    todayCalls: 8650,
    color: "text-blue-700 bg-blue-50 border-blue-200",
  },
  {
    name: "ระบบข่าวกรอง (INTEL)",
    icon: Antenna,
    status: "เชื่อมต่อ (Demo)",
    lastSync: "เมื่อ ๑๒ นาทีที่แล้ว",
    todayCalls: 142,
    color: "text-purple-700 bg-purple-50 border-purple-200",
  },
];

export default function IntelligenceHubPage() {
  const stats = getIntelStats();

  return (
    <div className="space-y-6">
      <PageHeader
        icon={Brain}
        eyebrow="ระบบที่ ๖"
        title="ระบบบริหารจัดการข้อมูลและปัญญาประดิษฐ์"
        description="Data & AI Management — แกนกลางข้อมูลและปัญญาประดิษฐ์ของระบบ EOP สำหรับ OCR ภาษาไทย จำแนกเอกสาร พยากรณ์ Executive Summary และค้นหาอัจฉริยะ"
        live
      />

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <StatCard
          icon={FileText}
          label="เอกสารในระบบ"
          value={stats.totalDocuments.toLocaleString("th-TH")}
          accent="navy"
        />
        <StatCard
          icon={AlertTriangle}
          label="เหตุการณ์ ๓๐ วัน"
          value={stats.incidentsLast30.toLocaleString("th-TH")}
          accent="red"
        />
        <StatCard
          icon={TrendingUp}
          label="แนวโน้มที่ทำนาย"
          value={stats.totalTrends.toLocaleString("th-TH")}
          accent="emerald"
        />
        <StatCard
          icon={Activity}
          label="รายงานผู้บริหาร"
          value={stats.totalSummaries.toLocaleString("th-TH")}
          accent="amber"
        />
      </div>

      {/* Feature cards */}
      <section>
        <SectionTitle
          title="ความสามารถของระบบ"
          description="คลิกเลือกเครื่องมือเพื่อทดลองใช้งาน — ทุกฟีเจอร์เป็น Demo Mode (ข้อมูลจำลอง)"
        />
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {FEATURE_CARDS.map((card) => {
            const Icon = card.icon;
            return (
              <Link
                key={card.href}
                href={card.href}
                className="group rounded-sm border border-slate-200 bg-white p-4 hover:border-[#1e3a5f] hover:shadow-sm transition-all"
              >
                <div className="flex items-start gap-3">
                  <div
                    className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-sm border ${card.accent}`}
                  >
                    <Icon className="h-5 w-5" />
                  </div>
                  <div className="min-w-0">
                    <div className="text-sm font-semibold text-slate-900 group-hover:text-[#1e3a5f] mb-1.5">
                      {card.title}
                    </div>
                    <div className="text-xs leading-relaxed text-slate-600">
                      {card.description}
                    </div>
                  </div>
                </div>
                <div className="mt-3 flex items-center justify-between border-t border-slate-100 pt-2.5">
                  <span className="text-[10px] font-semibold uppercase tracking-wider text-[#b8860b]">
                    Demo Available
                  </span>
                  <Sparkles className="h-3.5 w-3.5 text-[#d4a017]" />
                </div>
              </Link>
            );
          })}
        </div>
      </section>

      {/* API Integrations */}
      <section>
        <SectionTitle
          title="API เชื่อมต่อจากระบบภายนอก"
          description="แสดงสถานะการเชื่อมต่อข้อมูลจาก ๑๙๑ / CCTV / ระบบข่าวกรอง (จำลองทั้งหมดในโหมด Demo)"
        />
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          {API_INTEGRATIONS.map((api) => {
            const Icon = api.icon;
            return (
              <div
                key={api.name}
                className="rounded-sm border border-slate-200 bg-white p-4"
              >
                <div className="flex items-start justify-between gap-2 mb-2">
                  <div
                    className={`flex h-9 w-9 items-center justify-center rounded-sm border ${api.color}`}
                  >
                    <Icon className="h-4 w-4" />
                  </div>
                  <span className="text-[10px] font-semibold uppercase tracking-wider text-emerald-700 bg-emerald-50 border border-emerald-200 px-1.5 py-0.5 rounded-sm">
                    ● Online
                  </span>
                </div>
                <div className="text-sm font-semibold text-slate-900">
                  {api.name}
                </div>
                <div className="text-xs text-slate-500 mt-1">
                  อัปเดตล่าสุด: {api.lastSync}
                </div>
                <div className="mt-2.5 pt-2.5 border-t border-slate-100">
                  <div className="text-[10px] font-semibold uppercase tracking-wider text-slate-500">
                    ข้อความวันนี้
                  </div>
                  <div className="text-lg font-bold text-slate-900 tabular-nums">
                    {api.todayCalls.toLocaleString("th-TH")}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
        <div className="mt-2 text-[11px] text-slate-500 italic">
          * ข้อมูล mock จาก API ๑๙๑ / CCTV / Intelligence (Demo) — ไม่ใช่การเชื่อมต่อจริง
        </div>
      </section>
    </div>
  );
}

interface StatCardProps {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: string;
  accent: "navy" | "red" | "emerald" | "amber";
}
function StatCard({ icon: Icon, label, value, accent }: StatCardProps) {
  const colors: Record<StatCardProps["accent"], string> = {
    navy: "bg-[#1e3a5f] text-white",
    red: "bg-red-600 text-white",
    emerald: "bg-emerald-600 text-white",
    amber: "bg-amber-600 text-white",
  };
  return (
    <div className="rounded-sm border border-slate-200 bg-white p-4 flex items-center gap-3">
      <div className={`h-10 w-10 rounded-sm flex items-center justify-center ${colors[accent]}`}>
        <Icon className="h-4 w-4" />
      </div>
      <div className="min-w-0">
        <div className="text-[10px] font-semibold uppercase tracking-wider text-slate-500">
          {label}
        </div>
        <div className="text-2xl font-bold text-slate-900 leading-none mt-1 tabular-nums">
          {value}
        </div>
      </div>
    </div>
  );
}

interface SectionTitleProps {
  title: string;
  description?: string;
}
function SectionTitle({ title, description }: SectionTitleProps) {
  return (
    <div className="mb-3">
      <h2 className="text-sm font-semibold text-slate-900">{title}</h2>
      {description && (
        <p className="text-xs text-slate-500 mt-0.5">{description}</p>
      )}
    </div>
  );
}
