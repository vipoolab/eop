"use client";

import { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import {
  UploadCloud,
  FileText,
  Loader2,
  CheckCircle2,
  Sparkles,
  Copy,
  Download,
  AlertCircle,
  Clock,
  Type,
  Hash,
  Target,
  X,
  FileImage,
  ChevronDown,
  ChevronUp,
} from "lucide-react";

interface OcrResult {
  filename: string;
  fileType: string;
  extractedText: string;
  charCount: number;
  wordCount: number;
  cer?: number;
  accuracy?: number;
  confidence: number;
  processingTimeMs: number;
  inputTokens: number;
  outputTokens: number;
  language: string;
}

const PROCESSING_STEPS = [
  { label: "อัปโหลดและเข้ารหัสไฟล์...", durationMs: 600 },
  { label: "ส่งเข้า AI Vision Engine...", durationMs: 800 },
  { label: "วิเคราะห์โครงสร้างเอกสาร...", durationMs: 1000 },
  { label: "ถอดข้อความภาษาไทย...", durationMs: 1400 },
  { label: "ตรวจสอบและจัดรูปแบบ...", durationMs: 600 },
];

export function OcrDemo() {
  const router = useRouter();
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [groundTruth, setGroundTruth] = useState("");
  const [showGroundTruth, setShowGroundTruth] = useState(false);
  const [dragging, setDragging] = useState(false);
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState(-1);
  const [result, setResult] = useState<OcrResult | null>(null);
  const [editedText, setEditedText] = useState("");
  const [error, setError] = useState<string | null>(null);
  const fileInput = useRef<HTMLInputElement>(null);

  function chooseFile(f: File | null) {
    if (!f) return;
    const name = f.name.toLowerCase();
    const valid =
      name.endsWith(".pdf") ||
      name.endsWith(".png") ||
      name.endsWith(".jpg") ||
      name.endsWith(".jpeg") ||
      name.endsWith(".webp");
    if (!valid) {
      setError("ไฟล์ไม่รองรับ — รับเฉพาะ PDF, PNG, JPG, WEBP");
      return;
    }
    if (f.size > 20 * 1024 * 1024) {
      setError("ไฟล์ใหญ่เกิน 20MB");
      return;
    }
    setError(null);
    setFile(f);
    setResult(null);
    setEditedText("");
    if (name.endsWith(".pdf")) {
      setPreview(null);
    } else {
      const url = URL.createObjectURL(f);
      setPreview(url);
    }
  }

  function clearFile() {
    setFile(null);
    setPreview(null);
    setResult(null);
    setEditedText("");
    setError(null);
    if (fileInput.current) fileInput.current.value = "";
  }

  async function runOCR() {
    if (!file) {
      setError("กรุณาเลือกไฟล์ก่อน");
      return;
    }
    setError(null);
    setResult(null);
    setLoading(true);

    let stepIdx = 0;
    setStep(0);
    const stepTimer = setInterval(() => {
      stepIdx = Math.min(stepIdx + 1, PROCESSING_STEPS.length - 1);
      setStep(stepIdx);
    }, 1100);

    try {
      const fd = new FormData();
      fd.append("file", file);
      if (groundTruth.trim()) fd.append("groundTruth", groundTruth);

      // Use async endpoint — kicks off background task + returns taskId
      const res = await fetch("/api/intelligence/ocr/async", {
        method: "POST",
        body: fd,
      });
      const j = await res.json();
      clearInterval(stepTimer);
      if (j.success && j.data.taskId) {
        // Navigate to task page where polling + result display happens
        router.push(`/tasks/${j.data.taskId}`);
      } else {
        setError(j.message ?? "ส่งงานไม่สำเร็จ");
        setStep(-1);
      }
    } catch (e) {
      clearInterval(stepTimer);
      setError(e instanceof Error ? e.message : "เกิดข้อผิดพลาด");
      setStep(-1);
    } finally {
      setLoading(false);
    }
  }

  async function copyText() {
    if (!editedText) return;
    try {
      await navigator.clipboard.writeText(editedText);
    } catch {
      // ignore
    }
  }

  function downloadText() {
    if (!editedText || !file) return;
    const blob = new Blob([editedText], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = file.name.replace(/\.[^.]+$/, "") + "_ocr.txt";
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }

  return (
    <div className="space-y-5">
      {!file ? (
        <section
          onDragEnter={(e) => {
            e.preventDefault();
            setDragging(true);
          }}
          onDragOver={(e) => {
            e.preventDefault();
            setDragging(true);
          }}
          onDragLeave={() => setDragging(false)}
          onDrop={(e) => {
            e.preventDefault();
            setDragging(false);
            chooseFile(e.dataTransfer.files[0] ?? null);
          }}
          className={`bg-white dark:bg-slate-900 border-2 border-dashed rounded-sm p-10 text-center transition-colors ${
            dragging
              ? "border-[#1e3a5f] bg-blue-50 dark:bg-blue-900/20"
              : "border-slate-300 dark:border-slate-700"
          }`}
        >
          <UploadCloud className="h-14 w-14 text-slate-400 mx-auto mb-3" />
          <div className="text-base font-semibold text-slate-900 dark:text-slate-100 mb-1">
            ลากไฟล์มาวางที่นี่ หรือคลิกเพื่อเลือก
          </div>
          <div className="text-xs text-slate-500 mb-4">
            รองรับ <strong>PDF, PNG, JPG, WEBP</strong> · สูงสุด 20MB · ภาษาไทยและภาษาอังกฤษ
          </div>
          <input
            ref={fileInput}
            type="file"
            accept=".pdf,.png,.jpg,.jpeg,.webp,application/pdf,image/png,image/jpeg,image/webp"
            onChange={(e) => chooseFile(e.target.files?.[0] ?? null)}
            className="hidden"
          />
          <button
            type="button"
            suppressHydrationWarning
            onClick={() => fileInput.current?.click()}
            className="inline-flex items-center gap-1.5 rounded-sm bg-[#1e3a5f] hover:bg-[#142a45] text-white text-sm font-medium px-4 py-2"
          >
            <FileText className="h-4 w-4" />
            เลือกไฟล์
          </button>
        </section>
      ) : (
        <section className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-sm overflow-hidden">
          <div className="border-b border-slate-100 dark:border-slate-800 px-5 py-3 flex items-center gap-3 flex-wrap">
            <div className="h-10 w-10 rounded-sm bg-slate-100 dark:bg-slate-800 flex items-center justify-center shrink-0">
              {file.type.startsWith("image/") ? (
                <FileImage className="h-5 w-5 text-blue-600" />
              ) : (
                <FileText className="h-5 w-5 text-red-600" />
              )}
            </div>
            <div className="min-w-0 flex-1">
              <div className="text-sm font-semibold text-slate-900 dark:text-slate-100 truncate">
                {file.name}
              </div>
              <div className="text-[11px] text-slate-500">
                {(file.size / 1024).toFixed(1)} KB ·{" "}
                {file.type || file.name.split(".").pop()?.toUpperCase()}
              </div>
            </div>
            <button
              type="button"
              suppressHydrationWarning
              onClick={clearFile}
              disabled={loading}
              className="text-slate-400 hover:text-red-600 disabled:opacity-50 p-1.5"
              aria-label="ลบไฟล์"
            >
              <X className="h-4 w-4" />
            </button>
            <button
              type="button"
              suppressHydrationWarning
              onClick={runOCR}
              disabled={loading}
              className="inline-flex items-center gap-1.5 rounded-sm bg-[#1e3a5f] hover:bg-[#142a45] disabled:bg-slate-300 text-white text-sm font-medium px-4 py-2"
            >
              {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
              {loading ? "กำลังประมวลผล..." : "เริ่ม OCR"}
            </button>
          </div>

          {preview && (
            <div className="p-4 bg-slate-50 dark:bg-slate-950 flex justify-center max-h-96 overflow-auto">
              <img
                src={preview}
                alt="preview"
                className="max-h-80 max-w-full border border-slate-200 dark:border-slate-700 shadow-sm"
              />
            </div>
          )}
          {!preview && file.type === "application/pdf" && (
            <div className="p-8 bg-slate-50 dark:bg-slate-950 flex flex-col items-center justify-center text-center">
              <FileText className="h-16 w-16 text-red-600 mb-2" />
              <div className="text-sm font-semibold text-slate-700 dark:text-slate-300">
                เอกสาร PDF
              </div>
              <div className="text-xs text-slate-500 mt-0.5">
                AI Vision Engine จะอ่านทั้งเอกสาร — ใช้เวลาประมาณ 5-15 วินาที/หน้า
              </div>
            </div>
          )}

          <div className="border-t border-slate-100 dark:border-slate-800">
            <button
              type="button"
              suppressHydrationWarning
              onClick={() => setShowGroundTruth(!showGroundTruth)}
              className="w-full px-5 py-2.5 flex items-center gap-2 text-xs text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800/40"
            >
              {showGroundTruth ? (
                <ChevronUp className="h-3 w-3" />
              ) : (
                <ChevronDown className="h-3 w-3" />
              )}
              <Target className="h-3 w-3" />
              <span>
                Ground Truth (สำหรับวัด CER) — เปิดเฉพาะถ้ามีข้อความต้นฉบับสำหรับเปรียบเทียบ
              </span>
            </button>
            {showGroundTruth && (
              <div className="px-5 pb-3">
                <textarea
                  value={groundTruth}
                  onChange={(e) => setGroundTruth(e.target.value)}
                  placeholder="วางข้อความต้นฉบับ (ground truth) เพื่อให้ระบบคำนวณ CER (Character Error Rate)..."
                  rows={3}
                  className="w-full border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950 rounded-sm p-2 text-xs leading-relaxed focus:outline-none focus:border-[#1e3a5f] resize-y"
                />
                <div className="text-[10px] text-slate-500 mt-1">
                  CER = (S + D + I) / N × 100% ตามสูตร TOR PoC 3 — ≤ 10% = 10 คะแนนเต็ม
                </div>
              </div>
            )}
          </div>
        </section>
      )}

      {step >= 0 && (
        <section className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-sm">
          <div className="border-b border-slate-100 dark:border-slate-800 px-5 py-3 flex items-center gap-2">
            <Loader2 className="h-4 w-4 text-blue-600 animate-spin" />
            <span className="text-sm font-semibold text-slate-900 dark:text-slate-100">
              AI Vision Engine กำลังทำงาน
            </span>
          </div>
          <ul className="px-5 py-4 space-y-2">
            {PROCESSING_STEPS.map((s, i) => {
              const done = step > i || (i === PROCESSING_STEPS.length - 1 && result !== null);
              const active = step === i && !done;
              return (
                <li
                  key={i}
                  className={`flex items-center gap-2 text-sm transition-opacity ${
                    i > step ? "opacity-40" : ""
                  }`}
                >
                  {done ? (
                    <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
                  ) : active ? (
                    <Loader2 className="h-4 w-4 text-blue-600 animate-spin shrink-0" />
                  ) : (
                    <div className="h-4 w-4 rounded-full border border-slate-300 shrink-0" />
                  )}
                  <span
                    className={
                      done
                        ? "text-emerald-700 dark:text-emerald-400 font-medium"
                        : active
                          ? "text-slate-900 dark:text-slate-100 font-medium"
                          : "text-slate-500"
                    }
                  >
                    {s.label}
                  </span>
                </li>
              );
            })}
          </ul>
        </section>
      )}

      {error && (
        <div className="border border-red-300 bg-red-50 rounded-sm p-4 text-sm text-red-800 flex items-start gap-2">
          <AlertCircle className="h-4 w-4 mt-0.5 shrink-0" />
          {error}
        </div>
      )}

      {result && (
        <>
          <section className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-sm p-5">
            <div className="flex items-center gap-2 mb-3">
              <CheckCircle2 className="h-4 w-4 text-emerald-600" />
              <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">
                ผลการประมวลผล OCR
              </h3>
              <span className="text-[10px] text-slate-500 ml-auto">AI Engine</span>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <Metric icon={Type} label="จำนวนตัวอักษร" value={result.charCount.toLocaleString()} />
              <Metric icon={Hash} label="จำนวนคำ" value={result.wordCount.toLocaleString()} />
              <Metric icon={Clock} label="เวลาประมวลผล" value={`${(result.processingTimeMs / 1000).toFixed(1)}s`} />
              <Metric icon={Sparkles} label="ความมั่นใจ AI" value={`${(result.confidence * 100).toFixed(1)}%`} accent="emerald" />
            </div>

            {result.cer !== undefined && result.accuracy !== undefined && (
              <div className="mt-4 pt-4 border-t border-slate-100 dark:border-slate-800">
                <div className="text-[10px] font-semibold uppercase tracking-wider text-slate-500 mb-2">
                  PoC Scoring (TOR ข้อ 3.5.3)
                </div>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                  <Metric
                    icon={Target}
                    label="CER (Character Error Rate)"
                    value={`${(result.cer * 100).toFixed(2)}%`}
                    accent={result.cer <= 0.1 ? "emerald" : result.cer <= 0.2 ? "amber" : "red"}
                  />
                  <Metric
                    icon={CheckCircle2}
                    label="Accuracy"
                    value={`${(result.accuracy * 100).toFixed(2)}%`}
                    accent={result.cer <= 0.1 ? "emerald" : "amber"}
                  />
                  <div
                    className={`rounded-sm border p-3 text-center ${
                      result.cer <= 0.1
                        ? "border-emerald-300 bg-emerald-50 dark:bg-emerald-900/20"
                        : result.cer <= 0.2
                          ? "border-amber-300 bg-amber-50 dark:bg-amber-900/20"
                          : result.cer <= 0.3
                            ? "border-orange-300 bg-orange-50 dark:bg-orange-900/20"
                            : "border-red-300 bg-red-50 dark:bg-red-900/20"
                    }`}
                  >
                    <div className="text-[10px] font-semibold uppercase tracking-wider text-slate-500">
                      คะแนน PoC 3
                    </div>
                    <div className="text-2xl font-bold leading-none mt-1">
                      {result.cer <= 0.1
                        ? "10 / 10"
                        : result.cer <= 0.2
                          ? "5 / 10"
                          : result.cer <= 0.3
                            ? "2.5 / 10"
                            : "0 / 10"}
                    </div>
                    <div className="text-[10px] text-slate-500 mt-1">
                      {result.cer <= 0.1
                        ? "เต็ม!"
                        : result.cer <= 0.2
                          ? "ปานกลาง"
                          : result.cer <= 0.3
                            ? "ผ่านขั้นต่ำ"
                            : "ไม่ผ่าน"}
                    </div>
                  </div>
                </div>
              </div>
            )}
          </section>

          <section className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-sm overflow-hidden">
            <div className="border-b border-slate-100 dark:border-slate-800 px-5 py-3 flex items-center gap-2 flex-wrap">
              <FileText className="h-4 w-4 text-[#b8860b]" />
              <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">
                ข้อความที่ถอดได้ (แก้ไขได้)
              </h3>
              <div className="ml-auto flex items-center gap-2">
                <button
                  type="button"
                  suppressHydrationWarning
                  onClick={copyText}
                  className="inline-flex items-center gap-1 text-xs text-slate-600 hover:text-slate-900 border border-slate-200 dark:border-slate-700 hover:border-slate-400 rounded-sm px-2 py-1"
                >
                  <Copy className="h-3 w-3" />
                  คัดลอก
                </button>
                <button
                  type="button"
                  suppressHydrationWarning
                  onClick={downloadText}
                  className="inline-flex items-center gap-1 text-xs text-slate-600 hover:text-slate-900 border border-slate-200 dark:border-slate-700 hover:border-slate-400 rounded-sm px-2 py-1"
                >
                  <Download className="h-3 w-3" />
                  ดาวน์โหลด .txt
                </button>
              </div>
            </div>
            <textarea
              value={editedText}
              onChange={(e) => setEditedText(e.target.value)}
              rows={20}
              spellCheck={false}
              className="w-full bg-white dark:bg-slate-950 p-5 text-sm leading-loose text-slate-900 dark:text-slate-100 focus:outline-none resize-y font-[var(--font-thai)]"
            />
            <div className="px-5 py-2 text-[10px] text-slate-500 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
              <span>{editedText.length.toLocaleString()} ตัวอักษร</span>
              <span>
                ผู้ปฏิบัติสามารถแก้ไขให้ถูกต้องก่อนนำไปใช้ (สอดคล้องกับ TOR 6.10.3 ข้อ ค)
              </span>
            </div>
          </section>
        </>
      )}
    </div>
  );
}

function Metric({
  icon: Icon,
  label,
  value,
  accent = "navy",
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: string;
  accent?: "navy" | "emerald" | "amber" | "red";
}) {
  const colorMap = {
    navy: { bg: "bg-[#1e3a5f]", text: "text-slate-900 dark:text-slate-100" },
    emerald: { bg: "bg-emerald-600", text: "text-emerald-900 dark:text-emerald-100" },
    amber: { bg: "bg-amber-600", text: "text-amber-900 dark:text-amber-100" },
    red: { bg: "bg-red-600", text: "text-red-900 dark:text-red-100" },
  }[accent];
  return (
    <div className="rounded-sm border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 p-3 flex items-center gap-2.5">
      <div className={`h-8 w-8 rounded-sm flex items-center justify-center text-white shrink-0 ${colorMap.bg}`}>
        <Icon className="h-3.5 w-3.5" />
      </div>
      <div className="min-w-0">
        <div className="text-[10px] font-semibold uppercase tracking-wider text-slate-500 leading-tight">
          {label}
        </div>
        <div className={`text-lg font-bold leading-none mt-1 ${colorMap.text}`}>{value}</div>
      </div>
    </div>
  );
}
