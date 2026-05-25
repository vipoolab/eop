"use client";

import { Calendar, Clock, Check } from "lucide-react";

interface Props {
  effectiveDate: string;
  dueDate: string;
  onChange: (s: string, d: string) => void;
  /** Did AI pre-fill these dates? */
  aiPrefilled?: boolean;
  /** AI-suggested reportInstruction text (from drafted letter) */
  aiSuggestedFrom?: string;
}

function calcDays(start: string, end: string): number {
  const s = new Date(start).getTime();
  const e = new Date(end).getTime();
  return Math.max(0, Math.ceil((e - s) / (24 * 60 * 60 * 1000)));
}

export function ScheduleStep({ effectiveDate, dueDate, onChange, aiPrefilled, aiSuggestedFrom }: Props) {
  const days = calcDays(effectiveDate, dueDate);
  const invalid = effectiveDate > dueDate;

  return (
    <div className="space-y-5">
      <div>
        <div className="text-[11px] font-semibold uppercase tracking-wider text-[#b8860b] mb-1">
          ขั้นที่ ๔
        </div>
        <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100">
          ระยะเวลาดำเนินการ
        </h2>
        <p className="text-sm text-slate-600 dark:text-slate-300 mt-1">
          KPI ที่กำหนดในขั้นถัดไปจะถูกผูกกับช่วงเวลานี้
        </p>
      </div>

      {/* AI Pre-fill banner */}
      {aiPrefilled && (
        <div className="rounded-sm border-2 border-emerald-300 dark:border-emerald-700 bg-emerald-50 dark:bg-emerald-900/20 p-3.5">
          <div className="flex items-start gap-2.5">
            <Check className="h-4 w-4 text-emerald-700 dark:text-emerald-400 shrink-0 mt-0.5" />
            <div className="flex-1 text-sm">
              <div className="font-semibold text-emerald-900 dark:text-emerald-200">
                AI Engine กำหนดระยะเวลาให้แล้ว ({days} วัน)
              </div>
              {aiSuggestedFrom && (
                <div className="text-xs text-emerald-800 dark:text-emerald-300 mt-1">
                  อ้างอิงจากร่างหนังสือ: <span className="italic">"{aiSuggestedFrom}"</span>
                </div>
              )}
              <div className="text-xs text-emerald-700 dark:text-emerald-400 mt-1.5">
                💡 ตรวจสอบและแก้ไขได้หากไม่เหมาะสม
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="text-xs font-semibold text-slate-700 mb-1.5 flex items-center gap-1">
            <Calendar className="h-3 w-3" />
            วันเริ่มมีผล (Effective Date)
          </label>
          <input
            type="date"
            value={effectiveDate}
            onChange={(e) => onChange(e.target.value, dueDate)}
            className="w-full rounded-sm border border-slate-300 bg-white px-3 py-2 text-sm focus:border-[#1e3a5f] focus:outline-none"
          />
        </div>
        <div>
          <label className="text-xs font-semibold text-slate-700 mb-1.5 flex items-center gap-1">
            <Clock className="h-3 w-3" />
            วันสิ้นสุด / ครบกำหนด (Due Date)
          </label>
          <input
            type="date"
            value={dueDate}
            onChange={(e) => onChange(effectiveDate, e.target.value)}
            className="w-full rounded-sm border border-slate-300 bg-white px-3 py-2 text-sm focus:border-[#1e3a5f] focus:outline-none"
          />
        </div>
      </div>

      {invalid && (
        <div className="rounded-sm border border-red-300 bg-red-50 p-3 text-sm text-red-900">
          วันสิ้นสุดต้องอยู่หลังวันเริ่ม
        </div>
      )}

      <div className="rounded-sm border border-slate-200 bg-slate-50 p-4">
        <div className="text-xs text-slate-500 mb-1">ระยะเวลารวม</div>
        <div className="text-2xl font-bold text-slate-900">
          {days} วัน
        </div>
        <div className="text-xs text-slate-600 mt-1">
          {new Date(effectiveDate).toLocaleDateString("th-TH", {
            weekday: "long",
            year: "numeric",
            month: "long",
            day: "numeric",
          })}{" "}
          ถึง{" "}
          {new Date(dueDate).toLocaleDateString("th-TH", {
            weekday: "long",
            year: "numeric",
            month: "long",
            day: "numeric",
          })}
        </div>
      </div>

      {/* Quick presets */}
      <div className="flex flex-wrap gap-2">
        <div className="text-[11px] text-slate-500 mr-2 self-center">
          ระยะเวลาด่วน:
        </div>
        {[
          { label: "๗ วัน", days: 7 },
          { label: "๑๕ วัน", days: 15 },
          { label: "๓๐ วัน", days: 30 },
          { label: "๖๐ วัน", days: 60 },
          { label: "๙๐ วัน", days: 90 },
        ].map((p) => (
          <button
            key={p.days}
            type="button"
            suppressHydrationWarning
            onClick={() => {
              const start = new Date(effectiveDate);
              const end = new Date(start.getTime() + p.days * 24 * 60 * 60 * 1000);
              onChange(effectiveDate, end.toISOString().slice(0, 10));
            }}
            className="text-xs px-3 py-1.5 border border-slate-300 rounded-sm hover:bg-slate-50 hover:border-slate-400"
          >
            {p.label}
          </button>
        ))}
      </div>
    </div>
  );
}
