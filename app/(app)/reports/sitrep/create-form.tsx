"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, AlertCircle, PlusCircle, ChevronDown, ChevronUp } from "lucide-react";

export function SitrepCreateForm({
  units,
}: {
  units: Array<{ id: string; code: string; name: string }>;
}) {
  const router = useRouter();
  const [expanded, setExpanded] = useState(false);
  const [frequency, setFrequency] = useState<"DAILY" | "WEEKLY" | "MONTHLY">(
    "DAILY"
  );
  const [unitId, setUnitId] = useState("");
  const [summary, setSummary] = useState("");
  const [keyEventTitle, setKeyEventTitle] = useState("");
  const [keyEventLocation, setKeyEventLocation] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submit() {
    if (summary.length < 10) {
      setError("สรุปสถานการณ์ต้องมีอย่างน้อย 10 ตัวอักษร");
      return;
    }
    setError(null);
    setLoading(true);
    try {
      const res = await fetch("/api/reports/sitrep", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          frequency,
          unitId: unitId || null,
          summary,
          keyEvents: keyEventTitle
            ? [{ title: keyEventTitle, location: keyEventLocation || null }]
            : [],
          metrics: {},
        }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.message || "สร้างไม่สำเร็จ");
      }
      setSummary("");
      setKeyEventTitle("");
      setKeyEventLocation("");
      setExpanded(false);
      router.refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : "เกิดข้อผิดพลาด");
    } finally {
      setLoading(false);
    }
  }

  if (!expanded) {
    return (
      <button
        onClick={() => setExpanded(true)}
        className="w-full rounded-xl border-2 border-dashed border-slate-300 bg-slate-50 hover:bg-slate-100 hover:border-slate-400 p-4 text-sm text-slate-600 inline-flex items-center justify-center gap-2 transition-all"
      >
        <PlusCircle className="h-4 w-4" />
        สร้าง SITREP ใหม่
        <ChevronDown className="h-4 w-4" />
      </button>
    );
  }

  return (
    <div className="rounded-xl border-2 border-amber-200 bg-amber-50/50 p-4">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-semibold text-amber-900">📝 สร้าง SITREP ใหม่</h3>
        <button
          onClick={() => setExpanded(false)}
          className="text-amber-700 hover:text-amber-900"
        >
          <ChevronUp className="h-4 w-4" />
        </button>
      </div>

      {error && (
        <div className="rounded-md bg-rose-50 border border-rose-200 px-3 py-2 text-xs text-rose-700 mb-3 flex items-start gap-2">
          <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-3">
        <div>
          <label className="block text-[10px] font-semibold text-slate-600 uppercase tracking-wider mb-1">
            ความถี่
          </label>
          <select
            value={frequency}
            onChange={(e) => setFrequency(e.target.value as typeof frequency)}
            className="w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm"
          >
            <option value="DAILY">รายวัน</option>
            <option value="WEEKLY">รายสัปดาห์</option>
            <option value="MONTHLY">รายเดือน</option>
          </select>
        </div>
        <div>
          <label className="block text-[10px] font-semibold text-slate-600 uppercase tracking-wider mb-1">
            หน่วยงาน
          </label>
          <select
            value={unitId}
            onChange={(e) => setUnitId(e.target.value)}
            className="w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm"
          >
            <option value="">(ส่วนกลาง)</option>
            {units.map((u) => (
              <option key={u.id} value={u.id}>
                {u.code} — {u.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="mb-3">
        <label className="block text-[10px] font-semibold text-slate-600 uppercase tracking-wider mb-1">
          สรุปสถานการณ์ปัจจุบัน *
        </label>
        <textarea
          value={summary}
          onChange={(e) => setSummary(e.target.value)}
          placeholder="เช่น สถานการณ์ในพื้นที่ปกติ มีเหตุการณ์ 3 รายการ ดำเนินการตอบสนองครบ..."
          rows={4}
          className="w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm"
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-3">
        <div>
          <label className="block text-[10px] font-semibold text-slate-600 uppercase tracking-wider mb-1">
            เหตุการณ์สำคัญ (ถ้ามี)
          </label>
          <input
            type="text"
            value={keyEventTitle}
            onChange={(e) => setKeyEventTitle(e.target.value)}
            placeholder="หัวข้อเหตุการณ์"
            className="w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm"
          />
        </div>
        <div>
          <label className="block text-[10px] font-semibold text-slate-600 uppercase tracking-wider mb-1">
            สถานที่
          </label>
          <input
            type="text"
            value={keyEventLocation}
            onChange={(e) => setKeyEventLocation(e.target.value)}
            placeholder="สถานที่"
            className="w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm"
          />
        </div>
      </div>

      <div className="flex justify-end">
        <button
          onClick={submit}
          disabled={loading}
          className="inline-flex items-center gap-1 rounded-md bg-amber-600 hover:bg-amber-700 text-white px-4 py-2 text-sm font-semibold disabled:opacity-50"
        >
          {loading ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <PlusCircle className="h-4 w-4" />
          )}
          ส่ง SITREP
        </button>
      </div>
    </div>
  );
}
