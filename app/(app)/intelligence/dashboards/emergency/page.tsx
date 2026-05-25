// /intelligence/dashboards/emergency — Emergency dashboard

import Link from "next/link";
import {
  Siren,
  ChevronLeft,
  Radio,
  Video,
  Antenna,
  MapPin,
  Clock,
} from "lucide-react";
import { PageHeader } from "@/components/page-header";
import { listIncidents } from "@/lib/intelligence/store";
import {
  SEVERITY_STYLES,
  SEVERITY_LABELS,
  INCIDENT_STATUS_LABELS,
  type IncidentSeverity,
} from "@/lib/intelligence/types";
import { listCommands } from "@/lib/commands/store";

export const dynamic = "force-dynamic";

export default function EmergencyDashboardPage() {
  const incidents = listIncidents({ daysWithin: 7 });
  const critical = incidents.filter(
    (i) => i.severity === "CRITICAL" || i.severity === "HIGH"
  );
  const openCases = critical.filter((i) => i.status !== "CLOSED");

  // Get recent emergency commands (priority = EMERGENCY)
  const allCommands = listCommands();
  const emergencyCommands = allCommands.filter((c) => c.priority === "EMERGENCY").slice(0, 4);

  // Mock 191 channels feed
  const channels = [
    { name: "ช่อง ๑๙๑ (รับแจ้งเหตุ)", icon: Radio, calls: 482, urgent: 28, color: "text-red-700 bg-red-50 border-red-200" },
    { name: "CCTV กลาง (กทม.)", icon: Video, calls: 1240, urgent: 12, color: "text-blue-700 bg-blue-50 border-blue-200" },
    { name: "ระบบข่าวกรอง", icon: Antenna, calls: 38, urgent: 6, color: "text-purple-700 bg-purple-50 border-purple-200" },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        icon={Siren}
        eyebrow="แดชบอร์ดเฉพาะทาง"
        title="แดชบอร์ดสถานการณ์ฉุกเฉิน (Emergency Operations)"
        description="ภาพรวมเหตุฉุกเฉินที่กำลังดำเนินการในรอบ ๗ วัน — ระดับวิกฤตและสูง พร้อมข้อมูลจาก ๑๙๑/CCTV/Intelligence"
        live
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

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <StatBox label="เหตุฉุกเฉิน ๗ วัน" value={critical.length} accent="red" pulse />
        <StatBox label="ยังดำเนินการ" value={openCases.length} accent="amber" />
        <StatBox label="ปิดเคสได้" value={critical.length - openCases.length} accent="emerald" />
        <StatBox label="คำสั่งฉุกเฉินที่ออก" value={emergencyCommands.length} accent="navy" />
      </div>

      {/* External channels */}
      <section className="bg-white border border-slate-200 rounded-sm overflow-hidden">
        <div className="border-b border-slate-100 px-5 py-3 flex items-center gap-2">
          <div className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
          <h2 className="text-sm font-semibold text-slate-900">
            ช่องทางรับข้อมูลภายนอก (Real-time Mock)
          </h2>
        </div>
        <div className="p-5 grid grid-cols-1 md:grid-cols-3 gap-3">
          {channels.map((ch) => {
            const Icon = ch.icon;
            return (
              <div key={ch.name} className={`rounded-sm border p-3 ${ch.color}`}>
                <div className="flex items-center gap-2 mb-2">
                  <Icon className="h-4 w-4" />
                  <span className="text-sm font-semibold">{ch.name}</span>
                </div>
                <div className="grid grid-cols-2 gap-2 pt-2 border-t border-current/20">
                  <div>
                    <div className="text-[10px] uppercase tracking-wider opacity-70">
                      ข้อความวันนี้
                    </div>
                    <div className="text-xl font-bold tabular-nums">{ch.calls.toLocaleString("th-TH")}</div>
                  </div>
                  <div>
                    <div className="text-[10px] uppercase tracking-wider opacity-70">
                      เร่งด่วน
                    </div>
                    <div className="text-xl font-bold tabular-nums">{ch.urgent}</div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
        <div className="px-5 pb-3 text-[11px] text-slate-500 italic">
          * ข้อมูล mock จาก API ๑๙๑ / CCTV / Intelligence (Demo) — ไม่ใช่การเชื่อมต่อจริง
        </div>
      </section>

      {/* Active emergencies */}
      <section className="bg-white border border-slate-200 rounded-sm overflow-hidden">
        <div className="border-b border-slate-100 px-5 py-3 flex items-center gap-2">
          <Siren className="h-4 w-4 text-red-600" />
          <h2 className="text-sm font-semibold text-slate-900">
            เหตุฉุกเฉินที่กำลังดำเนินการ ({openCases.length})
          </h2>
        </div>
        {openCases.length === 0 ? (
          <div className="px-5 py-8 text-center text-sm text-slate-500">
            ✓ ไม่มีเหตุฉุกเฉินที่ยังดำเนินการอยู่
          </div>
        ) : (
          <ul className="divide-y divide-slate-100">
            {openCases.map((inc) => (
              <li key={inc.id} className="px-5 py-3 hover:bg-slate-50">
                <div className="flex items-start gap-3">
                  <div
                    className={`h-9 w-9 rounded-sm border flex items-center justify-center shrink-0 ${SEVERITY_STYLES[inc.severity as IncidentSeverity]}`}
                  >
                    <Siren className="h-4 w-4" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span
                        className={`text-[10px] font-semibold uppercase tracking-wider px-1.5 py-0.5 rounded-sm border ${SEVERITY_STYLES[inc.severity as IncidentSeverity]}`}
                      >
                        {SEVERITY_LABELS[inc.severity]}
                      </span>
                      <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-600 bg-slate-100 px-1.5 py-0.5 rounded-sm border border-slate-200">
                        {INCIDENT_STATUS_LABELS[inc.status]}
                      </span>
                      <span className="text-[11px] text-slate-500">
                        {inc.type}
                      </span>
                    </div>
                    <div className="text-sm font-medium text-slate-900 line-clamp-2">
                      {inc.description}
                    </div>
                    <div className="flex items-center gap-3 mt-1 text-[11px] text-slate-500">
                      <span className="inline-flex items-center gap-1">
                        <MapPin className="h-3 w-3" />
                        {inc.location.province} · {inc.location.district}
                      </span>
                      <span className="inline-flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        {new Date(inc.occurredAt).toLocaleString("th-TH", {
                          dateStyle: "short",
                          timeStyle: "short",
                        })}
                      </span>
                      <span>· แหล่ง: {inc.source}</span>
                    </div>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>

      {/* Linked emergency commands */}
      {emergencyCommands.length > 0 && (
        <section className="bg-white border border-slate-200 rounded-sm overflow-hidden">
          <div className="border-b border-slate-100 px-5 py-3">
            <h2 className="text-sm font-semibold text-slate-900">
              หนังสือสั่งการฉุกเฉินที่เกี่ยวข้อง
            </h2>
          </div>
          <ul className="divide-y divide-slate-100">
            {emergencyCommands.map((c) => (
              <li key={c.id} className="px-5 py-3">
                <Link
                  href={`/commands/${c.id}`}
                  className="block hover:bg-slate-50 -mx-5 px-5 py-1"
                >
                  <div className="text-sm font-semibold text-slate-900">
                    {c.letter.subject}
                  </div>
                  <div className="text-xs text-slate-500 mt-0.5">
                    {c.letter.docNumber} · {new Date(c.createdAt).toLocaleString("th-TH")}
                  </div>
                </Link>
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  );
}

function StatBox({
  label,
  value,
  accent,
  pulse,
}: {
  label: string;
  value: number;
  accent: "navy" | "red" | "amber" | "emerald";
  pulse?: boolean;
}) {
  const colors: Record<typeof accent, string> = {
    navy: "bg-[#1e3a5f] text-white",
    red: "bg-red-600 text-white",
    amber: "bg-amber-600 text-white",
    emerald: "bg-emerald-600 text-white",
  };
  return (
    <div className="rounded-sm border border-slate-200 bg-white p-4 flex items-center gap-3">
      <div
        className={`h-10 w-10 rounded-sm flex items-center justify-center ${colors[accent]} ${pulse ? "animate-pulse" : ""}`}
      >
        <Siren className="h-4 w-4" />
      </div>
      <div>
        <div className="text-[10px] font-semibold uppercase tracking-wider text-slate-500">
          {label}
        </div>
        <div className="text-2xl font-bold text-slate-900 leading-none mt-1 tabular-nums">
          {value.toLocaleString("th-TH")}
        </div>
      </div>
    </div>
  );
}
