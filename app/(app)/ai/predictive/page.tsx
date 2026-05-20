// Predictive Analytics — forecasting mockup

import { PageHeader } from "@/components/page-header";
import {
  Sparkles,
  TrendingUp,
  AlertTriangle,
  Brain,
  Activity,
  Target,
} from "lucide-react";

const HOTSPOTS = [
  { area: "กทม. · บางรัก", probability: 87, change: "+12%", crime: "ลักทรัพย์" },
  { area: "ชลบุรี · พัทยา", probability: 82, change: "+8%", crime: "ทำร้ายร่างกาย" },
  { area: "สงขลา · หาดใหญ่", probability: 74, change: "+5%", crime: "ยาเสพติด" },
  { area: "กทม. · ห้วยขวาง", probability: 68, change: "−3%", crime: "ลักทรัพย์" },
  { area: "เชียงใหม่ · เมือง", probability: 61, change: "−2%", crime: "อุบัติเหตุ" },
];

const TIME_WINDOWS = [
  { hour: "00-06", level: "low", value: 12 },
  { hour: "06-12", level: "mid", value: 38 },
  { hour: "12-18", level: "mid", value: 45 },
  { hour: "18-24", level: "high", value: 78 },
];

const ANOMALIES = [
  {
    type: "Spike",
    msg: "จำนวนการชุมนุมในเขต กทม. เพิ่มผิดปกติ +43% เทียบสัปดาห์ที่แล้ว",
    severity: "high",
  },
  {
    type: "Pattern",
    msg: "ตรวจพบรูปแบบคดียาเสพติดใหม่ในพื้นที่ภาคใต้ ระวัง 3 จังหวัด",
    severity: "high",
  },
  {
    type: "Drop",
    msg: "การรับทราบคำสั่งของหน่วยลดลง 15% — ตรวจสอบช่องทางสื่อสาร",
    severity: "mid",
  },
];

export default function PredictivePage() {
  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      <PageHeader
        icon={Sparkles}
        eyebrow="Data & AI"
        title="พยากรณ์และวิเคราะห์เชิงทำนาย"
        description="AI พยากรณ์พื้นที่/เวลาเสี่ยง · ตรวจจับความผิดปกติ · สรุปผู้บริหารอัตโนมัติ"
        live
      />

      {/* Executive Summary by AI */}
      <div className="rounded-sm border border-[#b8860b]/30 bg-gradient-to-br from-[#b8860b]/5 to-[#1e3a5f]/5 p-5">
        <div className="flex items-start gap-3 mb-3">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-sm bg-[#1e3a5f] text-white border border-[#142a45]">
            <Brain className="h-4 w-4" />
          </div>
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-1">
              <h3 className="text-sm font-semibold text-slate-900">
                สรุปสำหรับผู้บริหาร (Executive Summary)
              </h3>
              <span className="text-[10px] font-semibold uppercase tracking-wider rounded-sm bg-[#b8860b]/15 text-[#92400e] border border-[#b8860b]/30 px-1.5 py-0.5">
                AI Generated
              </span>
            </div>
            <p className="text-sm text-slate-800 leading-relaxed">
              ในช่วง <strong>3 วันข้างหน้า</strong> AI พยากรณ์ว่าจะมีเหตุอาชญากรรมเพิ่มขึ้น
              ใน <strong>เขตเศรษฐกิจ กทม.</strong> โดยเฉพาะคดี
              <strong> ลักทรัพย์ในช่วงเย็น (18-24 น.)</strong> แนะนำให้เพิ่มกำลังตรวจตรา
              ในพื้นที่บางรักและห้วยขวาง · พื้นที่ภาคใต้ควรเฝ้าระวังคดียาเสพติดรูปแบบใหม่
            </p>
          </div>
        </div>
      </div>

      {/* Risk Hotspots */}
      <div className="rounded-sm border border-slate-200 bg-white p-5">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-500">
            พื้นที่เสี่ยง — Top 5
          </h3>
          <span className="text-[11px] text-slate-500">
            พยากรณ์ 7 วันข้างหน้า
          </span>
        </div>
        <div className="space-y-2">
          {HOTSPOTS.map((h, i) => (
            <div
              key={i}
              className="flex items-center gap-3 rounded-sm border border-slate-100 bg-slate-50/50 px-3 py-2.5"
            >
              <div className="font-mono text-xs text-slate-400 w-6">
                #{i + 1}
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-sm font-medium text-slate-900">
                  {h.area}
                </div>
                <div className="text-[11px] text-slate-500">
                  ประเภท: {h.crime}
                </div>
              </div>
              <div className="text-right shrink-0">
                <div className="font-mono text-base font-semibold text-[#1e3a5f] tabular-nums">
                  {h.probability}%
                </div>
                <div
                  className={`text-[10px] font-semibold ${
                    h.change.startsWith("+")
                      ? "text-rose-600"
                      : "text-emerald-600"
                  }`}
                >
                  {h.change}
                </div>
              </div>
              <div className="w-24 h-1.5 rounded-sm bg-slate-200 overflow-hidden shrink-0">
                <div
                  className={`h-full rounded-sm ${
                    h.probability >= 80
                      ? "bg-rose-500"
                      : h.probability >= 60
                        ? "bg-amber-500"
                        : "bg-slate-400"
                  }`}
                  style={{ width: `${h.probability}%` }}
                />
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* Time risk windows */}
        <div className="rounded-sm border border-slate-200 bg-white p-5">
          <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-500 mb-3">
            ช่วงเวลาเสี่ยง (วันนี้)
          </h3>
          <div className="space-y-2">
            {TIME_WINDOWS.map((t) => {
              const color =
                t.level === "high"
                  ? "bg-rose-500"
                  : t.level === "mid"
                    ? "bg-amber-500"
                    : "bg-emerald-500";
              return (
                <div key={t.hour} className="flex items-center gap-3">
                  <div className="w-12 font-mono text-xs text-slate-500">
                    {t.hour}
                  </div>
                  <div className="flex-1 h-6 rounded-sm bg-slate-100 overflow-hidden relative">
                    <div
                      className={`h-full ${color} rounded-sm`}
                      style={{ width: `${t.value}%` }}
                    />
                    <span className="absolute inset-0 flex items-center px-2 text-[10px] font-semibold text-white">
                      {t.value}%
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Anomaly detection */}
        <div className="rounded-sm border border-slate-200 bg-white p-5">
          <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-500 mb-3">
            ความผิดปกติที่ตรวจพบ
          </h3>
          <div className="space-y-2">
            {ANOMALIES.map((a, i) => (
              <div
                key={i}
                className={`flex items-start gap-2 rounded-sm border p-3 ${
                  a.severity === "high"
                    ? "border-rose-200 bg-rose-50"
                    : "border-amber-200 bg-amber-50"
                }`}
              >
                <AlertTriangle
                  className={`h-4 w-4 mt-0.5 shrink-0 ${
                    a.severity === "high" ? "text-rose-600" : "text-amber-600"
                  }`}
                />
                <div>
                  <div
                    className={`text-[10px] font-semibold uppercase tracking-wider mb-0.5 ${
                      a.severity === "high"
                        ? "text-rose-700"
                        : "text-amber-700"
                    }`}
                  >
                    {a.type}
                  </div>
                  <p className="text-xs text-slate-800 leading-relaxed">
                    {a.msg}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Capabilities */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        {[
          {
            icon: TrendingUp,
            title: "Forecast",
            desc: "พยากรณ์เหตุการณ์ 7-30 วัน",
          },
          { icon: Activity, title: "Anomaly", desc: "ตรวจจับความผิดปกติแบบ Real-time" },
          { icon: Target, title: "Recommend", desc: "แนะนำมาตรการป้องกัน" },
        ].map((c) => {
          const Icon = c.icon;
          return (
            <div
              key={c.title}
              className="rounded-sm border border-slate-200 bg-white p-4 flex items-start gap-3"
            >
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-sm bg-[#1e3a5f]/5 text-[#1e3a5f] border border-[#1e3a5f]/15">
                <Icon className="h-4 w-4" />
              </div>
              <div>
                <div className="text-sm font-semibold text-slate-900">
                  {c.title}
                </div>
                <div className="text-[11px] text-slate-600 mt-0.5">{c.desc}</div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
