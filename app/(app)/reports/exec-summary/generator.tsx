"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Sparkles, AlertCircle } from "lucide-react";

export function ExecSummaryGenerator() {
  const router = useRouter();
  const [scope, setScope] = useState<"NATIONAL" | "REGION" | "UNIT">("NATIONAL");
  const [period, setPeriod] = useState(() => {
    const now = new Date();
    const yearBe = now.getFullYear() + 543;
    const month = now.getMonth() + 1;
    const quarter = Math.ceil(month / 3);
    return `Q${quarter}/${yearBe}`;
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function generate() {
    setError(null);
    setLoading(true);
    try {
      const res = await fetch("/api/reports/exec-summary", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ scope, period }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.message || "สร้างสรุปไม่สำเร็จ");
      }
      router.refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : "เกิดข้อผิดพลาด");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="rounded-xl border-2 border-blue-200 bg-gradient-to-br from-blue-50 to-violet-50 p-4">
      <div className="flex items-center justify-between mb-3">
        <div>
          <h3 className="text-sm font-semibold text-blue-900">
            ✨ สร้างสรุปใหม่ด้วย AI
          </h3>
          <p className="text-[11px] text-blue-700 mt-0.5">
            AI ดึงข้อมูล Mission · KPI · Command · Incident → สรุปให้อ่านง่าย
          </p>
        </div>
      </div>

      {error && (
        <div className="rounded-md bg-rose-50 border border-rose-200 px-3 py-2 text-xs text-rose-700 mb-3 flex items-start gap-2">
          <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-3 items-end">
        <div>
          <label className="block text-[10px] font-semibold text-slate-600 uppercase tracking-wider mb-1">
            ขอบเขต
          </label>
          <select
            value={scope}
            onChange={(e) => setScope(e.target.value as typeof scope)}
            className="w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm"
          >
            <option value="NATIONAL">ระดับชาติ</option>
            <option value="REGION">ระดับภาค</option>
            <option value="UNIT">ระดับหน่วย</option>
          </select>
        </div>
        <div>
          <label className="block text-[10px] font-semibold text-slate-600 uppercase tracking-wider mb-1">
            ช่วงเวลา
          </label>
          <input
            type="text"
            value={period}
            onChange={(e) => setPeriod(e.target.value)}
            placeholder="Q2/2569"
            className="w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm"
          />
        </div>
        <button
          onClick={generate}
          disabled={loading}
          className="inline-flex items-center justify-center gap-2 rounded-md bg-slate-900 text-white px-4 py-2 text-sm font-semibold hover:bg-slate-700 disabled:opacity-50"
        >
          {loading ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Sparkles className="h-4 w-4" />
          )}
          {loading ? "AI กำลังสรุป..." : "สร้างสรุป"}
        </button>
      </div>
    </div>
  );
}
