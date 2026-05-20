// Incident Management — integration with 191 / CCTV / intel

import { PageHeader } from "@/components/page-header";
import {
  AlertOctagon,
  Phone,
  Video,
  Eye,
  MapPin,
  Clock,
  Activity,
} from "lucide-react";

const INCIDENTS = [
  {
    code: "INC-2569-0421",
    type: "ประท้วง",
    title: "การชุมนุมหน้าทำเนียบรัฐบาล",
    location: "ดุสิต · กทม.",
    severity: 8,
    source: "191",
    status: "investigating",
    time: "10 นาทีที่แล้ว",
    units: 5,
  },
  {
    code: "INC-2569-0420",
    type: "อาชญากรรม",
    title: "เหตุปล้นทรัพย์ ร้านทอง",
    location: "บางรัก · กทม.",
    severity: 9,
    source: "191",
    status: "investigating",
    time: "32 นาทีที่แล้ว",
    units: 8,
  },
  {
    code: "INC-2569-0419",
    type: "อุบัติเหตุ",
    title: "อุบัติเหตุรถบรรทุก ทางหลวง ๓๔",
    location: "บางพลี · สมุทรปราการ",
    severity: 6,
    source: "CCTV",
    status: "investigating",
    time: "1 ชั่วโมงที่แล้ว",
    units: 3,
  },
  {
    code: "INC-2569-0418",
    type: "ข่าวกรอง",
    title: "พบกลุ่มผู้ค้ายาเสพติด พื้นที่ภาคใต้",
    location: "หาดใหญ่ · สงขลา",
    severity: 7,
    source: "intel",
    status: "investigating",
    time: "2 ชั่วโมงที่แล้ว",
    units: 12,
  },
  {
    code: "INC-2569-0417",
    type: "อาชญากรรม",
    title: "ลักทรัพย์ในเคหะสถาน",
    location: "ห้วยขวาง · กทม.",
    severity: 4,
    source: "manual",
    status: "closed",
    time: "เมื่อวาน · ปิดคดี",
    units: 2,
  },
];

const TYPE_COLOR: Record<string, string> = {
  ประท้วง: "bg-amber-50 text-amber-700 border-amber-200",
  อาชญากรรม: "bg-rose-50 text-rose-700 border-rose-200",
  อุบัติเหตุ: "bg-blue-50 text-blue-700 border-blue-200",
  ข่าวกรอง: "bg-violet-50 text-violet-700 border-violet-200",
};

const SOURCE_META: Record<
  string,
  { icon: typeof Phone; label: string }
> = {
  "191": { icon: Phone, label: "ศูนย์ 191" },
  CCTV: { icon: Video, label: "CCTV" },
  intel: { icon: Eye, label: "ข่าวกรอง" },
  manual: { icon: Activity, label: "แจ้งด้วยมือ" },
};

function getSeverityColor(severity: number): string {
  if (severity >= 8) return "bg-rose-500";
  if (severity >= 6) return "bg-amber-500";
  if (severity >= 4) return "bg-blue-500";
  return "bg-slate-400";
}

export default function IncidentPage() {
  const open = INCIDENTS.filter((i) => i.status !== "closed").length;
  const critical = INCIDENTS.filter((i) => i.severity >= 8).length;

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      <PageHeader
        icon={AlertOctagon}
        eyebrow="Command & Operation"
        title="ระบบจัดการเหตุการณ์"
        description="รวมศูนย์เหตุการณ์จากแหล่งต่างๆ — ศูนย์ 191 · กล้องวงจรปิด · ระบบข่าวกรอง · พร้อม Heatmap เชิงพื้นที่"
      />

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <StatCard label="กำลังดำเนินการ" value={open} accent="rose" />
        <StatCard label="ระดับวิกฤต" value={critical} accent="rose" />
        <StatCard label="ทั้งหมดวันนี้" value={INCIDENTS.length} />
        <StatCard
          label="จากกล้อง CCTV"
          value={INCIDENTS.filter((i) => i.source === "CCTV").length}
        />
      </div>

      {/* Source integrations */}
      <div className="rounded-sm border border-slate-200 bg-white p-5">
        <h3 className="text-[11px] font-semibold uppercase tracking-wider text-slate-500 mb-3">
          แหล่งข้อมูลที่เชื่อมต่อ
        </h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
          {Object.entries(SOURCE_META).map(([key, meta]) => {
            const Icon = meta.icon;
            const count = INCIDENTS.filter((i) => i.source === key).length;
            return (
              <div
                key={key}
                className="flex items-center gap-3 p-3 rounded-sm border border-slate-200 bg-slate-50"
              >
                <div className="flex h-9 w-9 items-center justify-center rounded-sm bg-white border border-slate-200 text-[#1e3a5f]">
                  <Icon className="h-4 w-4" />
                </div>
                <div>
                  <div className="text-xs font-medium text-slate-900">
                    {meta.label}
                  </div>
                  <div className="text-[10px] text-slate-500 tabular-nums">
                    {count} เหตุการณ์
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Incident list */}
      <div className="rounded-sm border border-slate-200 bg-white overflow-hidden">
        <div className="px-5 py-3 border-b border-slate-100">
          <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-500">
            เหตุการณ์ล่าสุด
          </h3>
        </div>
        <div className="divide-y divide-slate-100">
          {INCIDENTS.map((inc) => {
            const sourceMeta = SOURCE_META[inc.source];
            const SourceIcon = sourceMeta?.icon ?? Activity;
            return (
              <div
                key={inc.code}
                className="px-5 py-4 hover:bg-slate-50 transition-colors"
              >
                <div className="flex items-start gap-3">
                  <div className="flex flex-col items-center gap-1 pt-1">
                    <div
                      className={`h-2 w-2 rounded-full ${getSeverityColor(inc.severity)}`}
                    />
                    <div className="text-[10px] font-mono text-slate-400">
                      {inc.severity}/10
                    </div>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1 flex-wrap">
                      <span className="font-mono text-[11px] text-slate-500">
                        {inc.code}
                      </span>
                      <span
                        className={`inline-flex items-center px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wider rounded-sm border ${TYPE_COLOR[inc.type]}`}
                      >
                        {inc.type}
                      </span>
                      {inc.status === "closed" && (
                        <span className="inline-flex items-center px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wider rounded-sm bg-slate-100 text-slate-600 border border-slate-300">
                          ปิดคดี
                        </span>
                      )}
                    </div>
                    <h4 className="text-sm font-semibold text-slate-900 mb-1">
                      {inc.title}
                    </h4>
                    <div className="flex items-center gap-3 text-[11px] text-slate-500 flex-wrap">
                      <span className="inline-flex items-center gap-1">
                        <MapPin className="h-3 w-3" />
                        {inc.location}
                      </span>
                      <span className="inline-flex items-center gap-1">
                        <SourceIcon className="h-3 w-3" />
                        {sourceMeta?.label}
                      </span>
                      <span className="inline-flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        {inc.time}
                      </span>
                      <span>·</span>
                      <span>{inc.units} หน่วยปฏิบัติ</span>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
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
  accent?: "rose";
}) {
  return (
    <div className="rounded-sm border border-slate-200 bg-white p-4">
      <div className="text-[10px] font-semibold uppercase tracking-wider text-slate-500 mb-1">
        {label}
      </div>
      <div
        className={`text-2xl font-semibold tabular-nums ${accent === "rose" ? "text-rose-700" : "text-slate-900"}`}
      >
        {value}
      </div>
    </div>
  );
}
