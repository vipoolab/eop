// Mobile View Demo — Phone mockup showing EOP responsive

import { PageHeader } from "@/components/page-header";
import {
  Smartphone,
  Bell,
  Search,
  Workflow,
  FileText,
  CheckCircle2,
  Sparkles,
  Clock,
} from "lucide-react";

export default function MobileViewPage() {
  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      <PageHeader
        icon={Smartphone}
        eyebrow="Cross-cutting"
        title="Mobile View — ใช้งานบนมือถือ"
        description="แสดงระบบ EOP บนหน้าจอมือถือ — Responsive Web Design + รองรับการติดตั้งแบบ PWA"
      />

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        {/* Left: Phone mockup */}
        <div className="lg:col-span-3 flex justify-center">
          <PhoneMockup />
        </div>

        {/* Right: Features */}
        <div className="lg:col-span-2 space-y-4">
          <div className="rounded-sm border border-slate-200 bg-white p-5">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-500 mb-3">
              ฟีเจอร์บนมือถือ
            </h3>
            <ul className="space-y-2.5">
              {[
                {
                  icon: Bell,
                  text: "Smart Notification — แจ้งเตือนคำสั่งใหม่ + ครบกำหนด",
                },
                {
                  icon: CheckCircle2,
                  text: "Acknowledge รับทราบคำสั่งได้ทันที (Read Receipt)",
                },
                {
                  icon: FileText,
                  text: "ดูรายละเอียดคำสั่ง + แนบหลักฐานจากกล้องมือถือ",
                },
                {
                  icon: Search,
                  text: "ค้นหาเอกสารแบบ Semantic ด้วยภาษาธรรมชาติ",
                },
                {
                  icon: Sparkles,
                  text: "AI ร่างคำสั่งจากมือถือ — พิมพ์ keyword แค่นั้น",
                },
              ].map((f, i) => {
                const Icon = f.icon;
                return (
                  <li
                    key={i}
                    className="flex items-start gap-2.5 text-xs text-slate-700"
                  >
                    <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-sm bg-[#1e3a5f]/5 border border-[#1e3a5f]/15 text-[#1e3a5f]">
                      <Icon className="h-3.5 w-3.5" />
                    </div>
                    <span className="leading-relaxed pt-0.5">{f.text}</span>
                  </li>
                );
              })}
            </ul>
          </div>

          <div className="rounded-sm border border-[#b8860b]/30 bg-[#b8860b]/5 p-4">
            <div className="text-[10px] font-semibold uppercase tracking-wider text-[#b8860b] mb-1">
              รองรับทุกแพลตฟอร์ม
            </div>
            <p className="text-xs text-slate-700 leading-relaxed">
              Web App ทำงานบน iOS · Android · Tablet · Desktop ผ่าน Responsive Web Design
              พร้อม PWA (Progressive Web App) — ผู้ใช้สามารถ <strong>ติดตั้งบนมือถือ</strong>
              ได้เหมือนแอปจริง โดยไม่ต้องผ่าน App Store
            </p>
          </div>

          <div className="rounded-sm border border-slate-200 bg-white p-4">
            <div className="text-[10px] font-semibold uppercase tracking-wider text-slate-500 mb-2">
              Native Mobile App
            </div>
            <p className="text-xs text-slate-700 leading-relaxed mb-3">
              ใน Phase ถัดไป — Native App สำหรับ Android + iOS เพื่อใช้ Push Notification
              + เข้าถึงกล้อง / GPS แบบเต็มประสิทธิภาพ
            </p>
            <div className="flex gap-2">
              <PlatformBadge name="iOS" />
              <PlatformBadge name="Android" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function PlatformBadge({ name }: { name: string }) {
  return (
    <span className="inline-flex items-center px-2.5 py-1 text-[11px] font-semibold rounded-sm bg-slate-900 text-white">
      {name}
    </span>
  );
}

function PhoneMockup() {
  return (
    <div className="relative">
      {/* Phone frame */}
      <div className="w-[300px] h-[600px] rounded-[2.5rem] bg-slate-900 p-3 shadow-2xl">
        {/* Screen */}
        <div className="relative h-full w-full rounded-[2rem] bg-white overflow-hidden">
          {/* Status bar */}
          <div className="h-7 bg-[#1e3a5f] flex items-center justify-between px-4">
            <span className="text-[10px] text-white font-medium">09:24</span>
            <div className="absolute left-1/2 -translate-x-1/2 top-1.5 h-4 w-20 rounded-full bg-black" />
            <div className="flex items-center gap-1">
              <span className="text-[10px] text-white">100%</span>
            </div>
          </div>

          {/* App header */}
          <div className="px-4 py-3 bg-[#1e3a5f] text-white">
            <div className="flex items-center justify-between mb-1">
              <div>
                <div className="text-[9px] uppercase tracking-wider text-[#d4a017] font-semibold">
                  EOP · Royal Thai Police
                </div>
                <div className="text-sm font-semibold">
                  สวัสดี พล.ต.ต. สมชาย
                </div>
              </div>
              <button className="relative h-8 w-8 rounded-full bg-white/10 flex items-center justify-center">
                <Bell className="h-3.5 w-3.5" />
                <span className="absolute top-1 right-1 h-1.5 w-1.5 rounded-full bg-[#d4a017]" />
              </button>
            </div>
          </div>

          {/* Quick stats */}
          <div className="px-3 py-3 grid grid-cols-3 gap-2 border-b border-slate-100">
            {[
              { label: "ต้องอ่าน", value: "3" },
              { label: "ส่งผล", value: "1" },
              { label: "ด่วน", value: "2" },
            ].map((s) => (
              <div
                key={s.label}
                className="text-center rounded-sm border border-slate-200 bg-slate-50 py-2"
              >
                <div className="text-lg font-bold text-[#1e3a5f] tabular-nums">
                  {s.value}
                </div>
                <div className="text-[9px] text-slate-500">{s.label}</div>
              </div>
            ))}
          </div>

          {/* Command cards */}
          <div className="px-3 py-3 space-y-2">
            <div className="text-[10px] font-semibold uppercase tracking-wider text-slate-500 mb-1">
              คำสั่งล่าสุด
            </div>

            {[
              {
                docNo: "๐๐๐๑.๖๙/๐๐๐๒",
                title: "มาตรการรักษาความปลอดภัยช่วงเทศกาลสงกรานต์",
                status: "ด่วน",
                statusColor: "bg-rose-100 text-rose-700 border-rose-200",
                time: "5 นาทีที่แล้ว",
              },
              {
                docNo: "๐๐๐๑.๖๙/๐๐๐๓",
                title: "แต่งตั้งคณะทำงานติดตามผลโครงการ EOP",
                status: "รับทราบ",
                statusColor: "bg-violet-100 text-violet-700 border-violet-200",
                time: "2 ชั่วโมงที่แล้ว",
              },
              {
                docNo: "๐๐๐๑.๖๙/๐๐๐๔",
                title: "ขอเชิญประชุม ITA ประจำปี ๒๕๖๙",
                status: "เผยแพร่",
                statusColor: "bg-cyan-100 text-cyan-700 border-cyan-200",
                time: "เมื่อวาน",
              },
            ].map((c) => (
              <div
                key={c.docNo}
                className="rounded-sm border border-slate-200 bg-white p-2.5"
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="font-mono text-[9px] text-slate-500">
                    {c.docNo}
                  </span>
                  <span
                    className={`text-[8px] px-1 py-0.5 rounded-sm border font-medium ${c.statusColor}`}
                  >
                    {c.status}
                  </span>
                </div>
                <p className="text-[11px] font-medium text-slate-900 leading-tight line-clamp-2">
                  {c.title}
                </p>
                <div className="flex items-center gap-1 mt-1.5 text-[9px] text-slate-400">
                  <Clock className="h-2.5 w-2.5" />
                  {c.time}
                </div>
              </div>
            ))}
          </div>

          {/* Bottom nav */}
          <div className="absolute bottom-0 left-0 right-0 border-t border-slate-200 bg-white px-2 py-2 grid grid-cols-4 gap-1">
            {[
              { icon: Workflow, label: "คำสั่ง", active: true },
              { icon: Sparkles, label: "AI ร่าง" },
              { icon: Search, label: "ค้นหา" },
              { icon: Bell, label: "แจ้งเตือน" },
            ].map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.label}
                  className={`flex flex-col items-center gap-0.5 py-1 ${
                    tab.active ? "text-[#1e3a5f]" : "text-slate-400"
                  }`}
                >
                  <Icon className="h-4 w-4" />
                  <span className="text-[9px] font-medium">{tab.label}</span>
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
