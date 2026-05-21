"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, CheckCircle2 } from "lucide-react";

export function AcknowledgeButton({ alertId }: { alertId: string }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function ack() {
    if (!confirm("รับทราบและปิด Alert นี้?")) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/analytics/anomaly/${alertId}/acknowledge`, {
        method: "POST",
      });
      const data = await res.json();
      if (!res.ok || !data.success) throw new Error(data.message);
      router.refresh();
    } catch (e) {
      alert(e instanceof Error ? e.message : "เกิดข้อผิดพลาด");
    } finally {
      setLoading(false);
    }
  }

  return (
    <button
      onClick={ack}
      disabled={loading}
      className="inline-flex items-center gap-1 text-[11px] rounded-md bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 px-2 py-1 disabled:opacity-50"
    >
      {loading ? (
        <Loader2 className="h-3 w-3 animate-spin" />
      ) : (
        <CheckCircle2 className="h-3 w-3" />
      )}
      รับทราบ
    </button>
  );
}
