// /intelligence/dashboards/risk — Risk areas dashboard (crime hotspots)

import Link from "next/link";
import { AlertTriangle, ChevronLeft, MapPin, TrendingUp } from "lucide-react";
import { PageHeader } from "@/components/page-header";
import {
  listIncidents,
  countIncidentsByProvince,
  countIncidentsByType,
} from "@/lib/intelligence/store";
import {
  SEVERITY_STYLES,
  SEVERITY_LABELS,
  type IncidentSeverity,
} from "@/lib/intelligence/types";

export const dynamic = "force-dynamic";

export default function RiskDashboardPage() {
  const incidents = listIncidents({ daysWithin: 30 });
  const byProvince = countIncidentsByProvince();
  const byType = countIncidentsByType();

  const provinceList = Object.entries(byProvince)
    .map(([province, count]) => ({ province, count }))
    .sort((a, b) => b.count - a.count);
  const maxProvCount = provinceList[0]?.count ?? 1;
  const top10Prov = provinceList.slice(0, 10);

  const typeList = Object.entries(byType)
    .map(([type, count]) => ({ type, count }))
    .sort((a, b) => b.count - a.count);
  const maxTypeCount = typeList[0]?.count ?? 1;

  // Critical/High severity incidents
  const criticalIncidents = incidents.filter(
    (i) => i.severity === "CRITICAL" || i.severity === "HIGH"
  );

  return (
    <div className="space-y-6">
      <PageHeader
        icon={AlertTriangle}
        eyebrow="แดชบอร์ดเฉพาะทาง"
        title="แดชบอร์ดพื้นที่เสี่ยง (Crime Hotspots)"
        description="เหตุการณ์และคดีในรอบ ๓๐ วัน — จัดเรียงตามจังหวัด ประเภทคดี และระดับความรุนแรง"
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
        <StatBox label="เหตุการณ์ ๓๐ วัน" value={incidents.length} accent="navy" />
        <StatBox
          label="วิกฤต/สูง"
          value={criticalIncidents.length}
          accent="red"
        />
        <StatBox label="จังหวัดที่ได้รับผลกระทบ" value={provinceList.length} accent="amber" />
        <StatBox
          label="คดีที่ยังเปิดอยู่"
          value={incidents.filter((i) => i.status !== "CLOSED").length}
          accent="emerald"
        />
      </div>

      {/* Top provinces */}
      <section className="bg-white border border-slate-200 rounded-sm overflow-hidden">
        <div className="border-b border-slate-100 px-5 py-3">
          <h2 className="text-sm font-semibold text-slate-900">
            พื้นที่ที่มีเหตุการณ์หนาแน่นที่สุด (Top 10)
          </h2>
        </div>
        <div className="p-5 space-y-2.5">
          {top10Prov.map((p, idx) => {
            const pct = (p.count / maxProvCount) * 100;
            return (
              <div key={p.province} className="flex items-center gap-3">
                <div className="text-xs font-bold text-slate-400 w-6 text-right tabular-nums">
                  #{idx + 1}
                </div>
                <div className="text-sm font-medium text-slate-900 w-36 truncate">
                  {p.province}
                </div>
                <div className="flex-1 h-5 bg-slate-100 rounded-sm overflow-hidden relative">
                  <div
                    className="h-full rounded-sm transition-all"
                    style={{
                      width: `${pct}%`,
                      background:
                        idx === 0
                          ? "#dc2626"
                          : idx <= 2
                            ? "#ea580c"
                            : idx <= 5
                              ? "#d4a017"
                              : "#1e3a5f",
                    }}
                  />
                  <span className="absolute right-2 top-1/2 -translate-y-1/2 text-[10px] font-bold text-slate-700 tabular-nums">
                    {p.count} เหตุ
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* Incident types */}
      <section className="bg-white border border-slate-200 rounded-sm overflow-hidden">
        <div className="border-b border-slate-100 px-5 py-3">
          <h2 className="text-sm font-semibold text-slate-900">
            ประเภทเหตุการณ์
          </h2>
        </div>
        <div className="p-5 grid grid-cols-1 md:grid-cols-2 gap-3">
          {typeList.map((t) => {
            const pct = (t.count / maxTypeCount) * 100;
            return (
              <div key={t.type} className="space-y-1">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-medium text-slate-900">{t.type}</span>
                  <span className="tabular-nums text-slate-600">{t.count}</span>
                </div>
                <div className="h-2 bg-slate-100 rounded-sm overflow-hidden">
                  <div
                    className="h-full bg-[#1e3a5f] rounded-sm"
                    style={{ width: `${pct}%` }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* Recent critical incidents */}
      <section className="bg-white border border-slate-200 rounded-sm overflow-hidden">
        <div className="border-b border-slate-100 px-5 py-3 flex items-center gap-2">
          <TrendingUp className="h-4 w-4 text-red-600" />
          <h2 className="text-sm font-semibold text-slate-900">
            เหตุการณ์ระดับวิกฤต/สูง ล่าสุด ({criticalIncidents.length})
          </h2>
        </div>
        <ul className="divide-y divide-slate-100 max-h-[480px] overflow-y-auto">
          {criticalIncidents.map((inc) => (
            <li key={inc.id} className="px-5 py-3 hover:bg-slate-50">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <span
                      className={`text-[10px] font-semibold uppercase tracking-wider px-1.5 py-0.5 rounded-sm border ${SEVERITY_STYLES[inc.severity as IncidentSeverity]}`}
                    >
                      {SEVERITY_LABELS[inc.severity]}
                    </span>
                    <span className="text-[11px] font-medium text-slate-600">
                      {inc.type}
                    </span>
                    <span className="text-[11px] text-slate-400">·</span>
                    <span className="text-[11px] text-slate-500">
                      {new Date(inc.occurredAt).toLocaleString("th-TH", {
                        dateStyle: "short",
                        timeStyle: "short",
                      })}
                    </span>
                  </div>
                  <div className="text-sm text-slate-900 line-clamp-1">
                    {inc.description}
                  </div>
                  <div className="text-xs text-slate-500 mt-1 flex items-center gap-1">
                    <MapPin className="h-3 w-3" />
                    {inc.location.province} · {inc.location.district} · {inc.location.address}
                  </div>
                </div>
                <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-500 shrink-0">
                  {inc.source}
                </span>
              </div>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}

function StatBox({
  label,
  value,
  accent,
}: {
  label: string;
  value: number;
  accent: "navy" | "red" | "amber" | "emerald";
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
        className={`h-10 w-10 rounded-sm flex items-center justify-center ${colors[accent]} text-base font-bold`}
      >
        {value > 99 ? "99+" : value}
      </div>
      <div>
        <div className="text-[10px] font-semibold uppercase tracking-wider text-slate-500">
          {label}
        </div>
        <div className="text-xl font-bold text-slate-900 leading-none mt-1 tabular-nums">
          {value.toLocaleString("th-TH")}
        </div>
      </div>
    </div>
  );
}
