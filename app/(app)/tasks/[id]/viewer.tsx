"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  Loader2,
  CheckCircle2,
  FileText,
  Copy,
  Download,
  Plus,
} from "lucide-react";
import type { BackgroundTask } from "@/lib/tasks/types";
import { CATEGORY_STYLES, DOC_CATEGORIES, CATEGORY_DESCRIPTIONS } from "@/lib/intelligence/types";
import type { DocCategory } from "@/lib/intelligence/types";

interface Props {
  taskId: string;
  initialTask: BackgroundTask;
}

export function TaskResultViewer({ taskId, initialTask }: Props) {
  const [task, setTask] = useState(initialTask);

  // Poll while task is running
  useEffect(() => {
    if (task.status === "DONE" || task.status === "ERROR") return;
    const i = setInterval(async () => {
      try {
        const res = await fetch(`/api/tasks/${taskId}`);
        const j = await res.json();
        if (j.success) {
          setTask(j.data);
          if (j.data.status === "DONE" || j.data.status === "ERROR") {
            clearInterval(i);
          }
        }
      } catch {
        // ignore
      }
    }, 2000);
    return () => clearInterval(i);
  }, [taskId, task.status]);

  if (task.status === "RUNNING" || task.status === "QUEUED") {
    return (
      <div className="rounded-sm border border-blue-200 dark:border-blue-700 bg-blue-50 dark:bg-blue-900/20 p-8 text-center">
        <Loader2 className="h-10 w-10 text-blue-600 animate-spin mx-auto mb-2" />
        <div className="text-base font-semibold text-blue-900 dark:text-blue-200 mb-1">
          AI กำลังทำงานเบื้องหลัง
        </div>
        <div className="text-xs text-blue-700 dark:text-blue-300">
          คุณสามารถไปทำงานอื่นได้ — หน้านี้จะอัปเดตอัตโนมัติเมื่อเสร็จ
        </div>
      </div>
    );
  }

  if (task.status === "ERROR") {
    return null; // error shown in parent
  }

  // DONE — render per task type
  switch (task.type) {
    case "draft":
      return <DraftResult task={task} />;
    case "classify":
      return <ClassifyResult task={task} />;
    case "classify-batch":
      return <ClassifyBatchResult task={task} />;
    case "ocr":
      return <OcrResult task={task} />;
    default:
      return <pre className="text-xs">{JSON.stringify(task.result, null, 2)}</pre>;
  }
}

// ── DRAFT ────────────────────────────────────────

interface DraftResultData {
  result: {
    letter: {
      docNumber?: string;
      subject: string;
      recipient: string;
      objective?: string;
      directives: string[];
      reportInstruction?: string;
      closing: string;
    };
    alignment: { explanation: string };
    suggestedKpis: { metric: string; type: string }[];
    suggestedTargetUnitIds?: string[];
    suggestedDurationDays?: number;
  };
  model: string;
  durationMs: number;
  tokens: { input: number; output: number };
}

function DraftResult({ task }: { task: BackgroundTask }) {
  const data = task.result as DraftResultData;
  if (!data?.result?.letter) return null;
  const L = data.result.letter;

  // Build URL to resume wizard with this draft
  const resumeUrl = `/commands/new?draftTaskId=${task.id}`;

  return (
    <section className="space-y-4">
      <div className="rounded-sm border-2 border-emerald-300 dark:border-emerald-700 bg-emerald-50 dark:bg-emerald-900/20 p-4 flex items-center gap-3">
        <CheckCircle2 className="h-5 w-5 text-emerald-700 dark:text-emerald-400 shrink-0" />
        <div className="flex-1 text-sm">
          <div className="font-bold text-emerald-900 dark:text-emerald-200">
            AI ร่างหนังสือเสร็จแล้ว
          </div>
          <div className="text-[11px] text-emerald-700 dark:text-emerald-300 mt-0.5">
            สามารถนำร่างไปต่อใน Wizard เพื่อเลือกหน่วยรับ / กำหนด KPI / ส่ง
          </div>
        </div>
        <Link
          href={resumeUrl}
          className="inline-flex items-center gap-1.5 rounded-sm bg-[#1e3a5f] hover:bg-[#142a45] text-white text-sm font-semibold px-4 py-2"
        >
          เปิดใน Wizard
        </Link>
      </div>

      <div className="rounded-sm border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 p-5 space-y-3">
        <div>
          <div className="text-[10px] font-semibold uppercase tracking-wider text-slate-500">
            #๑ หัวเรื่อง
          </div>
          <div className="text-sm font-semibold text-slate-900 dark:text-slate-100 mt-1">
            {L.subject}
          </div>
        </div>
        <div>
          <div className="text-[10px] font-semibold uppercase tracking-wider text-slate-500">
            #๒ ผู้รับ
          </div>
          <div className="text-sm text-slate-800 dark:text-slate-200 mt-1">{L.recipient}</div>
        </div>
        {L.objective && (
          <div>
            <div className="text-[10px] font-semibold uppercase tracking-wider text-slate-500">
              #๓ วัตถุประสงค์
            </div>
            <div className="text-sm text-slate-800 dark:text-slate-200 mt-1">{L.objective}</div>
          </div>
        )}
        <div>
          <div className="text-[10px] font-semibold uppercase tracking-wider text-slate-500">
            #๔ ข้อสั่งการ
          </div>
          <div className="text-sm text-slate-800 dark:text-slate-200 mt-1 space-y-1">
            {L.directives.map((d, i) => (
              <div key={i}>{d}</div>
            ))}
          </div>
        </div>
        {L.reportInstruction && (
          <div>
            <div className="text-[10px] font-semibold uppercase tracking-wider text-slate-500">
              #๕ ระยะเวลา/รายงาน
            </div>
            <div className="text-sm text-slate-800 dark:text-slate-200 mt-1">
              {L.reportInstruction}
            </div>
          </div>
        )}
        <div className="pt-3 border-t border-slate-100 dark:border-slate-800 text-[11px] text-slate-500 flex items-center gap-4">
          <span>เวลา: {(data.durationMs / 1000).toFixed(1)}s</span>
          <span>tokens: in {data.tokens.input.toLocaleString()} / out {data.tokens.output.toLocaleString()}</span>
        </div>
      </div>
    </section>
  );
}

// ── CLASSIFY (single) ────────────────────────────

function ClassifyResult({ task }: { task: BackgroundTask }) {
  const data = task.result as {
    predicted: DocCategory;
    predictedConfidence: number;
    reasoning?: string;
  };
  return (
    <div className="rounded-sm border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 p-5">
      <div className="text-[10px] font-semibold uppercase tracking-wider text-slate-500 mb-2">
        ผลการจำแนก
      </div>
      <div className="flex items-center gap-3">
        <div className={`text-2xl font-bold px-3 py-1.5 rounded-sm border ${CATEGORY_STYLES[data.predicted]}`}>
          {data.predicted}
        </div>
        <div>
          <div className="text-sm font-semibold">{CATEGORY_DESCRIPTIONS[data.predicted]}</div>
          <div className="text-xs text-slate-500">
            ความมั่นใจ {(data.predictedConfidence * 100).toFixed(1)}%
          </div>
        </div>
      </div>
      {data.reasoning && (
        <div className="mt-3 pt-3 border-t border-slate-100 text-sm text-slate-700 italic">
          {data.reasoning}
        </div>
      )}
    </div>
  );
}

// ── CLASSIFY BATCH ────────────────────────────────

function ClassifyBatchResult({ task }: { task: BackgroundTask }) {
  const data = task.result as {
    entries: { filename: string; ok: boolean; result?: { predicted: DocCategory; predictedConfidence: number; method: string; reasoning?: string } }[];
    summary: { total: number; successful: number; failed: number; byCategory: Record<string, number>; avgConfidence: number; totalMs: number };
  };
  return (
    <div className="space-y-4">
      <div className="rounded-sm border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 p-5">
        <div className="text-[10px] font-semibold uppercase tracking-wider text-slate-500 mb-3">
          สรุป
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <Stat label="ไฟล์ทั้งหมด" value={data.summary.total} />
          <Stat label="สำเร็จ" value={data.summary.successful} />
          <Stat label="ความมั่นใจเฉลี่ย" value={`${(data.summary.avgConfidence * 100).toFixed(1)}%`} />
          <Stat label="เวลารวม" value={`${(data.summary.totalMs / 1000).toFixed(1)}s`} />
        </div>
        <div className="mt-4 grid grid-cols-3 md:grid-cols-6 gap-2">
          {DOC_CATEGORIES.map((cat) => {
            const n = data.summary.byCategory[cat] ?? 0;
            return (
              <div key={cat} className={`rounded-sm border p-2 text-center ${CATEGORY_STYLES[cat]}`}>
                <div className="text-xs font-bold">{cat}</div>
                <div className="text-lg font-bold mt-1">{n}</div>
              </div>
            );
          })}
        </div>
      </div>

      <div className="rounded-sm border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 overflow-hidden">
        <div className="border-b border-slate-100 dark:border-slate-800 px-5 py-3 text-sm font-bold">
          ผลรายไฟล์ ({data.entries.length})
        </div>
        <table className="w-full text-sm">
          <thead className="bg-slate-50 dark:bg-slate-800 text-[10px] uppercase tracking-wider text-slate-500">
            <tr>
              <th className="text-left px-4 py-2 w-10">#</th>
              <th className="text-left px-4 py-2">ไฟล์</th>
              <th className="text-center px-4 py-2 w-24">หมวด</th>
              <th className="text-center px-4 py-2 w-24">ความมั่นใจ</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
            {data.entries.map((e, i) => (
              <tr key={i}>
                <td className="px-4 py-2 text-xs text-slate-400">{i + 1}</td>
                <td className="px-4 py-2 text-sm truncate max-w-md">{e.filename}</td>
                <td className="px-4 py-2 text-center">
                  {e.ok && e.result ? (
                    <span className={`text-xs font-bold px-2 py-0.5 rounded-sm border ${CATEGORY_STYLES[e.result.predicted]}`}>
                      {e.result.predicted}
                    </span>
                  ) : (
                    <span className="text-xs text-red-600">ผิดพลาด</span>
                  )}
                </td>
                <td className="px-4 py-2 text-center text-xs tabular-nums">
                  {e.ok && e.result ? `${(e.result.predictedConfidence * 100).toFixed(0)}%` : "—"}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ── OCR ──────────────────────────────────────────

function OcrResult({ task }: { task: BackgroundTask }) {
  const [edited, setEdited] = useState<string>(() => {
    const r = task.result as { extractedText?: string };
    return r?.extractedText ?? "";
  });
  const data = task.result as {
    filename: string;
    extractedText: string;
    charCount: number;
    wordCount: number;
    cer?: number;
    accuracy?: number;
    confidence: number;
    processingTimeMs: number;
  };

  function copy() {
    navigator.clipboard?.writeText(edited).catch(() => {});
  }
  function download() {
    const blob = new Blob([edited], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = data.filename.replace(/\.[^.]+$/, "") + "_ocr.txt";
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }

  return (
    <div className="space-y-4">
      <div className="rounded-sm border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 p-5">
        <div className="text-[10px] font-semibold uppercase tracking-wider text-slate-500 mb-3">
          เมตริก OCR
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <Stat label="ตัวอักษร" value={data.charCount.toLocaleString()} />
          <Stat label="คำ" value={data.wordCount.toLocaleString()} />
          <Stat label="เวลา" value={`${(data.processingTimeMs / 1000).toFixed(1)}s`} />
          <Stat label="ความมั่นใจ" value={`${(data.confidence * 100).toFixed(1)}%`} />
        </div>
        {data.cer !== undefined && (
          <div className="mt-4 grid grid-cols-3 gap-3 pt-4 border-t border-slate-100">
            <Stat label="CER" value={`${(data.cer * 100).toFixed(2)}%`} />
            <Stat label="Accuracy" value={`${((data.accuracy ?? 0) * 100).toFixed(2)}%`} />
            <Stat
              label="คะแนน PoC"
              value={
                data.cer <= 0.1
                  ? "10/10"
                  : data.cer <= 0.2
                    ? "5/10"
                    : data.cer <= 0.3
                      ? "2.5/10"
                      : "0/10"
              }
            />
          </div>
        )}
      </div>

      <div className="rounded-sm border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 overflow-hidden">
        <div className="border-b border-slate-100 dark:border-slate-800 px-5 py-3 flex items-center gap-2">
          <FileText className="h-4 w-4 text-[#b8860b]" />
          <span className="text-sm font-bold">ข้อความที่ถอดได้ (แก้ไขได้)</span>
          <div className="ml-auto flex gap-2">
            <button
              type="button"
              suppressHydrationWarning
              onClick={copy}
              className="text-xs border border-slate-200 hover:border-slate-400 rounded-sm px-2 py-1 inline-flex items-center gap-1"
            >
              <Copy className="h-3 w-3" />
              คัดลอก
            </button>
            <button
              type="button"
              suppressHydrationWarning
              onClick={download}
              className="text-xs border border-slate-200 hover:border-slate-400 rounded-sm px-2 py-1 inline-flex items-center gap-1"
            >
              <Download className="h-3 w-3" />
              ดาวน์โหลด
            </button>
          </div>
        </div>
        <textarea
          value={edited}
          onChange={(e) => setEdited(e.target.value)}
          rows={20}
          spellCheck={false}
          className="w-full bg-white dark:bg-slate-950 p-5 text-sm leading-loose text-slate-900 dark:text-slate-100 focus:outline-none resize-y font-[var(--font-thai)]"
        />
      </div>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="rounded-sm bg-slate-50 dark:bg-slate-800 p-3">
      <div className="text-[10px] font-semibold uppercase tracking-wider text-slate-500">{label}</div>
      <div className="text-lg font-bold text-slate-900 dark:text-slate-100 mt-1">{value}</div>
    </div>
  );
}
