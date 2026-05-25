"use client";

import { useMemo, useState } from "react";
import { MapPin, Filter } from "lucide-react";
import type {
  Incident,
  IncidentType,
  IncidentSeverity,
} from "@/lib/intelligence/types";
import {
  INCIDENT_TYPES,
  SEVERITY_LABELS,
  SEVERITY_STYLES,
} from "@/lib/intelligence/types";

interface Props {
  incidents: Incident[];
  byProvince: Record<string, number>;
}

const SEVERITIES: IncidentSeverity[] = ["LOW", "MEDIUM", "HIGH", "CRITICAL"];

// Thailand coordinate bounds (approximate)
const BOUNDS = {
  latMin: 5.6,
  latMax: 20.4,
  lngMin: 97.4,
  lngMax: 105.6,
};

interface ProvinceRegion {
  province: string;
  region: string;
  /** Approximate center lat/lng (used for label positioning) */
  lat: number;
  lng: number;
}

// Approximate centers for major provinces (used as fallback labels)
const PROVINCE_CENTERS: ProvinceRegion[] = [
  { province: "กรุงเทพมหานคร", region: "กลาง", lat: 13.75, lng: 100.5 },
  { province: "เชียงใหม่", region: "เหนือ", lat: 18.79, lng: 98.98 },
  { province: "เชียงราย", region: "เหนือ", lat: 19.91, lng: 99.84 },
  { province: "ลำปาง", region: "เหนือ", lat: 17.62, lng: 100.09 },
  { province: "พิษณุโลก", region: "เหนือ", lat: 16.83, lng: 100.27 },
  { province: "ขอนแก่น", region: "อีสาน", lat: 16.44, lng: 102.84 },
  { province: "อุดรธานี", region: "อีสาน", lat: 17.41, lng: 102.79 },
  { province: "หนองคาย", region: "อีสาน", lat: 17.88, lng: 102.74 },
  { province: "นครราชสีมา", region: "อีสาน", lat: 14.98, lng: 102.1 },
  { province: "อุบลราชธานี", region: "อีสาน", lat: 16.54, lng: 104.72 },
  { province: "ปัตตานี", region: "ใต้", lat: 6.87, lng: 101.25 },
  { province: "ยะลา", region: "ใต้", lat: 6.54, lng: 101.28 },
  { province: "นราธิวาส", region: "ใต้", lat: 6.43, lng: 101.82 },
  { province: "ภูเก็ต", region: "ใต้", lat: 7.88, lng: 98.39 },
  { province: "กระบี่", region: "ใต้", lat: 7.73, lng: 98.77 },
  { province: "ชลบุรี", region: "ตะวันออก", lat: 13.36, lng: 100.98 },
  { province: "ระยอง", region: "ตะวันออก", lat: 12.68, lng: 101.28 },
  { province: "ฉะเชิงเทรา", region: "ตะวันออก", lat: 13.72, lng: 101.21 },
  { province: "ปราจีนบุรี", region: "ตะวันออก", lat: 14.05, lng: 101.37 },
  { province: "นครปฐม", region: "กลาง", lat: 13.82, lng: 100.06 },
  { province: "ราชบุรี", region: "กลาง", lat: 13.53, lng: 99.81 },
  { province: "เพชรบุรี", region: "กลาง", lat: 13.11, lng: 99.94 },
  { province: "นนทบุรี", region: "กลาง", lat: 13.85, lng: 100.51 },
  { province: "ปทุมธานี", region: "กลาง", lat: 14.02, lng: 100.73 },
  { province: "พระนครศรีอยุธยา", region: "กลาง", lat: 14.36, lng: 100.59 },
];

function getRegionForProvince(p: string): string {
  return PROVINCE_CENTERS.find((x) => x.province === p)?.region ?? "อื่นๆ";
}

function intensity(count: number, max: number): string {
  if (count === 0) return "rgba(30, 58, 95, 0.05)";
  const ratio = Math.min(1, count / Math.max(max, 1));
  // Yellow → Red gradient
  if (ratio > 0.66) return "rgba(220, 38, 38, 0.85)"; // red
  if (ratio > 0.33) return "rgba(234, 88, 12, 0.7)"; // orange
  return "rgba(212, 160, 23, 0.55)"; // amber
}

function radiusForCount(count: number, max: number): number {
  if (count === 0) return 5;
  const ratio = Math.min(1, count / Math.max(max, 1));
  return 8 + ratio * 22;
}

export function HeatmapView({ incidents, byProvince }: Props) {
  const [filterType, setFilterType] = useState<IncidentType | "ALL">("ALL");
  const [filterSeverity, setFilterSeverity] = useState<IncidentSeverity | "ALL">("ALL");
  const [days, setDays] = useState<number>(30);

  const filtered = useMemo(() => {
    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() - days);
    return incidents.filter((i) => {
      if (filterType !== "ALL" && i.type !== filterType) return false;
      if (filterSeverity !== "ALL" && i.severity !== filterSeverity) return false;
      if (new Date(i.occurredAt) < cutoff) return false;
      return true;
    });
  }, [incidents, filterType, filterSeverity, days]);

  // Group by province for hotspot list
  const filteredByProvince = useMemo(() => {
    const counts: Record<string, number> = {};
    for (const i of filtered) {
      counts[i.location.province] = (counts[i.location.province] ?? 0) + 1;
    }
    return counts;
  }, [filtered]);

  const sortedProvinces = useMemo(
    () =>
      Object.entries(filteredByProvince)
        .map(([province, count]) => ({ province, count }))
        .sort((a, b) => b.count - a.count),
    [filteredByProvince]
  );

  const maxCount = sortedProvinces[0]?.count ?? 1;
  const totalByProvinceUnfiltered = byProvince;

  // Compute SVG point positions
  const svgW = 600;
  const svgH = 800;

  function projectToSvg(lat: number, lng: number): { x: number; y: number } {
    const x =
      ((lng - BOUNDS.lngMin) / (BOUNDS.lngMax - BOUNDS.lngMin)) * svgW;
    const y = svgH - ((lat - BOUNDS.latMin) / (BOUNDS.latMax - BOUNDS.latMin)) * svgH;
    return { x, y };
  }

  return (
    <div className="space-y-5">
      {/* Filters */}
      <section className="bg-white border border-slate-200 rounded-sm p-4">
        <div className="flex items-center gap-2 mb-3">
          <Filter className="h-4 w-4 text-slate-500" />
          <h2 className="text-sm font-semibold text-slate-900">ตัวกรองข้อมูล</h2>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <div>
            <label className="text-[10px] font-semibold uppercase tracking-wider text-slate-500 mb-1.5 block">
              ประเภทคดี
            </label>
            <select
              suppressHydrationWarning
              value={filterType}
              onChange={(e) => setFilterType(e.target.value as IncidentType | "ALL")}
              className="w-full border border-slate-200 rounded-sm px-3 py-2 text-sm bg-white"
            >
              <option value="ALL">ทุกประเภท</option>
              {INCIDENT_TYPES.map((t) => (
                <option key={t} value={t}>
                  {t}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="text-[10px] font-semibold uppercase tracking-wider text-slate-500 mb-1.5 block">
              ระดับความรุนแรง
            </label>
            <select
              suppressHydrationWarning
              value={filterSeverity}
              onChange={(e) =>
                setFilterSeverity(e.target.value as IncidentSeverity | "ALL")
              }
              className="w-full border border-slate-200 rounded-sm px-3 py-2 text-sm bg-white"
            >
              <option value="ALL">ทุกระดับ</option>
              {SEVERITIES.map((s) => (
                <option key={s} value={s}>
                  {SEVERITY_LABELS[s]}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="text-[10px] font-semibold uppercase tracking-wider text-slate-500 mb-1.5 block">
              ช่วงเวลา
            </label>
            <select
              suppressHydrationWarning
              value={days}
              onChange={(e) => setDays(Number(e.target.value))}
              className="w-full border border-slate-200 rounded-sm px-3 py-2 text-sm bg-white"
            >
              <option value={7}>๗ วันล่าสุด</option>
              <option value={14}>๑๔ วันล่าสุด</option>
              <option value={30}>๓๐ วันล่าสุด</option>
              <option value={90}>๙๐ วันล่าสุด</option>
            </select>
          </div>
        </div>

        <div className="mt-3 pt-3 border-t border-slate-100 flex items-center gap-3 text-xs text-slate-600">
          <span>เหตุการณ์ที่กรอง: <strong className="text-slate-900 tabular-nums">{filtered.length}</strong></span>
          <span>·</span>
          <span>จังหวัดที่ได้รับผลกระทบ: <strong className="text-slate-900 tabular-nums">{sortedProvinces.length}</strong></span>
        </div>
      </section>

      {/* Map */}
      <section className="bg-white border border-slate-200 rounded-sm overflow-hidden">
        <div className="border-b border-slate-100 px-5 py-3">
          <h2 className="text-sm font-semibold text-slate-900">
            แผนที่ความหนาแน่นของเหตุการณ์ (Thailand)
          </h2>
        </div>
        <div className="p-5">
          <div className="bg-slate-50 border border-slate-200 rounded-sm relative overflow-hidden mx-auto" style={{ maxWidth: 600 }}>
            <svg
              viewBox={`0 0 ${svgW} ${svgH}`}
              xmlns="http://www.w3.org/2000/svg"
              className="w-full block"
            >
              {/* Thailand outline approximation */}
              <path
                d="M 280 50 Q 320 60 340 90 L 360 130 Q 360 170 340 200 L 360 230 Q 380 270 380 320 L 350 380 Q 340 440 360 490 L 380 540 Q 400 600 420 660 L 450 720 L 440 770 L 420 800 L 380 800 L 360 770 L 340 720 L 320 660 L 300 600 L 290 540 L 280 490 L 260 440 L 240 390 L 220 340 L 200 280 L 220 230 L 230 180 L 250 130 L 270 80 Z"
                fill="rgba(30, 58, 95, 0.08)"
                stroke="rgba(30, 58, 95, 0.3)"
                strokeWidth="1.5"
              />

              {/* Incident points */}
              {filtered.map((inc) => {
                const { x, y } = projectToSvg(inc.location.lat, inc.location.lng);
                const r =
                  inc.severity === "CRITICAL"
                    ? 8
                    : inc.severity === "HIGH"
                      ? 7
                      : inc.severity === "MEDIUM"
                        ? 5
                        : 4;
                const color =
                  inc.severity === "CRITICAL"
                    ? "#dc2626"
                    : inc.severity === "HIGH"
                      ? "#ea580c"
                      : inc.severity === "MEDIUM"
                        ? "#d4a017"
                        : "#3b82f6";
                return (
                  <g key={inc.id}>
                    <circle
                      cx={x}
                      cy={y}
                      r={r * 2}
                      fill={color}
                      opacity={0.18}
                    />
                    <circle
                      cx={x}
                      cy={y}
                      r={r}
                      fill={color}
                      opacity={0.85}
                      stroke="white"
                      strokeWidth={0.6}
                    >
                      <title>
                        {inc.type} · {inc.location.province} · {SEVERITY_LABELS[inc.severity]}
                      </title>
                    </circle>
                  </g>
                );
              })}

              {/* Province hot-spot circles (cumulative) */}
              {sortedProvinces.slice(0, 5).map((p, idx) => {
                const center = PROVINCE_CENTERS.find((c) => c.province === p.province);
                if (!center) return null;
                const { x, y } = projectToSvg(center.lat, center.lng);
                const r = radiusForCount(p.count, maxCount);
                return (
                  <g key={p.province}>
                    <circle
                      cx={x}
                      cy={y}
                      r={r + 12}
                      fill={intensity(p.count, maxCount)}
                      opacity={0.25}
                    />
                    <text
                      x={x}
                      y={y - r - 6}
                      textAnchor="middle"
                      className="text-[9px] font-bold fill-slate-900"
                    >
                      #{idx + 1} {p.province} ({p.count})
                    </text>
                  </g>
                );
              })}
            </svg>

            {/* Legend */}
            <div className="absolute top-2 right-2 bg-white/95 border border-slate-200 rounded-sm p-2 text-[10px] space-y-1">
              <div className="font-semibold text-slate-700 mb-0.5">ระดับความรุนแรง</div>
              <div className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-red-600" />
                <span>วิกฤต</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-orange-600" />
                <span>สูง</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-amber-500" />
                <span>ปานกลาง</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-blue-500" />
                <span>ต่ำ</span>
              </div>
            </div>
          </div>
          <div className="text-[11px] text-slate-500 italic mt-2 text-center">
            * Thailand outline เป็น approximation; ตำแหน่งจุด event ใช้ lat/lng ของเหตุการณ์จริงที่ mock ไว้
          </div>
        </div>
      </section>

      {/* Top hotspots */}
      <section className="bg-white border border-slate-200 rounded-sm overflow-hidden">
        <div className="border-b border-slate-100 px-5 py-3">
          <h2 className="text-sm font-semibold text-slate-900">
            Top 5 จุดเสี่ยง (Hotspots)
          </h2>
        </div>
        <ol className="divide-y divide-slate-100">
          {sortedProvinces.slice(0, 5).map((p, idx) => {
            const region = getRegionForProvince(p.province);
            const pct = (p.count / Math.max(maxCount, 1)) * 100;
            const allTime = totalByProvinceUnfiltered[p.province] ?? p.count;
            const dotColor =
              idx === 0
                ? "#dc2626"
                : idx === 1
                  ? "#ea580c"
                  : idx === 2
                    ? "#d4a017"
                    : "#1e3a5f";
            return (
              <li key={p.province} className="px-5 py-3.5">
                <div className="flex items-start gap-3">
                  <div className="text-xs font-bold text-slate-400 w-6 text-right tabular-nums pt-1">
                    #{idx + 1}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-baseline gap-2">
                      <div className="text-sm font-semibold text-slate-900 inline-flex items-center gap-1">
                        <MapPin className="h-3 w-3" style={{ color: dotColor }} />
                        {p.province}
                      </div>
                      <span className="text-[10px] text-slate-500">
                        ภาค {region}
                      </span>
                    </div>
                    <div className="mt-1.5 flex items-center gap-2">
                      <div className="flex-1 h-2 bg-slate-100 rounded-sm overflow-hidden">
                        <div
                          className="h-full rounded-sm"
                          style={{ width: `${pct}%`, background: dotColor }}
                        />
                      </div>
                      <span className="text-xs font-bold tabular-nums text-slate-900 w-20 text-right">
                        {p.count} เหตุ
                      </span>
                    </div>
                    <div className="text-[11px] text-slate-500 mt-1">
                      เหตุการณ์ทั้งหมดในระบบ: {allTime} เหตุ
                    </div>
                  </div>
                </div>
              </li>
            );
          })}
        </ol>
      </section>

      {/* Province grid (CSS heatmap) */}
      <section className="bg-white border border-slate-200 rounded-sm overflow-hidden">
        <div className="border-b border-slate-100 px-5 py-3">
          <h2 className="text-sm font-semibold text-slate-900">
            Heatmap ตามจังหวัด (CSS Grid)
          </h2>
        </div>
        <div className="p-5">
          <div className="grid grid-cols-3 md:grid-cols-5 lg:grid-cols-6 gap-1.5">
            {PROVINCE_CENTERS.map((p) => {
              const count = filteredByProvince[p.province] ?? 0;
              const bg = intensity(count, maxCount);
              return (
                <div
                  key={p.province}
                  className="rounded-sm border border-slate-200 px-2 py-2"
                  style={{
                    backgroundColor: count === 0 ? "#f8fafc" : bg,
                  }}
                  title={`${p.province}: ${count} เหตุ`}
                >
                  <div
                    className={`text-[10px] font-semibold ${count > 4 ? "text-white" : "text-slate-700"} truncate`}
                  >
                    {p.province}
                  </div>
                  <div
                    className={`text-sm font-bold tabular-nums ${count > 4 ? "text-white" : "text-slate-900"}`}
                  >
                    {count}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Sorted incident list */}
      <section className="bg-white border border-slate-200 rounded-sm overflow-hidden">
        <div className="border-b border-slate-100 px-5 py-3">
          <h2 className="text-sm font-semibold text-slate-900">
            รายการเหตุการณ์ที่ตรงตามเงื่อนไข ({filtered.length})
          </h2>
        </div>
        <ul className="divide-y divide-slate-100 max-h-96 overflow-y-auto">
          {filtered.slice(0, 30).map((inc) => (
            <li key={inc.id} className="px-5 py-2.5 hover:bg-slate-50">
              <div className="flex items-start gap-2">
                <span
                  className={`text-[10px] font-semibold uppercase tracking-wider px-1.5 py-0.5 rounded-sm border shrink-0 ${SEVERITY_STYLES[inc.severity as IncidentSeverity]}`}
                >
                  {SEVERITY_LABELS[inc.severity]}
                </span>
                <div className="min-w-0 flex-1">
                  <div className="text-sm text-slate-900 line-clamp-1">
                    [{inc.type}] {inc.description}
                  </div>
                  <div className="text-[11px] text-slate-500 mt-0.5">
                    {inc.location.province} · {inc.location.district} · {new Date(inc.occurredAt).toLocaleString("th-TH", { dateStyle: "short", timeStyle: "short" })} · แหล่ง: {inc.source}
                  </div>
                </div>
              </div>
            </li>
          ))}
          {filtered.length > 30 && (
            <li className="px-5 py-3 text-center text-xs text-slate-500">
              ... และอีก {filtered.length - 30} รายการ
            </li>
          )}
        </ul>
      </section>
    </div>
  );
}
