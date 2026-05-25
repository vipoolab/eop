"use client";

import { useState, useEffect } from "react";
import { Target, Plus, X, Sparkles, BarChart3, FileCheck, LayoutList } from "lucide-react";
import type { KpiDefinition, KpiType } from "@/lib/commands/types";
import type { ReportForm } from "@/lib/report-forms/types";

interface Props {
  kpis: KpiDefinition[];
  suggestedKpis: KpiDefinition[];
  onChange: (kpis: KpiDefinition[]) => void;
}

const FREQUENCY_LABELS = {
  DAILY: "รายวัน",
  WEEKLY: "รายสัปดาห์",
  MONTHLY: "รายเดือน",
  END_OF_PERIOD: "สิ้นสุดงวด",
} as const;

export function KpiStep({ kpis, suggestedKpis, onChange }: Props) {
  const [forms, setForms] = useState<ReportForm[]>([]);
  useEffect(() => {
    fetch("/api/report-forms")
      .then((r) => r.json())
      .then((j) => setForms((j.data ?? []).filter((f: ReportForm) => f.isActive)))
      .catch(() => {});
  }, []);

  function add(type: KpiType) {
    const newKpi: KpiDefinition = {
      id: `kpi-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      type,
      metric: type === "QUANTITATIVE" ? "ระบุตัวชี้วัด" : "รายงานผลการปฏิบัติ",
      unit: type === "QUANTITATIVE" ? "ครั้ง" : undefined,
      targetTotal: type === "QUANTITATIVE" ? 100 : undefined,
      reportFrequency: type === "QUANTITATIVE" ? "DAILY" : "END_OF_PERIOD",
      description: "",
    };
    onChange([...kpis, newKpi]);
  }

  function addFromSuggestion(s: KpiDefinition) {
    if (kpis.some((k) => k.id === s.id)) return;
    onChange([...kpis, { ...s }]);
  }

  function update(id: string, patch: Partial<KpiDefinition>) {
    onChange(kpis.map((k) => (k.id === id ? { ...k, ...patch } : k)));
  }

  function remove(id: string) {
    onChange(kpis.filter((k) => k.id !== id));
  }

  const unusedSuggestions = suggestedKpis.filter(
    (s) => !kpis.some((k) => k.id === s.id)
  );

  return (
    <div className="space-y-5">
      <div>
        <div className="text-[11px] font-semibold uppercase tracking-wider text-[#b8860b] mb-1">
          ขั้นที่ ๕
        </div>
        <h2 className="text-lg font-semibold text-slate-900">
          ตัวชี้วัด (KPI)
        </h2>
        <p className="text-sm text-slate-600 mt-1">
          AI เลือก KPI ที่เหมาะสมให้แล้ว — แก้ไข เพิ่ม หรือลบได้ตามต้องการ KPI
          จะถูก <span className="font-semibold">auto-distribute</span>{" "}
          ไปยังทุกหน่วยที่ได้รับคำสั่ง
        </p>
      </div>

      {/* AI Suggestions — only show if there are unused */}
      {unusedSuggestions.length > 0 && (
        <div className="rounded-sm border border-amber-200 bg-amber-50 p-3">
          <div className="flex items-center justify-between gap-2 mb-2">
            <div className="flex items-center gap-2 text-sm font-semibold text-amber-900">
              <Sparkles className="h-4 w-4" />
              AI แนะนำ KPI {unusedSuggestions.length} ตัว ที่ยังไม่ได้เลือก
            </div>
            <div className="text-[11px] text-amber-700">
              คลิกเพื่อเพิ่ม
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
            {unusedSuggestions.map((s) => (
              <button
                key={s.id}
                type="button"
                suppressHydrationWarning
                onClick={() => addFromSuggestion(s)}
                className="text-left rounded-sm border border-amber-300 bg-white hover:border-amber-500 hover:shadow-sm p-2.5"
              >
                <div className="flex items-center gap-1.5 mb-1">
                  {s.type === "QUANTITATIVE" ? (
                    <BarChart3 className="h-3 w-3 text-blue-600" />
                  ) : (
                    <FileCheck className="h-3 w-3 text-emerald-600" />
                  )}
                  <span className="text-[10px] font-semibold uppercase tracking-wide text-slate-500">
                    {s.type === "QUANTITATIVE" ? "เชิงปริมาณ" : "เชิงคุณภาพ"}
                  </span>
                  <Plus className="h-3 w-3 text-slate-400 ml-auto" />
                </div>
                <div className="text-sm font-semibold text-slate-900">{s.metric}</div>
                {s.type === "QUANTITATIVE" && (
                  <div className="text-xs text-slate-600 mt-0.5">
                    เป้า {s.targetTotal?.toLocaleString() ?? "—"} {s.unit ?? ""}
                  </div>
                )}
                {s.description && (
                  <div className="text-[11px] text-slate-500 mt-0.5 line-clamp-2">
                    {s.description}
                  </div>
                )}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Existing KPIs */}
      <div className="space-y-3">
        {kpis.length === 0 && (
          <div className="rounded-sm border border-dashed border-slate-300 bg-slate-50 p-8 text-center">
            <Target className="h-8 w-8 mx-auto text-slate-300 mb-2" />
            <div className="text-sm text-slate-500">
              ยังไม่มี KPI — เพิ่มเองหรือเลือกจากที่ AI แนะนำ
            </div>
          </div>
        )}
        {kpis.map((k, idx) => (
          <KpiCard
            key={k.id}
            idx={idx + 1}
            kpi={k}
            forms={forms}
            onChange={(patch) => update(k.id, patch)}
            onRemove={() => remove(k.id)}
          />
        ))}
      </div>

      {/* Add buttons */}
      <div className="flex gap-2 pt-2">
        <button
          type="button"
          suppressHydrationWarning
          onClick={() => add("QUANTITATIVE")}
          className="inline-flex items-center gap-1.5 text-sm rounded-sm bg-white border border-slate-300 hover:bg-slate-50 hover:border-slate-400 px-3 py-2"
        >
          <BarChart3 className="h-4 w-4 text-blue-600" />
          <Plus className="h-3 w-3" />
          KPI เชิงปริมาณ
        </button>
        <button
          type="button"
          suppressHydrationWarning
          onClick={() => add("QUALITATIVE")}
          className="inline-flex items-center gap-1.5 text-sm rounded-sm bg-white border border-slate-300 hover:bg-slate-50 hover:border-slate-400 px-3 py-2"
        >
          <FileCheck className="h-4 w-4 text-emerald-600" />
          <Plus className="h-3 w-3" />
          KPI เชิงคุณภาพ
        </button>
      </div>
    </div>
  );
}

interface KpiCardProps {
  idx: number;
  kpi: KpiDefinition;
  forms: ReportForm[];
  onChange: (patch: Partial<KpiDefinition>) => void;
  onRemove: () => void;
}

function KpiCard({ idx, kpi, forms, onChange, onRemove }: KpiCardProps) {
  const typeStyle =
    kpi.type === "QUANTITATIVE"
      ? "border-blue-300 bg-blue-50"
      : "border-emerald-300 bg-emerald-50";

  return (
    <div className={`rounded-sm border-2 p-3 ${typeStyle}`}>
      <div className="flex items-center justify-between gap-2 mb-3">
        <div className="flex items-center gap-2">
          <div className="text-[10px] font-semibold uppercase tracking-wider text-slate-600">
            KPI #{idx}
          </div>
          <div
            className={`text-[10px] font-semibold uppercase tracking-wider px-1.5 py-0.5 rounded-sm ${
              kpi.type === "QUANTITATIVE"
                ? "bg-blue-200 text-blue-900"
                : "bg-emerald-200 text-emerald-900"
            }`}
          >
            {kpi.type === "QUANTITATIVE" ? "เชิงปริมาณ" : "เชิงคุณภาพ"}
          </div>
        </div>
        <button
          type="button"
          suppressHydrationWarning
          onClick={onRemove}
          className="text-slate-500 hover:text-red-600 p-1"
          aria-label="ลบ"
        >
          <X className="h-3.5 w-3.5" />
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        <div className="md:col-span-2">
          <label className="text-[10px] font-semibold uppercase text-slate-600 mb-0.5 block">
            ตัวชี้วัด (Metric)
          </label>
          <input
            type="text"
            value={kpi.metric}
            onChange={(e) => onChange({ metric: e.target.value })}
            className="w-full rounded-sm border border-slate-300 bg-white px-2.5 py-1.5 text-sm focus:border-[#1e3a5f] focus:outline-none"
          />
        </div>
        {kpi.type === "QUANTITATIVE" && (
          <>
            <div>
              <label className="text-[10px] font-semibold uppercase text-slate-600 mb-0.5 block">
                เป้าหมายรวม
              </label>
              <input
                type="number"
                value={kpi.targetTotal ?? ""}
                onChange={(e) => onChange({ targetTotal: Number(e.target.value) })}
                className="w-full rounded-sm border border-slate-300 bg-white px-2.5 py-1.5 text-sm focus:border-[#1e3a5f] focus:outline-none"
              />
            </div>
            <div>
              <label className="text-[10px] font-semibold uppercase text-slate-600 mb-0.5 block">
                หน่วย
              </label>
              <input
                type="text"
                value={kpi.unit ?? ""}
                onChange={(e) => onChange({ unit: e.target.value })}
                placeholder="ครั้ง / จุด / ราย / คน"
                className="w-full rounded-sm border border-slate-300 bg-white px-2.5 py-1.5 text-sm focus:border-[#1e3a5f] focus:outline-none"
              />
            </div>
          </>
        )}
        <div className={kpi.type === "QUANTITATIVE" ? "md:col-span-2" : "md:col-span-2"}>
          <label className="text-[10px] font-semibold uppercase text-slate-600 mb-0.5 block">
            ความถี่การรายงาน
          </label>
          <select
            value={kpi.reportFrequency}
            onChange={(e) =>
              onChange({ reportFrequency: e.target.value as KpiDefinition["reportFrequency"] })
            }
            className="w-full rounded-sm border border-slate-300 bg-white px-2.5 py-1.5 text-sm focus:border-[#1e3a5f] focus:outline-none"
          >
            {(Object.keys(FREQUENCY_LABELS) as (keyof typeof FREQUENCY_LABELS)[]).map(
              (f) => (
                <option key={f} value={f}>
                  {FREQUENCY_LABELS[f]}
                </option>
              )
            )}
          </select>
        </div>
        {/* Form picker — QUALITATIVE only */}
        {kpi.type === "QUALITATIVE" && (
          <div className="md:col-span-2">
            <label className="text-[10px] font-semibold uppercase text-slate-600 mb-0.5 block">
              แบบฟอร์มรายงาน
            </label>
            {forms.length === 0 ? (
              <div className="rounded-sm border border-dashed border-slate-300 bg-slate-50 px-3 py-2 text-xs text-slate-400">
                ไม่พบแบบฟอร์ม —{" "}
                <a href="/forms/new" target="_blank" rel="noreferrer" className="text-[#1e3a5f] underline">
                  สร้างแบบฟอร์มใหม่
                </a>
              </div>
            ) : (
              <div className="space-y-1.5">
                <select
                  value={kpi.reportFormId ?? ""}
                  onChange={(e) => onChange({ reportFormId: e.target.value || undefined })}
                  className="w-full rounded-sm border border-slate-300 bg-white px-2.5 py-1.5 text-sm focus:border-[#1e3a5f] focus:outline-none"
                >
                  <option value="">— ไม่เลือก (รายงานอิสระ) —</option>
                  {forms.map((f) => (
                    <option key={f.id} value={f.id}>
                      {f.name} ({f.category})
                    </option>
                  ))}
                </select>
                {kpi.reportFormId && (
                  <div className="flex items-center gap-1.5 text-[11px] text-emerald-700">
                    <LayoutList className="h-3 w-3" />
                    {forms.find((f) => f.id === kpi.reportFormId)?.fields.length ?? 0} ช่องกรอก ·{" "}
                    <a
                      href={`/forms/${kpi.reportFormId}`}
                      target="_blank"
                      rel="noreferrer"
                      className="underline"
                    >
                      ดูตัวอย่างแบบฟอร์ม
                    </a>
                  </div>
                )}
              </div>
            )}
          </div>
        )}
        {kpi.description !== undefined && (
          <div className="md:col-span-2">
            <label className="text-[10px] font-semibold uppercase text-slate-600 mb-0.5 block">
              คำอธิบาย (optional)
            </label>
            <textarea
              value={kpi.description ?? ""}
              onChange={(e) => onChange({ description: e.target.value })}
              rows={2}
              className="w-full rounded-sm border border-slate-300 bg-white px-2.5 py-1.5 text-sm focus:border-[#1e3a5f] focus:outline-none resize-y"
            />
          </div>
        )}
      </div>
    </div>
  );
}
