// Renders the ACTUAL exported .docx (not an HTML simulation) so the on-screen
// preview is byte-identical to what the user downloads. Flow:
//   1. POST the letter to /api/commands/docx → get the .docx Blob.
//   2. Feed the Blob to docx-preview, which builds HTML/CSS from the OOXML.
//   3. The browser renders it using the same TH SarabunPSK family alias we
//      registered in globals.css (so Thai glyphs match Word).

"use client";

import { useEffect, useRef, useState } from "react";
import { renderAsync } from "docx-preview";
import type { CommandLetter } from "@/lib/commands/types";

interface Props {
  letter: CommandLetter;
  signedDate?: string;
}

export function DocxBlobPreview({ letter, signedDate }: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [status, setStatus] = useState<"loading" | "ready" | "error">("loading");
  const [errMsg, setErrMsg] = useState<string | null>(null);

  // Stringify so we re-fetch only when content actually changes (not on every
  // parent re-render that creates a new object reference).
  const letterKey = JSON.stringify(letter);

  useEffect(() => {
    let cancelled = false;
    setStatus("loading");
    setErrMsg(null);

    (async () => {
      try {
        const res = await fetch("/api/commands/docx", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ letter, signedDate }),
        });
        if (!res.ok) throw new Error(`สร้างไฟล์ docx ไม่สำเร็จ (HTTP ${res.status})`);
        const blob = await res.blob();
        if (cancelled) return;
        const container = containerRef.current;
        if (!container) return;
        container.innerHTML = "";
        await renderAsync(blob, container, undefined, {
          inWrapper: true,
          breakPages: true,
          ignoreLastRenderedPageBreak: true,
          experimental: true,
          useBase64URL: true,
        });
        if (!cancelled) setStatus("ready");
      } catch (e) {
        if (!cancelled) {
          setErrMsg(e instanceof Error ? e.message : "render failed");
          setStatus("error");
        }
      }
    })();

    return () => {
      cancelled = true;
    };
    // letter is captured by closure but we trigger via the stable key
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [letterKey, signedDate]);

  return (
    <div className="bg-slate-100 dark:bg-slate-800 p-4 rounded-sm relative min-h-[400px]">
      {status === "loading" && (
        <div className="absolute inset-0 flex items-center justify-center bg-white/70 dark:bg-slate-900/70 z-10 rounded-sm">
          <div className="flex items-center gap-3 text-slate-600 dark:text-slate-300">
            <div className="h-5 w-5 border-2 border-current border-r-transparent rounded-full animate-spin" />
            <span className="text-sm">กำลังสร้าง preview จากไฟล์ docx...</span>
          </div>
        </div>
      )}
      {status === "error" && (
        <div className="p-4 text-sm text-red-700 bg-red-50 dark:bg-red-900/30 dark:text-red-300 rounded-sm">
          แสดง preview ไม่ได้: {errMsg}
        </div>
      )}
      <div
        ref={containerRef}
        className="overflow-x-auto flex justify-center"
        // docx-preview emits page-sized HTML; let it size itself.
      />
    </div>
  );
}
