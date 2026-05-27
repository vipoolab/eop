"use client";

import { useState } from "react";
import { Download, Loader2 } from "lucide-react";
import type { CommandLetter } from "@/lib/commands/types";

interface Props {
  letter: CommandLetter;
  signedDate?: string;
  className?: string;
}

// Downloads the คำสั่ง as a .docx by POSTing the letter to /api/commands/docx
// and saving the returned Word file.
export function DownloadDocxButton({ letter, signedDate, className = "" }: Props) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function download() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/commands/docx", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ letter, signedDate }),
      });
      if (!res.ok) {
        let msg = `ดาวน์โหลดไม่สำเร็จ (HTTP ${res.status})`;
        try {
          const j = await res.json();
          msg = j.message ?? msg;
        } catch {
          /* non-JSON */
        }
        setError(msg);
        return;
      }
      const blob = await res.blob();
      // Derive filename from Content-Disposition, else fall back
      const cd = res.headers.get("content-disposition") ?? "";
      const m = cd.match(/filename\*=UTF-8''([^;]+)/);
      const filename = m ? decodeURIComponent(m[1]) : "คำสั่ง.docx";

      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
    } catch (e) {
      setError(e instanceof Error ? e.message : "เกิดข้อผิดพลาด");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex items-center gap-2">
      <button
        type="button"
        suppressHydrationWarning
        onClick={download}
        disabled={loading}
        className={`inline-flex items-center gap-1.5 rounded-sm bg-[#1e3a5f] hover:bg-[#142a45] disabled:opacity-50 text-white text-xs font-medium px-3 py-1.5 ${className}`}
      >
        {loading ? (
          <Loader2 className="h-3.5 w-3.5 animate-spin" />
        ) : (
          <Download className="h-3.5 w-3.5" />
        )}
        {loading ? "กำลังสร้าง..." : "ดาวน์โหลด DOCX"}
      </button>
      {error && <span className="text-[11px] text-red-600">{error}</span>}
    </div>
  );
}
