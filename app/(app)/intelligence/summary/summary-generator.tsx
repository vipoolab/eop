"use client";

import { useState } from "react";
import {
  Sparkles,
  Loader2,
  CheckCircle2,
  ArrowUpRight,
  ArrowDownRight,
  Minus,
  Library,
  Lightbulb,
  BookOpen,
} from "lucide-react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
  Cell,
} from "recharts";
import type { ExecutiveSummary, SummaryTrend } from "@/lib/intelligence/types";

interface Props {
  initialSummaries: ExecutiveSummary[];
}

const SCOPES = [
  "ภาพรวมประเทศ",
  "กรุงเทพมหานคร",
  "บช.น.",
  "ภ.๑",
  "ภ.๒",
  "ภ.๓",
  "ภ.๔",
  "ภ.๕",
  "ภ.๘",
  "ยาเสพติดภาคอีสาน",
  "อาชญากรรมออนไลน์",
];

const PERIODS = [
  "เดือนเมษายน ๒๕๖๙",
  "เดือนพฤษภาคม ๒๕๖๙",
  "ไตรมาส ๑ ปีงบประมาณ ๒๕๖๙",
  "ไตรมาส ๒ ปีงบประมาณ ๒๕๖๙",
  "๖ เดือนล่าสุด (พ.ย. ๖๘ - เม.ย. ๖๙)",
  "ภาพรวมปีปฏิทิน ๒๕๖๙ (ม.ค. - เม.ย.)",
];

const GEN_STEPS = [
  { label: "รวบรวมข้อมูลจากฐานข้อมูล...", durationMs: 500 },
  { label: "วิเคราะห์แนวโน้มในรอบเวลาที่กำหนด...", durationMs: 700 },
  { label: "ระบุประเด็นสำคัญ (Key Findings)...", durationMs: 600 },
  { label: "AI สร้างคำแนะนำสำหรับผู้บริหาร...", durationMs: 800 },
  { label: "เสร็จสิ้น", durationMs: 200 },
];

const DIR_STYLES = {
  up: { icon: ArrowUpRight, color: "text-red-700", label: "เพิ่มขึ้น" },
  down: { icon: ArrowDownRight, color: "text-emerald-700", label: "ลดลง" },
  flat: { icon: Minus, color: "text-slate-700", label: "ทรงตัว" },
};

export function SummaryGenerator({ initialSummaries }: Props) {
  const [scope, setScope] = useState(SCOPES[0]);
  const [period, setPeriod] = useState(PERIODS[0]);
  const [result, setResult] = useState<ExecutiveSummary | null>(null);
  const [step, setStep] = useState(-1);
  const [error, setError] = useState<string | null>(null);
  const [source, setSource] = useState<"library" | "ai" | null>(null);
  const [library, setLibrary] = useState<ExecutiveSummary[]>(initialSummaries);

  async function generate() {
    setError(null);
    setResult(null);
    setSource(null);
    for (let i = 0; i < GEN_STEPS.length - 1; i++) {
      setStep(i);
      await new Promise((r) => setTimeout(r, GEN_STEPS[i].durationMs));
    }
    try {
      const res = await fetch("/api/intelligence/summary", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ scope, period }),
      });
      const j = await res.json();
      if (j.success) {
        setResult(j.data.summary);
        setSource(j.data.source);
        setStep(GEN_STEPS.length - 1);
        if (j.data.generated) {
          setLibrary((cur) => [j.data.summary, ...cur]);
        }
      } else {
        setError(j.message);
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : "เกิดข้อผิดพลาด");
    } finally {
      setTimeout(() => setStep(-1), 600);
    }
  }

  function openExisting(s: ExecutiveSummary) {
    setResult(s);
    setSource("library");
    setScope(s.scope);
    setPeriod(s.period);
  }

  const isProcessing = step >= 0 && step < GEN_STEPS.length - 1;

  return (
    <div className="space-y-5">
      {/* Generator form */}
      <section className="bg-white border border-slate-200 rounded-sm overflow-hidden">
        <div className="border-b border-slate-100 px-5 py-3">
          <h2 className="text-sm font-semibold text-slate-900">
            สร้างรายงานผู้บริหารใหม่
          </h2>
        </div>
        <div className="p-5 grid grid-cols-1 md:grid-cols-3 gap-3 items-end">
          <div>
            <label className="text-[10px] font-semibold uppercase tracking-wider text-slate-500 mb-1.5 block">
              ขอบเขต (Scope)
            </label>
            <select
              suppressHydrationWarning
              value={scope}
              onChange={(e) => setScope(e.target.value)}
              className="w-full border border-slate-200 rounded-sm px-3 py-2 text-sm bg-white"
            >
              {SCOPES.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="text-[10px] font-semibold uppercase tracking-wider text-slate-500 mb-1.5 block">
              ช่วงเวลา (Period)
            </label>
            <select
              suppressHydrationWarning
              value={period}
              onChange={(e) => setPeriod(e.target.value)}
              className="w-full border border-slate-200 rounded-sm px-3 py-2 text-sm bg-white"
            >
              {PERIODS.map((p) => (
                <option key={p} value={p}>
                  {p}
                </option>
              ))}
            </select>
          </div>
          <button
            suppressHydrationWarning
            onClick={generate}
            disabled={isProcessing}
            className="inline-flex items-center justify-center gap-1.5 rounded-sm bg-[#1e3a5f] hover:bg-[#142a45] disabled:bg-slate-300 text-white text-sm font-medium px-4 py-2 transition-colors h-[38px]"
          >
            <Sparkles className="h-4 w-4" />
            สร้างรายงาน AI
          </button>
        </div>
      </section>

      {/* Processing */}
      {step >= 0 && (
        <section className="bg-white border border-slate-200 rounded-sm overflow-hidden">
          <div className="border-b border-slate-100 px-5 py-3 flex items-center gap-2">
            <Loader2 className="h-4 w-4 text-blue-600 animate-spin" />
            <span className="text-sm font-semibold text-slate-900">
              กำลังสร้างรายงานสำหรับ {scope} · {period}
            </span>
          </div>
          <ul className="px-5 py-4 space-y-2">
            {GEN_STEPS.map((s, i) => {
              const done =
                step > i || (i === GEN_STEPS.length - 1 && result !== null);
              const active = step === i && !done;
              return (
                <li
                  key={i}
                  className={`flex items-center gap-2 text-sm transition-opacity ${i > step ? "opacity-40" : ""}`}
                >
                  {done ? (
                    <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
                  ) : active ? (
                    <Loader2 className="h-4 w-4 text-blue-600 animate-spin shrink-0" />
                  ) : (
                    <div className="h-4 w-4 rounded-full border border-slate-300 shrink-0" />
                  )}
                  <span
                    className={
                      done
                        ? "text-emerald-700 font-medium"
                        : active
                          ? "text-slate-900 font-medium"
                          : "text-slate-500"
                    }
                  >
                    {s.label}
                  </span>
                </li>
              );
            })}
          </ul>
        </section>
      )}

      {error && (
        <div className="border border-red-300 bg-red-50 rounded-sm p-4 text-sm text-red-800">
          {error}
        </div>
      )}

      {/* Result */}
      {result && (
        <SummaryDisplay summary={result} source={source} />
      )}

      {/* Library */}
      <section className="bg-white border border-slate-200 rounded-sm overflow-hidden">
        <div className="border-b border-slate-100 px-5 py-3 flex items-center gap-2">
          <Library className="h-4 w-4 text-slate-500" />
          <h2 className="text-sm font-semibold text-slate-900">
            คลังรายงานที่จัดทำไว้แล้ว ({library.length})
          </h2>
        </div>
        <ul className="divide-y divide-slate-100">
          {library.map((s) => (
            <li
              key={s.id}
              className="px-5 py-3 hover:bg-slate-50 cursor-pointer"
              onClick={() => openExisting(s)}
            >
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0 flex-1">
                  <div className="text-sm font-semibold text-slate-900">
                    {s.scope}
                  </div>
                  <div className="text-xs text-slate-500 mt-0.5">
                    {s.period} · จัดทำเมื่อ {new Date(s.generatedAt).toLocaleDateString("th-TH")}
                  </div>
                  <div className="text-xs text-slate-600 mt-1.5 line-clamp-2">
                    {s.headline}
                  </div>
                </div>
                <button
                  suppressHydrationWarning
                  className="text-[11px] rounded-sm border border-slate-200 hover:border-[#1e3a5f] hover:bg-blue-50 px-2 py-1 shrink-0"
                >
                  เปิดดู
                </button>
              </div>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}

function SummaryDisplay({
  summary,
  source,
}: {
  summary: ExecutiveSummary;
  source: "library" | "ai" | null;
}) {
  // Color for bars by value
  const maxData = Math.max(...summary.data.map((d) => d.value));
  return (
    <section className="bg-white border border-slate-200 rounded-sm overflow-hidden">
      <div className="border-b border-slate-100 px-5 py-3 flex items-center justify-between gap-2 bg-[#1e3a5f] text-white">
        <div className="flex items-center gap-2">
          <BookOpen className="h-4 w-4 text-[#d4a017]" />
          <span className="text-sm font-semibold">
            รายงานผู้บริหาร · {summary.scope}
          </span>
          <span className="text-xs text-blue-100">· {summary.period}</span>
        </div>
        {source === "library" ? (
          <span className="text-[10px] font-semibold uppercase tracking-wider bg-white/10 px-1.5 py-0.5 rounded-sm border border-white/20">
            จากคลังรายงาน
          </span>
        ) : source === "ai" ? (
          <span className="text-[10px] font-semibold uppercase tracking-wider bg-[#d4a017]/30 px-1.5 py-0.5 rounded-sm border border-[#d4a017]/50 text-[#d4a017]">
            สร้างใหม่โดย AI
          </span>
        ) : null}
      </div>

      <div className="p-5 space-y-5">
        {/* Headline */}
        <div className="border-l-4 border-[#d4a017] pl-4">
          <div className="text-[10px] font-semibold uppercase tracking-wider text-[#b8860b] mb-1">
            หัวข้อหลัก (Headline)
          </div>
          <div className="text-base font-bold text-slate-900 leading-snug">
            {summary.headline}
          </div>
        </div>

        {/* Key findings */}
        <div>
          <div className="text-[10px] font-semibold uppercase tracking-wider text-slate-500 mb-2">
            ประเด็นสำคัญ (Key Findings)
          </div>
          <ul className="space-y-1.5">
            {summary.keyFindings.map((f, i) => (
              <li
                key={i}
                className="text-sm text-slate-800 leading-relaxed flex gap-2"
              >
                <span className="text-[#1e3a5f] font-bold shrink-0">
                  {(i + 1).toString().padStart(2, "0")}.
                </span>
                <span>{f}</span>
              </li>
            ))}
          </ul>
        </div>

        {/* Trends */}
        <div>
          <div className="text-[10px] font-semibold uppercase tracking-wider text-slate-500 mb-2">
            แนวโน้มสำคัญ
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2">
            {summary.trends.map((t) => (
              <TrendChip key={t.metric} trend={t} />
            ))}
          </div>
        </div>

        {/* Chart */}
        <div>
          <div className="text-[10px] font-semibold uppercase tracking-wider text-slate-500 mb-2">
            ข้อมูลประกอบ
          </div>
          <div className="h-56">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={summary.data}
                margin={{ top: 8, right: 8, left: -10, bottom: 30 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis
                  dataKey="label"
                  tick={{ fontSize: 10, fill: "#64748b" }}
                  angle={-20}
                  textAnchor="end"
                  height={50}
                  stroke="#cbd5e1"
                />
                <YAxis
                  tick={{ fontSize: 10, fill: "#64748b" }}
                  stroke="#cbd5e1"
                  width={50}
                />
                <Tooltip
                  contentStyle={{
                    fontSize: 11,
                    borderRadius: 2,
                    border: "1px solid #e2e8f0",
                  }}
                />
                <Bar dataKey="value" radius={[2, 2, 0, 0]}>
                  {summary.data.map((d, i) => (
                    <Cell
                      key={i}
                      fill={d.value > maxData * 0.7 ? "#dc2626" : d.value > maxData * 0.4 ? "#d4a017" : "#1e3a5f"}
                    />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Recommendations */}
        <div className="bg-amber-50 border border-amber-200 rounded-sm p-4">
          <div className="text-[10px] font-semibold uppercase tracking-wider text-amber-800 mb-2 flex items-center gap-1">
            <Lightbulb className="h-3 w-3" />
            ข้อเสนอแนะจาก AI
          </div>
          <ul className="space-y-1.5">
            {summary.recommendations.map((r, i) => (
              <li
                key={i}
                className="text-sm text-amber-900 leading-relaxed flex gap-2"
              >
                <span className="text-amber-700 shrink-0 font-bold">•</span>
                <span>{r}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </section>
  );
}

function TrendChip({ trend }: { trend: SummaryTrend }) {
  const s = DIR_STYLES[trend.direction];
  const Icon = s.icon;
  return (
    <div className="rounded-sm border border-slate-200 bg-slate-50 px-3 py-2 flex items-center justify-between gap-2">
      <div className="text-xs font-medium text-slate-700 min-w-0">
        {trend.metric}
      </div>
      <div className={`text-xs font-bold inline-flex items-center gap-1 tabular-nums ${s.color}`}>
        <Icon className="h-3.5 w-3.5" />
        {trend.change >= 0 ? "+" : ""}
        {trend.change.toFixed(1)}%
      </div>
    </div>
  );
}
