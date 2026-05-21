"use client";

// OCR form — image preview + extracted text editor

import { useState, useRef, useCallback, type ChangeEvent } from "react";
import {
  Upload,
  Loader2,
  AlertCircle,
  X,
  Sparkles,
  Clock,
  Zap,
  Copy,
  Check,
  RotateCcw,
} from "lucide-react";

interface OcrResult {
  text: string;
  detectedLines: number;
  confidence: number;
  reasoning: string;
  model: string;
  tokensUsed: number;
  elapsedMs: number;
  filename: string;
  size: number;
  pages?: number;
}

function formatSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / 1024 / 1024).toFixed(2)} MB`;
}

export function OcrForm() {
  const fileInput = useRef<HTMLInputElement>(null);
  const [file, setFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [dragOver, setDragOver] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<OcrResult | null>(null);
  const [editedText, setEditedText] = useState("");
  const [copied, setCopied] = useState(false);
  const [progress, setProgress] = useState<{ current: number; total: number } | null>(null);

  function pickFile(f: File | null) {
    setFile(f);
    setResult(null);
    setEditedText("");
    setError(null);
    if (f) {
      const reader = new FileReader();
      reader.onload = () => setImagePreview(reader.result as string);
      reader.readAsDataURL(f);
    } else {
      setImagePreview(null);
    }
  }

  function onChange(e: ChangeEvent<HTMLInputElement>) {
    pickFile(e.target.files?.[0] ?? null);
  }

  const onDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    pickFile(e.dataTransfer.files?.[0] ?? null);
  }, []);

  /** Send single file to /api/ai/ocr — returns parsed result */
  async function ocrSingle(f: File): Promise<OcrResult> {
    const fd = new FormData();
    fd.append("file", f);
    const res = await fetch("/api/ai/ocr", { method: "POST", body: fd });
    const raw = await res.text();
    let data: { success?: boolean; message?: string; data?: OcrResult } | null = null;
    try {
      data = JSON.parse(raw);
    } catch {
      if (res.status === 504 || /timeout|timed out/i.test(raw)) {
        throw new Error("Server timeout (60s) — Opus ใช้เวลานานเกินไปสำหรับหน้านี้");
      }
      throw new Error(`Server error ${res.status}`);
    }
    if (!res.ok || !data?.success || !data.data) {
      throw new Error(data?.message || "OCR ไม่สำเร็จ");
    }
    return data.data;
  }

  async function handleOcr() {
    if (!file) return;
    setLoading(true);
    setError(null);
    setResult(null);
    setProgress(null);

    try {
      // ─── Non-PDF (image) → single call ───
      if (file.type !== "application/pdf") {
        const out = await ocrSingle(file);
        setResult(out);
        setEditedText(out.text);
        return;
      }

      // ─── PDF → split in browser + process page-by-page ───
      const { PDFDocument } = await import("pdf-lib");
      const src = await PDFDocument.load(await file.arrayBuffer());
      const pageCount = src.getPageCount();

      // Hard cap (matches backend MAX_PDF_PAGES)
      if (pageCount > 10) {
        throw new Error(
          `PDF มี ${pageCount} หน้า — เกินขีดจำกัด 10 หน้า กรุณาแยกไฟล์`
        );
      }

      // If single page, just send as-is
      if (pageCount === 1) {
        const out = await ocrSingle(file);
        setResult(out);
        setEditedText(out.text);
        return;
      }

      // Multi-page → process each page in browser-split PDF
      setProgress({ current: 0, total: pageCount });
      const pageTexts: string[] = [];
      let totalTokens = 0;
      let totalElapsed = 0;
      let totalLines = 0;
      const confidences: number[] = [];
      const failedPages: number[] = [];

      const t0 = Date.now();
      for (let i = 0; i < pageCount; i++) {
        setProgress({ current: i + 1, total: pageCount });

        try {
          // Build single-page PDF
          const onePage = await PDFDocument.create();
          const [copied] = await onePage.copyPages(src, [i]);
          onePage.addPage(copied);
          const bytes = await onePage.save();
          const pageFile = new File(
            [new Blob([new Uint8Array(bytes)], { type: "application/pdf" })],
            `page-${i + 1}.pdf`,
            { type: "application/pdf" }
          );

          const out = await ocrSingle(pageFile);
          pageTexts.push(`--- หน้า ${i + 1} ---\n${out.text}`);
          totalTokens += out.tokensUsed;
          totalLines += out.detectedLines;
          if (typeof out.confidence === "number") confidences.push(out.confidence);
        } catch (err) {
          failedPages.push(i + 1);
          pageTexts.push(
            `--- หน้า ${i + 1} ---\n[OCR ล้มเหลว: ${err instanceof Error ? err.message : "unknown"}]`
          );
        }
      }
      totalElapsed = Date.now() - t0;

      const aggregated: OcrResult = {
        text: pageTexts.join("\n\n"),
        detectedLines: totalLines,
        pages: pageCount,
        confidence:
          confidences.length > 0
            ? confidences.reduce((a, b) => a + b, 0) / confidences.length
            : 0.8,
        reasoning:
          failedPages.length > 0
            ? `OCR สำเร็จ ${pageCount - failedPages.length}/${pageCount} หน้า · ล้มเหลวหน้า: ${failedPages.join(", ")}`
            : `OCR ครบ ${pageCount} หน้า`,
        model: "claude-opus-4-5",
        tokensUsed: totalTokens,
        elapsedMs: totalElapsed,
        filename: file.name,
        size: file.size,
      };

      setResult(aggregated);
      setEditedText(aggregated.text);
      if (failedPages.length > 0) {
        setError(`⚠️ บางหน้า OCR ล้มเหลว (หน้า: ${failedPages.join(", ")}) — text รวมข้อความที่อ่านได้แล้ว`);
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : "เกิดข้อผิดพลาด");
    } finally {
      setLoading(false);
      setProgress(null);
    }
  }

  async function copyText() {
    await navigator.clipboard.writeText(editedText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  function resetEdits() {
    if (result) setEditedText(result.text);
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* LEFT — Image preview / Upload */}
      <div className="space-y-4">
        {!file ? (
          <div
            onDragOver={(e) => {
              e.preventDefault();
              setDragOver(true);
            }}
            onDragLeave={() => setDragOver(false)}
            onDrop={onDrop}
            onClick={() => fileInput.current?.click()}
            className={`rounded-sm border-2 border-dashed transition-colors cursor-pointer p-12 text-center min-h-[420px] flex flex-col items-center justify-center ${
              dragOver
                ? "border-[#1e3a5f] bg-[#1e3a5f]/5"
                : "border-slate-300 bg-white hover:border-[#1e3a5f]/50 hover:bg-slate-50"
            }`}
          >
            <input
              ref={fileInput}
              type="file"
              accept="image/jpeg,image/png,application/pdf"
              onChange={onChange}
              className="hidden"
            />
            <Upload className="h-12 w-12 text-slate-400 mb-3" />
            <p className="text-sm font-medium text-slate-700">
              ลากภาพ/PDF มาวางที่นี่ หรือคลิกเพื่อเลือก
            </p>
            <p className="text-xs text-slate-500 mt-1.5">
              JPG · PNG · PDF (สูงสุด 10 MB)
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {/* Preview — image or PDF */}
            <div className="rounded-sm border border-slate-200 bg-white overflow-hidden">
              <div className="aspect-[4/5] bg-slate-100 relative flex items-center justify-center">
                {imagePreview && file.type.startsWith("image/") && (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={imagePreview}
                    alt={file.name}
                    className="absolute inset-0 w-full h-full object-contain"
                  />
                )}
                {imagePreview && file.type === "application/pdf" && (
                  <iframe
                    src={imagePreview}
                    className="absolute inset-0 w-full h-full"
                    title={file.name}
                  />
                )}
              </div>
            </div>

            {/* File info + action */}
            <div className="rounded-sm border border-slate-200 bg-white p-3">
              <div className="flex items-center justify-between gap-2">
                <div className="min-w-0">
                  <p className="text-xs font-medium text-slate-900 truncate">
                    {file.name}
                  </p>
                  <p className="text-[11px] text-slate-500">
                    {formatSize(file.size)} · {file.type}
                  </p>
                </div>
                <button
                  onClick={() => pickFile(null)}
                  className="text-slate-400 hover:text-slate-700 shrink-0"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>

              <button
                onClick={handleOcr}
                disabled={loading}
                className="w-full mt-3 inline-flex items-center justify-center gap-2 rounded-sm bg-[#1e3a5f] hover:bg-[#142a45] border border-[#142a45] text-white py-2.5 text-sm font-semibold transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    {progress ? (
                      <span>
                        AI อ่านหน้า {progress.current}/{progress.total}...
                      </span>
                    ) : (
                      "AI กำลังอ่านข้อความ..."
                    )}
                  </>
                ) : (
                  <>
                    <Sparkles className="h-4 w-4" />
                    สกัดข้อความ
                  </>
                )}
              </button>

              {/* Progress bar (only for multi-page PDF) */}
              {loading && progress && progress.total > 1 && (
                <div className="mt-2">
                  <div className="h-1.5 bg-slate-200 rounded overflow-hidden">
                    <div
                      className="h-full bg-blue-600 transition-all duration-300"
                      style={{ width: `${(progress.current / progress.total) * 100}%` }}
                    />
                  </div>
                  <div className="text-[10px] text-slate-500 mt-1 text-center">
                    {progress.current} / {progress.total} หน้า · ~10-15 วินาที/หน้า
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {error && (
          <div className="rounded-sm border border-rose-300 bg-rose-50 p-3 text-sm text-rose-700 flex items-start gap-2">
            <AlertCircle className="h-4 w-4 mt-0.5 shrink-0" />
            <span>{error}</span>
          </div>
        )}
      </div>

      {/* RIGHT — Extracted text editor */}
      <div className="rounded-sm border border-slate-200 bg-white">
        <div className="flex items-center justify-between px-4 py-3 border-b border-slate-100">
          <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-500">
            ข้อความที่สกัดได้
          </h3>
          {result && (
            <div className="flex items-center gap-2">
              <button
                onClick={resetEdits}
                title="ย้อนกลับเป็นต้นฉบับ"
                className="text-[11px] text-slate-500 hover:text-slate-800 inline-flex items-center gap-1"
              >
                <RotateCcw className="h-3 w-3" />
                ย้อนกลับ
              </button>
              <button
                onClick={copyText}
                className="text-[11px] text-slate-500 hover:text-slate-800 inline-flex items-center gap-1"
              >
                {copied ? (
                  <>
                    <Check className="h-3 w-3 text-emerald-600" />
                    คัดลอกแล้ว
                  </>
                ) : (
                  <>
                    <Copy className="h-3 w-3" />
                    คัดลอก
                  </>
                )}
              </button>
            </div>
          )}
        </div>

        {!result && !loading && (
          <div className="flex flex-col items-center justify-center h-96 text-center text-slate-400 p-6">
            <ScanIcon />
            <p className="text-sm mt-3">
              อัปโหลดภาพและกด "สกัดข้อความ"
            </p>
            <p className="text-xs mt-2 text-slate-300">
              ข้อความจะปรากฏที่นี่ — แก้ไขได้
            </p>
          </div>
        )}

        {loading && (
          <div className="flex flex-col items-center justify-center h-96 text-center">
            <Loader2 className="h-10 w-10 animate-spin text-[#1e3a5f]" />
            <p className="text-sm text-slate-600 mt-3">
              AI กำลังอ่านข้อความ...
            </p>
            <p className="text-xs text-slate-400 mt-1">
              ใช้เวลาประมาณ 15-25 วินาที
            </p>
          </div>
        )}

        {result && (
          <div className="flex flex-col h-[500px]">
            {/* Meta strip */}
            <div className="grid grid-cols-4 gap-px bg-slate-100 border-b border-slate-100">
              <Meta
                label="ความมั่นใจ"
                value={`${Math.round(result.confidence * 100)}%`}
                accent={result.confidence >= 0.8 ? "good" : "warn"}
              />
              <Meta
                label="บรรทัด"
                value={String(result.detectedLines)}
              />
              <Meta
                label="เวลา"
                icon={<Clock className="h-3 w-3" />}
                value={`${(result.elapsedMs / 1000).toFixed(1)}s`}
              />
              <Meta
                label="โมเดล"
                icon={<Zap className="h-3 w-3" />}
                value={result.model.split("-").slice(0, 2).join("-")}
              />
            </div>

            {/* Editable text */}
            <textarea
              value={editedText}
              onChange={(e) => setEditedText(e.target.value)}
              className="flex-1 w-full p-4 text-sm text-slate-800 font-mono leading-relaxed resize-none focus:outline-none focus:bg-slate-50/50 whitespace-pre-wrap"
              spellCheck={false}
            />

            {/* Reasoning */}
            {result.reasoning && (
              <div className="border-t border-slate-100 px-4 py-2.5 bg-slate-50/50">
                <div className="text-[10px] font-semibold uppercase tracking-wider text-slate-500 mb-1">
                  ข้อสังเกต AI
                </div>
                <p className="text-xs text-slate-600 leading-relaxed">
                  {result.reasoning}
                </p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

function Meta({
  label,
  value,
  icon,
  accent,
}: {
  label: string;
  value: string;
  icon?: React.ReactNode;
  accent?: "good" | "warn";
}) {
  return (
    <div className="bg-white px-3 py-2 text-center">
      <div className="flex items-center justify-center gap-1 text-[9px] uppercase tracking-wider text-slate-500">
        {icon}
        {label}
      </div>
      <div
        className={`text-sm font-semibold tabular-nums mt-0.5 ${
          accent === "good"
            ? "text-emerald-700"
            : accent === "warn"
              ? "text-amber-700"
              : "text-slate-800"
        }`}
      >
        {value}
      </div>
    </div>
  );
}

function ScanIcon() {
  return (
    <svg
      className="h-12 w-12 opacity-30 text-slate-400"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
    >
      <path d="M3 7V5a2 2 0 0 1 2-2h2M17 3h2a2 2 0 0 1 2 2v2M21 17v2a2 2 0 0 1-2 2h-2M7 21H5a2 2 0 0 1-2-2v-2M7 9h10M7 13h10M7 17h6" />
    </svg>
  );
}
