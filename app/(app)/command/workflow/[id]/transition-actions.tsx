"use client";

// Client-side transition buttons
// Posts to /api/commands/[id]/transition

import { useState } from "react";
import { useRouter } from "next/navigation";
import type { Transition } from "@/features/commands/workflow";
import { Loader2 } from "lucide-react";

export function TransitionActions({
  commandId,
  transitions,
}: {
  commandId: string;
  transitions: Transition[];
}) {
  const router = useRouter();
  const [loading, setLoading] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [note, setNote] = useState("");

  async function handleAction(action: string) {
    setLoading(action);
    setError(null);

    try {
      const res = await fetch(`/api/commands/${commandId}/transition`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action, note: note.trim() || undefined }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.message || "เกิดข้อผิดพลาด");
      }

      // Refresh server component
      setNote("");
      router.refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : "เกิดข้อผิดพลาด");
    } finally {
      setLoading(null);
    }
  }

  return (
    <div className="space-y-3">
      <textarea
        value={note}
        onChange={(e) => setNote(e.target.value)}
        placeholder="หมายเหตุ (ถ้ามี)"
        rows={2}
        className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-400 resize-none"
      />

      <div className="flex flex-col gap-2">
        {transitions.map((t) => (
          <button
            key={t.action}
            disabled={loading !== null}
            onClick={() => handleAction(t.action)}
            className={`inline-flex items-center justify-center gap-2 rounded-lg px-3 py-2 text-sm font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${
              t.action === "reject"
                ? "bg-rose-50 text-rose-700 border border-rose-200 hover:bg-rose-100"
                : "bg-blue-600 text-white hover:bg-blue-700"
            }`}
            title={t.description}
          >
            {loading === t.action && (
              <Loader2 className="h-4 w-4 animate-spin" />
            )}
            {t.label}
          </button>
        ))}
      </div>

      {error && (
        <div className="rounded-md bg-rose-50 border border-rose-200 px-3 py-2 text-xs text-rose-700">
          {error}
        </div>
      )}
    </div>
  );
}
