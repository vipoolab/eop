"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import {
  STANDARD_LABELS,
  STANDARD_DESCRIPTIONS,
  STANDARD_COLORS,
  type ComplianceStandard,
} from "@/features/compliance/types";

interface Template {
  id: string;
  standard: string;
  code: string;
  name: string;
  version: string;
  itemCount: number;
}
interface Unit {
  id: string;
  code: string;
  name: string;
  level: string;
}

export function NewReportForm({ templates, units }: { templates: Template[]; units: Unit[] }) {
  const router = useRouter();
  const [templateId, setTemplateId] = useState("");
  const [period, setPeriod] = useState("ไตรมาส 2/2569");
  const [unitId, setUnitId] = useState("");
  const [dueDate, setDueDate] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const selected = templates.find((t) => t.id === templateId);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/compliance/reports", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          templateId,
          period,
          unitId: unitId || null,
          dueDate: dueDate || null,
        }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) throw new Error(data.message);
      router.push(`/compliance/reports/${data.data.id}`);
      router.refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : "เกิดข้อผิดพลาด");
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <div>
        <label className="block text-sm font-medium text-slate-700 mb-2">
          เลือกมาตรฐาน *
        </label>
        <div className="grid grid-cols-1 gap-2">
          {templates.map((t) => {
            const std = t.standard as ComplianceStandard;
            return (
              <button
                key={t.id}
                type="button"
                onClick={() => setTemplateId(t.id)}
                className={`rounded-lg border p-3 text-left transition-all ${
                  templateId === t.id
                    ? "border-blue-500 bg-blue-50/50 ring-2 ring-blue-200"
                    : "border-slate-200 bg-white hover:border-slate-300"
                }`}
              >
                <div className="flex items-center gap-2 mb-1">
                  <span className={`text-[10px] px-1.5 py-0.5 rounded border font-semibold ${STANDARD_COLORS[std]}`}>
                    {STANDARD_LABELS[std]}
                  </span>
                  <span className="font-mono text-[11px] text-slate-500">{t.code}</span>
                  <span className="text-[10px] text-slate-500">v{t.version}</span>
                  <span className="ml-auto text-[10px] text-slate-500">
                    {t.itemCount} ข้อ
                  </span>
                </div>
                <div className="text-sm font-medium text-slate-900">{t.name}</div>
                <div className="text-[11px] text-slate-500">{STANDARD_DESCRIPTIONS[std]}</div>
              </button>
            );
          })}
        </div>
      </div>

      <div className="grid grid-cols-3 gap-3">
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">
            ช่วงเวลา *
          </label>
          <input
            type="text"
            required
            value={period}
            onChange={(e) => setPeriod(e.target.value)}
            placeholder="ไตรมาส 2/2569"
            className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">
            ⏰ ครบกำหนดส่ง
          </label>
          <input
            type="date"
            value={dueDate}
            onChange={(e) => setDueDate(e.target.value)}
            className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">
            หน่วยงาน
          </label>
          <select
            value={unitId}
            onChange={(e) => setUnitId(e.target.value)}
            className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm bg-white"
          >
            <option value="">— ภาพรวม —</option>
            {units.map((u) => (
              <option key={u.id} value={u.id}>
                {u.code} — {u.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {selected && (
        <div className="rounded-md bg-blue-50 border border-blue-200 p-3 text-xs text-blue-800">
          ระบบจะสร้างรายงานพร้อม <strong>{selected.itemCount}</strong> คำถามให้กรอก
          — เริ่มกรอกได้ทันทีในหน้า detail
        </div>
      )}

      {error && (
        <div className="rounded-md bg-rose-50 border border-rose-200 px-3 py-2 text-xs text-rose-700">
          {error}
        </div>
      )}

      <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
        <button
          type="button"
          onClick={() => router.back()}
          className="px-4 py-2 text-sm text-slate-600 hover:text-slate-900"
        >
          ยกเลิก
        </button>
        <button
          type="submit"
          disabled={loading || !templateId || !period}
          className="inline-flex items-center gap-2 rounded-sm bg-[#1e3a5f] px-4 py-2 text-sm font-semibold text-white hover:bg-[#142a45] border border-[#142a45] disabled:opacity-50"
        >
          {loading && <Loader2 className="h-4 w-4 animate-spin" />}
          สร้างรายงาน
        </button>
      </div>
    </form>
  );
}
