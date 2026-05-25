"use client";

import { useState } from "react";
import {
  ArrowUpRight,
  ArrowDownRight,
  Minus,
  ChevronDown,
  Lightbulb,
  ListChecks,
} from "lucide-react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  ReferenceArea,
  ReferenceLine,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Area,
  ComposedChart,
} from "recharts";
import type { PredictiveTrend } from "@/lib/intelligence/types";
import { formatChartData, averageConfidence } from "@/lib/intelligence/predictor";

const DIRECTION_STYLES = {
  up: {
    icon: ArrowUpRight,
    color: "text-red-700",
    bgColor: "bg-red-50 border-red-200",
    label: "สูงขึ้น",
  },
  down: {
    icon: ArrowDownRight,
    color: "text-emerald-700",
    bgColor: "bg-emerald-50 border-emerald-200",
    label: "ลดลง",
  },
  flat: {
    icon: Minus,
    color: "text-slate-700",
    bgColor: "bg-slate-100 border-slate-300",
    label: "ทรงตัว",
  },
};

export function TrendCard({ trend }: { trend: PredictiveTrend }) {
  const [expanded, setExpanded] = useState(false);
  const data = formatChartData(trend);
  const dStyle = DIRECTION_STYLES[trend.direction];
  const DIcon = dStyle.icon;
  const avgConf = averageConfidence(trend);

  // Split point — where historical ends, predicted begins
  const splitPeriod = trend.historical[trend.historical.length - 1].period;

  return (
    <div className="rounded-sm border border-slate-200 bg-white overflow-hidden">
      <div className="px-4 py-3 border-b border-slate-100">
        <div className="flex items-start justify-between gap-2 mb-1.5">
          <div className="text-sm font-semibold text-slate-900 leading-tight">
            {trend.metric}
          </div>
          <span
            className={`shrink-0 inline-flex items-center gap-1 text-[10px] font-semibold px-1.5 py-0.5 rounded-sm border ${dStyle.bgColor} ${dStyle.color}`}
          >
            <DIcon className="h-3 w-3" />
            {dStyle.label}
          </span>
        </div>
        <div className="flex items-baseline justify-between gap-2">
          <div className="text-[11px] text-slate-500">
            หมวด: {trend.category}
          </div>
          <div className={`text-base font-bold tabular-nums ${dStyle.color}`}>
            {trend.forecastChangePct >= 0 ? "+" : ""}
            {trend.forecastChangePct.toFixed(1)}%
          </div>
        </div>
      </div>

      {/* Chart */}
      <div className="px-2 pt-3 pb-1 h-40">
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart data={data} margin={{ top: 6, right: 8, bottom: 0, left: -22 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
            <XAxis
              dataKey="period"
              tick={{ fontSize: 9, fill: "#64748b" }}
              stroke="#cbd5e1"
              interval="preserveStartEnd"
            />
            <YAxis
              tick={{ fontSize: 9, fill: "#64748b" }}
              stroke="#cbd5e1"
              width={32}
            />
            <Tooltip
              contentStyle={{
                fontSize: 10,
                borderRadius: 2,
                border: "1px solid #e2e8f0",
              }}
              labelStyle={{ fontWeight: 600, fontSize: 10 }}
            />
            <ReferenceLine
              x={splitPeriod}
              stroke="#94a3b8"
              strokeDasharray="3 3"
            />
            {/* Confidence band for predicted */}
            <Area
              type="monotone"
              dataKey="predictedHigh"
              stroke="none"
              fill="#fbbf24"
              fillOpacity={0.15}
            />
            <Area
              type="monotone"
              dataKey="predictedLow"
              stroke="none"
              fill="#ffffff"
              fillOpacity={1}
            />
            <Line
              type="monotone"
              dataKey="historical"
              name="ข้อมูลย้อนหลัง"
              stroke="#1e40af"
              strokeWidth={2}
              dot={{ fill: "#1e40af", r: 2 }}
              connectNulls
            />
            <Line
              type="monotone"
              dataKey="predicted"
              name="พยากรณ์"
              stroke="#b8860b"
              strokeWidth={2}
              strokeDasharray="5 3"
              dot={{ fill: "#b8860b", r: 2 }}
              connectNulls
            />
          </ComposedChart>
        </ResponsiveContainer>
      </div>

      <div className="px-4 py-2 text-[11px] text-slate-500 flex items-center justify-between border-t border-slate-100">
        <span>ความมั่นใจเฉลี่ย {(avgConf * 100).toFixed(0)}%</span>
        <button
          suppressHydrationWarning
          onClick={() => setExpanded((x) => !x)}
          className="inline-flex items-center gap-1 text-[11px] font-medium text-[#1e3a5f] hover:underline"
        >
          {expanded ? "ซ่อนรายละเอียด" : "รายละเอียด"}
          <ChevronDown
            className={`h-3.5 w-3.5 transition-transform ${expanded ? "rotate-180" : ""}`}
          />
        </button>
      </div>

      {expanded && (
        <div className="border-t border-slate-100 p-4 space-y-3 bg-slate-50/50">
          <div>
            <div className="text-[10px] font-semibold uppercase tracking-wider text-slate-500 mb-1.5 flex items-center gap-1">
              <ListChecks className="h-3 w-3" />
              Driver Factors
            </div>
            <ul className="space-y-1">
              {trend.driverFactors.map((f, i) => (
                <li
                  key={i}
                  className="text-xs text-slate-700 flex gap-1.5 leading-relaxed"
                >
                  <span className="text-[#b8860b] shrink-0">•</span>
                  <span>{f}</span>
                </li>
              ))}
            </ul>
          </div>
          <div className="border-t border-slate-200 pt-3">
            <div className="text-[10px] font-semibold uppercase tracking-wider text-slate-500 mb-1.5 flex items-center gap-1">
              <Lightbulb className="h-3 w-3" />
              คำแนะนำจาก AI
            </div>
            <div className="text-xs text-slate-700 leading-relaxed">
              {trend.recommendation}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
