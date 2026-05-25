"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Lock } from "lucide-react";

export function CloseButton({ assessmentId }: { assessmentId: string }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function handleClose() {
    if (!confirm("ยืนยันการปิดรับแบบประเมินนี้? หน่วยงานที่ยังไม่ส่งจะไม่สามารถส่งได้อีก")) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/assessments/${assessmentId}/close`, {
        method: "POST",
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
    <button
      type="button"
      onClick={handleClose}
      disabled={loading}
      suppressHydrationWarning
      className="inline-flex items-center gap-1.5 rounded-sm bg-slate-600 hover:bg-slate-700 text-white text-xs font-semibold px-3 py-1.5 transition-colors disabled:opacity-60"
    >
      <Lock className="h-3.5 w-3.5" />
      {loading ? "กำลังปิด..." : "ปิดรับ"}
    </button>
  );
}
