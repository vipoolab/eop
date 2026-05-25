"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Send } from "lucide-react";

export function PublishButton({ assessmentId }: { assessmentId: string }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function handlePublish() {
    if (!confirm("ยืนยันการเผยแพร่แบบประเมินนี้? หน่วยงานเป้าหมายจะสามารถส่งได้ทันที")) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/assessments/${assessmentId}/publish`, {
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
      onClick={handlePublish}
      disabled={loading}
      suppressHydrationWarning
      className="inline-flex items-center gap-1.5 rounded-sm bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold px-3 py-1.5 transition-colors disabled:opacity-60"
    >
      <Send className="h-3.5 w-3.5" />
      {loading ? "กำลังเผยแพร่..." : "เผยแพร่"}
    </button>
  );
}
