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

  async function handleOcr() {
    if (!file) return;
    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const fd = new FormData();
      fd.append("file", file);

      const res = await fetch("/api/ai/ocr", {
        method: "POST",
        body: fd,
      });

      // Parse JSON safely — Vercel timeouts/errors return non-JSON text
      const raw = await res.text();
      let data: { success?: boolean; message?: string; data?: OcrResult & { filename: string; size: number } } | null = null;
      try {
        data = JSON.parse(raw);
      } catch {
        // Non-JSON response → likely Vercel timeout or runtime error
        if (res.status === 504 || /timeout|timed out/i.test(raw)) {
          throw new Error(
            "OCR ใช้เวลานานเกินไป — Vercel function timeout (Hobby plan สูงสุด 60 วินาที). " +
              "Opus 4.5 ใช้เวลา ~10-15 วินาที/หน้า → realistic limit ~3-4 หน้าต่อ request. " +
              "ถ้าอยาก OCR 30 หน้าใน production ต้องอัพเกรด Vercel Pro plan"
          );
        }
        throw new Error(
          `Server error ${res.status} — กรุณาลองใหม่ (อาจเป็น Vercel timeout จาก PDF ยาว)`
        );
      }
      if (!res.ok || !data?.success || !data.data) {
        throw new Error(data?.message || "OCR ไม่สำเร็จ");
      }

      setResult(data.data);
      setEditedText(data.data.text);
    } catch (e) {
      setError(e instanceof Error ? e.message : "เกิดข้อผิดพลาด");
    } finally {
      setLoading(false);
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
                    AI กำลังอ่านข้อความ...
                  </>
                ) : (
                  <>
                    <Sparkles className="h-4 w-4" />
                    สกัดข้อความ
                  </>
                )}
              </button>
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
