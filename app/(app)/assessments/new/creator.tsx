"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Save, Send, FileText, Building2 } from "lucide-react";
import type { AssessmentCategory } from "@/lib/assessments/types";
import { ASSESSMENT_CATEGORIES } from "@/lib/assessments/types";

// Hardcoded target units (level-1 bureaus)
const TARGET_UNITS: { id: string; label: string; code: string }[] = [
  { id: "u-bch-na", label: "บช.น. (ตำรวจนครบาล)", code: "บช.น." },
  { id: "u-bch-1", label: "ภ.๑ (ตำรวจภูธรภาค ๑)", code: "ภ.๑" },
  { id: "u-bch-2", label: "ภ.๒ (ตำรวจภูธรภาค ๒)", code: "ภ.๒" },
  { id: "u-bch-3", label: "ภ.๓ (ตำรวจภูธรภาค ๓)", code: "ภ.๓" },
  { id: "u-bch-4", label: "ภ.๔ (ตำรวจภูธรภาค ๔)", code: "ภ.๔" },
  { id: "u-bch-5", label: "ภ.๕ (ตำรวจภูธรภาค ๕)", code: "ภ.๕" },
  { id: "u-bch-6", label: "ภ.๖ (ตำรวจภูธรภาค ๖)", code: "ภ.๖" },
  { id: "u-bch-7", label: "ภ.๗ (ตำรวจภูธรภาค ๗)", code: "ภ.๗" },
  { id: "u-bch-8", label: "ภ.๘ (ตำรวจภูธรภาค ๘)", code: "ภ.๘" },
  { id: "u-bch-9", label: "ภ.๙ (ตำรวจภูธรภาค ๙)", code: "ภ.๙" },
  { id: "u-bch-special-1", label: "บช.ปส. (ตำรวจปราบปรามยาเสพติด)", code: "บช.ปส." },
  { id: "u-bch-special-2", label: "บช.สอท. (ตำรวจสืบสวนอาชญากรรมทางเทคโนโลยี)", code: "บช.สอท." },
  { id: "u-bch-special-3", label: "บช.ส. (ตำรวจสันติบาลฯ)", code: "บช.ส." },
];

// Format date for date input (YYYY-MM-DD)
function toDateInputValue(iso?: string): string {
  if (!iso) {
    const d = new Date();
    return d.toISOString().split("T")[0];
  }
  return iso.split("T")[0];
}

function toISOFromDateInput(val: string): string {
  return new Date(val + "T00:00:00").toISOString();
}

export function AssessmentCreator() {
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState<AssessmentCategory>("ก.พ.ร.");
  const [instructions, setInstructions] = useState("");
  const [fileName, setFileName] = useState("");
  const [effectiveDate, setEffectiveDate] = useState(toDateInputValue());
  const [dueDate, setDueDate] = useState(toDateInputValue());
  const [selectedUnits, setSelectedUnits] = useState<string[]>([]);
  const [publishImmediately, setPublishImmediately] = useState(false);

  function toggleUnit(id: string) {
    setSelectedUnits((prev) =>
      prev.includes(id) ? prev.filter((u) => u !== id) : [...prev, id]
    );
  }

  function selectAll() {
    setSelectedUnits(TARGET_UNITS.map((u) => u.id));
  }

  function clearAll() {
    setSelectedUnits([]);
  }

  async function handleSave() {
    if (!title.trim()) {
      setError("กรุณาใส่ชื่อแบบประเมิน");
      return;
    }
    if (!effectiveDate || !dueDate) {
      setError("กรุณาระบุวันที่บังคับใช้และวันที่ครบกำหนด");
      return;
    }
    if (new Date(dueDate) <= new Date(effectiveDate)) {
      setError("วันที่ครบกำหนดต้องหลังวันที่บังคับใช้");
      return;
    }

    setSaving(true);
    setError("");
    try {
      // Fetch active persona for creator info
      const personaRes = await fetch("/api/persona");
      const personaData = await personaRes.json();
      const persona = personaData.data ?? personaData;

      const res = await fetch("/api/assessments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: title.trim(),
          description: description.trim(),
          category,
          instructions: instructions.trim(),
          fileName: fileName.trim() || undefined,
          fileType: fileName.trim() ? "application/pdf" : undefined,
          effectiveDate: toISOFromDateInput(effectiveDate),
          dueDate: toISOFromDateInput(dueDate),
          targetUnitIds: selectedUnits,
          publishImmediately,
          createdBy: persona?.id ?? "p-aide-rtp",
          createdByName: persona?.name ?? "พล.ต.ท. ณรงค์ฤทธิ์ ธรรมรัต",
          createdByTitle: persona?.role ?? "รอง ผบ.ตร.",
        }),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error ?? "บันทึกไม่สำเร็จ");
      }
      const { data } = await res.json();
      router.push(`/assessments/${data.id}`);
    } catch (e) {
      setError(e instanceof Error ? e.message : "บันทึกไม่สำเร็จ กรุณาลองใหม่");
      setSaving(false);
    }
  }

  const inputClass =
    "w-full rounded-sm border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#1e3a5f]/30 focus:border-[#1e3a5f]";
  const labelClass = "block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1";

  return (
    <div className="max-w-3xl space-y-5">
      {/* Title & Description */}
      <div className="bg-white dark:bg-slate-900 rounded-sm border border-slate-200 dark:border-slate-800 p-5 space-y-4">
        <h2 className="text-sm font-semibold text-slate-900 dark:text-slate-100 border-b border-slate-100 dark:border-slate-800 pb-2">
          ข้อมูลทั่วไป
        </h2>

        <div>
          <label className={labelClass}>ชื่อแบบประเมิน *</label>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="เช่น รายงาน ก.พ.ร. ประจำปีงบประมาณ ๒๕๗๐"
            className={inputClass}
          />
        </div>

        <div>
          <label className={labelClass}>คำอธิบาย</label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={3}
            placeholder="อธิบายวัตถุประสงค์และขอบเขตของแบบประเมินนี้"
            className={`${inputClass} resize-none`}
          />
        </div>

        <div>
          <label className={labelClass}>ประเภท *</label>
          <select
            value={category}
            onChange={(e) => setCategory(e.target.value as AssessmentCategory)}
            className={inputClass}
          >
            {ASSESSMENT_CATEGORIES.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className={labelClass}>คำแนะนำสำหรับผู้ส่ง</label>
          <textarea
            value={instructions}
            onChange={(e) => setInstructions(e.target.value)}
            rows={4}
            placeholder="ระบุขั้นตอน เอกสารประกอบ และเงื่อนไขการส่ง"
            className={`${inputClass} resize-none`}
          />
        </div>
      </div>

      {/* File Upload (Mock) */}
      <div className="bg-white dark:bg-slate-900 rounded-sm border border-slate-200 dark:border-slate-800 p-5 space-y-3">
        <h2 className="text-sm font-semibold text-slate-900 dark:text-slate-100 border-b border-slate-100 dark:border-slate-800 pb-2 flex items-center gap-2">
          <FileText className="h-4 w-4" />
          เอกสารแนบ (ไฟล์แบบฟอร์ม)
        </h2>
        <div className="flex items-center gap-3">
          <div className="flex-1">
            <label className={labelClass}>ชื่อไฟล์แนบ (PDF)</label>
            <div className="flex items-center gap-2">
              <span className="shrink-0 text-[11px] font-bold bg-red-600 text-white px-2 py-1 rounded-sm">
                PDF
              </span>
              <input
                type="text"
                value={fileName}
                onChange={(e) => setFileName(e.target.value)}
                placeholder="เช่น แบบรายงาน_กพร_2570.pdf"
                className={inputClass}
              />
            </div>
          </div>
        </div>
        <p className="text-[11px] text-slate-400 dark:text-slate-500">
          ระบบ Demo — ใส่ชื่อไฟล์เพื่อแสดงในแบบประเมิน (ไม่มีการอัปโหลดจริง)
        </p>
      </div>

      {/* Dates */}
      <div className="bg-white dark:bg-slate-900 rounded-sm border border-slate-200 dark:border-slate-800 p-5 space-y-4">
        <h2 className="text-sm font-semibold text-slate-900 dark:text-slate-100 border-b border-slate-100 dark:border-slate-800 pb-2">
          กำหนดวันที่
        </h2>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className={labelClass}>วันที่บังคับใช้ *</label>
            <input
              type="date"
              value={effectiveDate}
              onChange={(e) => setEffectiveDate(e.target.value)}
              className={inputClass}
            />
          </div>
          <div>
            <label className={labelClass}>วันที่ครบกำหนด *</label>
            <input
              type="date"
              value={dueDate}
              onChange={(e) => setDueDate(e.target.value)}
              className={inputClass}
            />
          </div>
        </div>
      </div>

      {/* Target Units */}
      <div className="bg-white dark:bg-slate-900 rounded-sm border border-slate-200 dark:border-slate-800 p-5 space-y-3">
        <div className="border-b border-slate-100 dark:border-slate-800 pb-2 flex items-center justify-between">
          <h2 className="text-sm font-semibold text-slate-900 dark:text-slate-100 flex items-center gap-2">
            <Building2 className="h-4 w-4" />
            หน่วยงานที่ต้องส่ง ({selectedUnits.length}/{TARGET_UNITS.length})
          </h2>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={selectAll}
              className="text-xs text-[#1e3a5f] dark:text-blue-400 hover:underline"
            >
              เลือกทั้งหมด
            </button>
            <span className="text-slate-300 dark:text-slate-600">|</span>
            <button
              type="button"
              onClick={clearAll}
              className="text-xs text-slate-500 hover:underline"
            >
              ล้างทั้งหมด
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          {TARGET_UNITS.map((unit) => {
            const checked = selectedUnits.includes(unit.id);
            return (
              <label
                key={unit.id}
                className={`flex items-center gap-2.5 px-3 py-2 rounded-sm border cursor-pointer transition-colors ${
                  checked
                    ? "border-[#1e3a5f] bg-[#1e3a5f]/5 dark:bg-[#1e3a5f]/20"
                    : "border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800"
                }`}
              >
                <input
                  type="checkbox"
                  checked={checked}
                  onChange={() => toggleUnit(unit.id)}
                  className="accent-[#1e3a5f]"
                />
                <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 w-12 shrink-0">
                  {unit.code}
                </span>
                <span className="text-xs text-slate-700 dark:text-slate-300 leading-tight">
                  {unit.label.split(" (")[0]}
                </span>
              </label>
            );
          })}
        </div>
      </div>

      {/* Publish Toggle */}
      <div className="bg-white dark:bg-slate-900 rounded-sm border border-slate-200 dark:border-slate-800 p-4 flex items-center justify-between">
        <div>
          <div className="text-sm font-semibold text-slate-900 dark:text-slate-100">
            เผยแพร่ทันที
          </div>
          <div className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            เปิดให้หน่วยงานส่งรายงานได้ทันทีหลังบันทึก (ปิดเพื่อบันทึกเป็น DRAFT)
          </div>
        </div>
        <button
          type="button"
          suppressHydrationWarning
          onClick={() => setPublishImmediately((v) => !v)}
          className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
            publishImmediately ? "bg-[#1e3a5f]" : "bg-slate-200 dark:bg-slate-700"
          }`}
        >
          <span
            className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
              publishImmediately ? "translate-x-6" : "translate-x-1"
            }`}
          />
        </button>
      </div>

      {/* Error */}
      {error && (
        <div className="rounded-sm border border-red-300 bg-red-50 dark:bg-red-900/20 px-4 py-3 text-sm text-red-800 dark:text-red-300">
          {error}
        </div>
      )}

      {/* Actions */}
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={handleSave}
          disabled={saving}
          suppressHydrationWarning
          className="inline-flex items-center gap-1.5 rounded-sm bg-[#1e3a5f] hover:bg-[#142a45] text-white text-sm font-medium px-5 py-2.5 transition-colors disabled:opacity-60"
        >
          {publishImmediately ? (
            <>
              <Send className="h-4 w-4" />
              {saving ? "กำลังบันทึก..." : "บันทึกและเผยแพร่"}
            </>
          ) : (
            <>
              <Save className="h-4 w-4" />
              {saving ? "กำลังบันทึก..." : "บันทึกเป็น DRAFT"}
            </>
          )}
        </button>
        <button
          type="button"
          onClick={() => router.back()}
          className="text-sm text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100"
        >
          ยกเลิก
        </button>
      </div>
    </div>
  );
}
