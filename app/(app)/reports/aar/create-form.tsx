"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, AlertCircle, PlusCircle, ChevronDown, ChevronUp } from "lucide-react";

export function AarCreateForm({
  missions,
}: {
  missions: Array<{ id: string; code: string; title: string }>;
}) {
  const router = useRouter();
  const [expanded, setExpanded] = useState(false);
  const [missionId, setMissionId] = useState("");
  const [whatWorked, setWhatWorked] = useState("");
  const [whatDidNot, setWhatDidNot] = useState("");
  const [lessonsLearned, setLessonsLearned] = useState("");
  const [recommendations, setRecommendations] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submit() {
    if (whatWorked.length < 5 || whatDidNot.length < 5 || lessonsLearned.length < 5) {
      setError("กรอกทั้ง 3 ช่องอย่างน้อย 5 ตัวอักษร");
      return;
    }
    setError(null);
    setLoading(true);
    try {
      const res = await fetch("/api/reports/aar", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          missionId: missionId || null,
          whatWorked,
          whatDidNot,
          lessonsLearned,
          recommendations: recommendations
            .split("\n")
            .map((s) => s.trim())
            .filter((s) => s.length > 0),
        }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.message || "สร้าง AAR ไม่สำเร็จ");
      }
      setMissionId("");
      setWhatWorked("");
      setWhatDidNot("");
      setLessonsLearned("");
      setRecommendations("");
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
        สร้าง AAR ใหม่
        <ChevronDown className="h-4 w-4" />
      </button>
    );
  }

  return (
    <div className="rounded-xl border-2 border-emerald-200 bg-emerald-50/50 p-4">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-semibold text-emerald-900">
          📝 สร้าง After Action Review
        </h3>
        <button
          onClick={() => setExpanded(false)}
          className="text-emerald-700 hover:text-emerald-900"
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

      <div className="mb-3">
        <label className="block text-[10px] font-semibold text-slate-600 uppercase tracking-wider mb-1">
          เลือก Mission (ถ้ามี)
        </label>
        <select
          value={missionId}
          onChange={(e) => setMissionId(e.target.value)}
          className="w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm"
        >
          <option value="">(AAR แบบทั่วไป — ไม่ผูก Mission)</option>
          {missions.map((m) => (
            <option key={m.id} value={m.id}>
              {m.code} — {m.title}
            </option>
          ))}
        </select>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-3">
        <div>
          <label className="block text-[10px] font-semibold text-emerald-700 uppercase tracking-wider mb-1">
            ✓ สิ่งที่ดี
          </label>
          <textarea
            value={whatWorked}
            onChange={(e) => setWhatWorked(e.target.value)}
            placeholder="อะไรที่ทำได้ดี ควรรักษาไว้"
            rows={4}
            className="w-full rounded-md border border-emerald-300 bg-white px-3 py-2 text-sm"
          />
        </div>
        <div>
          <label className="block text-[10px] font-semibold text-rose-700 uppercase tracking-wider mb-1">
            ✗ สิ่งที่ต้องปรับ
          </label>
          <textarea
            value={whatDidNot}
            onChange={(e) => setWhatDidNot(e.target.value)}
            placeholder="อะไรที่ไม่ดี ต้องแก้"
            rows={4}
            className="w-full rounded-md border border-rose-300 bg-white px-3 py-2 text-sm"
          />
        </div>
        <div>
          <label className="block text-[10px] font-semibold text-amber-700 uppercase tracking-wider mb-1">
            📚 บทเรียน
          </label>
          <textarea
            value={lessonsLearned}
            onChange={(e) => setLessonsLearned(e.target.value)}
            placeholder="บทเรียนสำคัญที่ได้"
            rows={4}
            className="w-full rounded-md border border-amber-300 bg-white px-3 py-2 text-sm"
          />
        </div>
      </div>

      <div className="mb-3">
        <label className="block text-[10px] font-semibold text-slate-600 uppercase tracking-wider mb-1">
          ข้อเสนอแนะ (กดเอนเตอร์ขึ้นบรรทัดใหม่)
        </label>
        <textarea
          value={recommendations}
          onChange={(e) => setRecommendations(e.target.value)}
          placeholder="ข้อเสนอแต่ละข้อ ขึ้นบรรทัดใหม่"
          rows={3}
          className="w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm"
        />
      </div>

      <div className="flex justify-end">
        <button
          onClick={submit}
          disabled={loading}
          className="inline-flex items-center gap-1 rounded-md bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 text-sm font-semibold disabled:opacity-50"
        >
          {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <PlusCircle className="h-4 w-4" />}
          บันทึก AAR
        </button>
      </div>
    </div>
  );
}
