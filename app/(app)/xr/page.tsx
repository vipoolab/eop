// XR Command Center — Virtual Reality demo concept

import { PageHeader } from "@/components/page-header";
import {
  Glasses,
  Monitor,
  Map,
  TrendingUp,
  Camera,
  Layers,
  Maximize2,
  Sparkles,
} from "lucide-react";

const FEATURES = [
  {
    icon: Monitor,
    title: "Virtual Screens 60-62 จอ",
    desc: "แสดงหน้าจอเสมือนจริงได้พร้อมกัน 60-62 จอ ใน 360° รอบตัว",
  },
  {
    icon: Map,
    title: "GIS Heatmap 3D",
    desc: "แผนที่เหตุการณ์ในรูปแบบ 3 มิติ ที่ปฏิบัติงานเห็นแบบ Bird's eye",
  },
  {
    icon: TrendingUp,
    title: "KPI Dashboard Live",
    desc: "ตัวชี้วัดสำคัญ Real-time จาก 6 หน่วยงาน บูรณาการในมุมเดียว",
  },
  {
    icon: Camera,
    title: "Multi-view CCTV",
    desc: "ดูกล้องวงจรปิดจากหลายจุดในเวลาเดียวกัน ขยายจุดที่สนใจ",
  },
  {
    icon: Layers,
    title: "Multi-window Operations",
    desc: "เปิดหน้าต่างหลายแอปพร้อมกัน — Command + Search + AI Draft + Audit",
  },
  {
    icon: Maximize2,
    title: "Infinite Canvas",
    desc: "พื้นที่ทำงานไม่จำกัด ไม่มีข้อจำกัดของจอแสดงผลทางกายภาพ",
  },
];

const SCENE_PANELS = [
  { label: "GIS Heatmap", color: "bg-emerald-700" },
  { label: "KPI Live", color: "bg-[#1e3a5f]" },
  { label: "Command Queue", color: "bg-[#b8860b]" },
  { label: "Incidents", color: "bg-rose-700" },
  { label: "AI Analyst", color: "bg-violet-700" },
  { label: "CCTV Feed", color: "bg-slate-700" },
];

export default function XrPage() {
  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      <PageHeader
        icon={Glasses}
        eyebrow="XR Command Center"
        title="ศูนย์ปฏิบัติการเสมือนจริง"
        description="Extended Reality (XR) Command Center — บูรณาการการแสดงผลข้อมูลในมุมมอง 360° ผ่าน XR Headset"
      />

      {/* Hero scene mockup */}
      <div className="relative rounded-sm border border-slate-200 bg-gradient-to-br from-slate-900 via-[#1e3a5f] to-slate-900 overflow-hidden p-6 h-[400px]">
        {/* Grid pattern */}
        <div
          className="absolute inset-0 opacity-10"
          style={{
            backgroundImage:
              "linear-gradient(white 1px, transparent 1px), linear-gradient(90deg, white 1px, transparent 1px)",
            backgroundSize: "40px 40px",
            backgroundPosition: "center",
            transform: "perspective(800px) rotateX(40deg) scale(1.5) translateY(20px)",
          }}
        />

        {/* Floating panels */}
        <div className="relative h-full flex flex-col">
          <div className="flex-1 grid grid-cols-3 gap-3 mb-3">
            {SCENE_PANELS.map((panel, i) => (
              <div
                key={panel.label}
                className={`rounded-sm border border-white/15 ${panel.color}/40 backdrop-blur-sm p-3 flex flex-col`}
                style={{
                  opacity: 0.85,
                  transform: `translateY(${i % 2 === 0 ? "0" : "10px"})`,
                }}
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[10px] font-semibold uppercase tracking-wider text-white/90">
                    {panel.label}
                  </span>
                  <div className="h-1.5 w-1.5 rounded-full bg-[#d4a017] animate-pulse" />
                </div>
                <div className="flex-1 flex items-center justify-center">
                  <div className="text-2xl font-bold text-white/80 tabular-nums">
                    {Math.floor(Math.random() * 900 + 100)}
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className="text-center">
            <div className="inline-flex items-center gap-2 rounded-sm border border-[#d4a017]/30 bg-[#d4a017]/10 px-3 py-1.5 text-xs text-[#d4a017]">
              <Glasses className="h-3.5 w-3.5" />
              <span className="font-semibold uppercase tracking-wider">
                XR Headset View · 360° Immersive
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Hardware specs */}
      <div className="rounded-sm border border-slate-200 bg-white p-5">
        <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-500 mb-3">
          อุปกรณ์ที่ใช้
        </h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <SpecCard label="XR Headset" value="5 เครื่อง" />
          <SpecCard label="Resolution" value="≥ 1440×936 / ตา" />
          <SpecCard label="Tracking" value="6 DoF" />
          <SpecCard label="Refresh Rate" value="≥ 90 Hz" />
        </div>
      </div>

      {/* Features grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {FEATURES.map((f) => {
          const Icon = f.icon;
          return (
            <div
              key={f.title}
              className="rounded-sm border border-slate-200 bg-white p-5 flex items-start gap-3"
            >
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-sm bg-[#1e3a5f] text-white border border-[#142a45]">
                <Icon className="h-4 w-4" />
              </div>
              <div>
                <h4 className="text-sm font-semibold text-slate-900 mb-1">
                  {f.title}
                </h4>
                <p className="text-xs text-slate-600 leading-relaxed">
                  {f.desc}
                </p>
              </div>
            </div>
          );
        })}
      </div>

      {/* Use case */}
      <div className="rounded-sm border border-[#b8860b]/30 bg-[#b8860b]/5 p-5">
        <div className="flex items-start gap-3">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-sm bg-[#b8860b] text-white">
            <Sparkles className="h-4 w-4" />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-slate-900 mb-1">
              กรณีการใช้งานในศูนย์บัญชาการ
            </h3>
            <p className="text-xs text-slate-700 leading-relaxed">
              ผู้บังคับบัญชาสามารถมองเห็น KPI ของหน่วยงานทั้งหมด · เหตุการณ์เชิงพื้นที่
              · กล้องวงจรปิด · และคำสั่งที่กำลังดำเนินการ — พร้อมกันใน
              <strong> มุมมอง 360° </strong>
              เพื่อตัดสินใจสั่งการได้รวดเร็วและถูกต้อง
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

function SpecCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-sm border border-slate-200 bg-slate-50 p-3">
      <div className="text-[10px] font-semibold uppercase tracking-wider text-slate-500 mb-1">
        {label}
      </div>
      <div className="text-sm font-semibold text-slate-900">{value}</div>
    </div>
  );
}
