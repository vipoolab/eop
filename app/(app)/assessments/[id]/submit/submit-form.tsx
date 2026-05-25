"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Send, FileText } from "lucide-react";
import type { OrgUnit, Persona } from "@/lib/police-org/types";

interface SubmitFormProps {
  assessmentId: string;
  persona: Persona;
  unit: OrgUnit | null;
}

export function SubmitForm({ assessmentId, persona, unit }: SubmitFormProps) {
  const router = useRouter();
  const [submitting, setSubmitting] = useState(false);
  const [notes, setNotes] = useState("");
  const [fileName, setFileName] = useState("");
  const [error, setError] = useState("");

  const inputClass =
    "w-full rounded-sm border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#1e3a5f]/30 focus:border-[#1e3a5f]";
  const labelClass = "block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1";

  async function handleSubmit() {
    setSubmitting(true);
    setError("");
    try {
      const res = await fetch(`/api/assessments/${assessmentId}/submit`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          unitId: persona.unitId,
          unitName: unit?.name ?? persona.unitId,
          submittedBy: persona.id,
          submittedByName: persona.name,
          submittedByTitle: persona.role,
          fileName: fileName.trim() || undefined,
          notes: notes.trim() || undefined,
        }),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error ?? "ส่งไม่สำเร็จ");
      }

      router.push("/inbox");
      router.refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : "ส่งไม่สำเร็จ กรุณาลองใหม่");
      setSubmitting(false);
    }
  }

  return (
    <div className="bg-white dark:bg-slate-900 rounded-sm border border-slate-200 dark:border-slate-800 p-5 space-y-4">
      <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-100 border-b border-slate-100 dark:border-slate-800 pb-2">
        ส่งแบบประเมินจากหน่วย:{" "}
        <span className="text-[#1e3a5f] dark:text-blue-400">
          {unit?.shortName ?? persona.unitId}
        </span>
      </h3>

      {/* File name (mock upload) */}
      <div>
        <label className={labelClass}>ไฟล์ที่แนบ (PDF)</label>
        <div className="flex items-center gap-2">
          <span className="shrink-0 text-[11px] font-bold bg-red-600 text-white px-2 py-1 rounded-sm">
            PDF
          </span>
          <input
            type="text"
            value={fileName}
            onChange={(e) => setFileName(e.target.value)}
            placeholder="ชื่อไฟล์ที่ส่ง เช่น รายงาน_กพร_บชน_2569.pdf"
            className={inputClass}
          />
        </div>
        <div className="flex items-center gap-1 mt-1.5">
          <FileText className="h-3 w-3 text-slate-400" />
          <span className="text-[11px] text-slate-400 dark:text-slate-500">
            ระบบ Demo — ใส่ชื่อไฟล์เพื่อบันทึก (ไม่มีการอัปโหลดจริง)
          </span>
        </div>
      </div>

      {/* Notes */}
      <div>
        <label className={labelClass}>หมายเหตุ / ข้อความเพิ่มเติม</label>
        <textarea
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          rows={4}
          placeholder="ระบุรายละเอียดเพิ่มเติม ปัญหาหรือข้อสังเกตที่ต้องการแจ้ง"
          className={`${inputClass} resize-none`}
        />
      </div>

      {/* Submitter info (read-only) */}
      <div className="rounded-sm border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 px-3 py-2 text-xs text-slate-600 dark:text-slate-400">
        ส่งในนาม:{" "}
        <span className="font-semibold text-slate-900 dark:text-slate-100">
          {persona.rank} {persona.name.split(" ").slice(1).join(" ")}
        </span>{" "}
        ({persona.role}) — หน่วย{" "}
        <span className="font-semibold">{unit?.shortName ?? persona.unitId}</span>
      </div>

      {error && (
        <div className="rounded-sm border border-red-300 bg-red-50 dark:bg-red-900/20 px-4 py-3 text-sm text-red-800 dark:text-red-300">
          {error}
        </div>
      )}

      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={handleSubmit}
          disabled={submitting}
          suppressHydrationWarning
          className="inline-flex items-center gap-1.5 rounded-sm bg-[#1e3a5f] hover:bg-[#142a45] text-white text-sm font-medium px-5 py-2.5 transition-colors disabled:opacity-60"
        >
          <Send className="h-4 w-4" />
          {submitting ? "กำลังส่ง..." : "ยืนยันส่งแบบประเมิน"}
        </button>
        <a
          href="/inbox"
          className="text-sm text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100"
        >
          ยกเลิก
        </a>
      </div>
    </div>
  );
}
