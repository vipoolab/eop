"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { CheckCircle2, XCircle } from "lucide-react";

export function ReviewButton({
  assessmentId,
  submissionId,
}: {
  assessmentId: string;
  submissionId: string;
}) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function handleAction(action: "REVIEWED" | "RETURNED") {
    const note = action === "RETURNED"
      ? prompt("ระบุเหตุผลในการตีกลับ (จะแสดงให้หน่วยงานทราบ):")
      : null;

    if (action === "RETURNED" && !note?.trim()) return;

    setLoading(true);
    try {
      const res = await fetch(`/api/assessments/${assessmentId}/review`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          submissionId,
          status: action,
          reviewNote: note?.trim(),
          reviewedByName: "พล.ต.ท. ณรงค์ฤทธิ์ ธรรมรัต",
        }),
      });
      if (!res.ok) {
        const err = await res.json();
        alert(err.error ?? "เกิดข้อผิดพลาด");
        setLoading(false);
        return;
      }
      router.refresh();
    } catch {
      alert("เกิดข้อผิดพลาด กรุณาลองใหม่");
      setLoading(false);
    }
  }

  return (
    <div className="flex items-center gap-1.5">
      <button
        type="button"
        onClick={() => handleAction("REVIEWED")}
        disabled={loading}
        suppressHydrationWarning
        className="inline-flex items-center gap-1 rounded-sm bg-emerald-600 hover:bg-emerald-700 text-white text-[10px] font-semibold px-2 py-1 transition-colors disabled:opacity-60"
      >
        <CheckCircle2 className="h-3 w-3" />
        รับแล้ว
      </button>
      <button
        type="button"
        onClick={() => handleAction("RETURNED")}
        disabled={loading}
        suppressHydrationWarning
        className="inline-flex items-center gap-1 rounded-sm bg-red-600 hover:bg-red-700 text-white text-[10px] font-semibold px-2 py-1 transition-colors disabled:opacity-60"
      >
        <XCircle className="h-3 w-3" />
        ตีกลับ
      </button>
    </div>
  );
}
