"use client";

// Upload + classify UI

import { useState, useRef, useCallback, type ChangeEvent } from "react";
import {
  Upload,
  FileText,
  Loader2,
  CheckCircle2,
  AlertCircle,
  X,
  Sparkles,
  Clock,
  Zap,
  FileType,
} from "lucide-react";

const UNIT_CATEGORIES = [
  { code: "ยศ.", name: "กองยุทธศาสตร์" },
  { code: "ผบ.", name: "กองแผนงานอำนวยการ" },
  { code: "มค.", name: "กองแผนงานความมั่นคง" },
  { code: "มข.", name: "กองแผนงานกิจการพิเศษ" },
  { code: "วจ.", name: "กองวิจัย" },
  { code: "อจ.", name: "ฝ่ายอำนวยการ สยศ.ตร." },
] as const;

const ACCEPTED = [
  ".docx",
  ".xlsx",
  ".xls",
  ".pdf",
  ".jpg",
  ".jpeg",
  ".png",
  ".txt",
];

interface ClassifyResult {
  documentId: string;
  unitCode: string;
  unitName: string;
  confidence: number;
  reasoning: string;
  extractedText: string;
  extractedMethod: string;
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

export function ClassifyForm() {
  const fileInput = useRef<HTMLInputElement>(null);
  const [file, setFile] = useState<File | null>(null);
  const [dragOver, setDragOver] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<ClassifyResult | null>(null);

  function pickFile(f: File | null) {
    setFile(f);
    setResult(null);
    setError(null);
  }

  function onChange(e: ChangeEvent<HTMLInputElement>) {
    pickFile(e.target.files?.[0] ?? null);
  }

  const onDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const f = e.dataTransfer.files?.[0];
    if (f) pickFile(f);
  }, []);

  async function handleClassify() {
    if (!file) return;
    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const fd = new FormData();
      fd.append("file", file);

      const res = await fetch("/api/ai/classify", {
        method: "POST",
        body: fd,
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.message || "จำแนกเอกสารไม่สำเร็จ");
      }

      setResult(data.data);
    } catch (e) {
      setError(e instanceof Error ? e.message : "เกิดข้อผิดพลาด");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
      {/* LEFT — Upload (2/5) */}
      <div className="lg:col-span-2 space-y-4">
        {/* Drop zone */}
        <div
          onDragOver={(e) => {
            e.preventDefault();
            setDragOver(true);
          }}
          onDragLeave={() => setDragOver(false)}
          onDrop={onDrop}
          onClick={() => fileInput.current?.click()}
          className={`rounded-sm border-2 border-dashed transition-colors cursor-pointer p-8 text-center ${
            dragOver
              ? "border-[#1e3a5f] bg-[#1e3a5f]/5"
              : "border-slate-300 bg-white hover:border-[#1e3a5f]/50 hover:bg-slate-50"
          }`}
        >
          <input
            ref={fileInput}
            type="file"
            accept={ACCEPTED.join(",")}
            onChange={onChange}
            className="hidden"
          />
          <Upload className="h-10 w-10 text-slate-400 mx-auto mb-3" />
          <p className="text-sm font-medium text-slate-700">
            ลากไฟล์มาวางที่นี่ หรือคลิกเพื่อเลือก
          </p>
          <p className="text-xs text-slate-500 mt-1.5">
            DOCX · XLSX · PDF · JPG · PNG · TXT (สูงสุด 10 MB)
          </p>
        </div>

        {/* Selected file */}
        {file && (
          <div className="rounded-sm border border-slate-200 bg-white p-4">
            <div className="flex items-start gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-sm bg-slate-100 text-slate-600">
                <FileType className="h-5 w-5" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-slate-900 truncate">
                  {file.name}
                </p>
                <p className="text-xs text-slate-500 mt-0.5">
                  {formatSize(file.size)} · {file.type || "unknown"}
                </p>
              </div>
              <button
                onClick={() => {
                  setFile(null);
                  setResult(null);
                }}
                className="text-slate-400 hover:text-slate-700"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <button
              onClick={handleClassify}
              disabled={loading}
              className="w-full mt-4 inline-flex items-center justify-center gap-2 rounded-sm bg-[#1e3a5f] hover:bg-[#142a45] border border-[#142a45] text-white py-2.5 text-sm font-semibold transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  AI กำลังจำแนก...
                </>
              ) : (
                <>
                  <Sparkles className="h-4 w-4" />
                  จำแนกด้วย AI
                </>
              )}
            </button>
          </div>
        )}

        {error && (
          <div className="rounded-sm border border-rose-300 bg-rose-50 p-3 text-sm text-rose-700 flex items-start gap-2">
            <AlertCircle className="h-4 w-4 mt-0.5 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Unit reference card */}
        <div className="rounded-sm border border-slate-200 bg-slate-50/50 p-4">
          <h3 className="text-[11px] font-semibold uppercase tracking-wider text-slate-500 mb-2.5">
            6 หน่วยงาน
          </h3>
          <div className="space-y-1.5">
            {UNIT_CATEGORIES.map((u) => (
              <div key={u.code} className="flex items-center gap-2 text-xs">
                <span className="inline-flex items-center justify-center min-w-[28px] px-1.5 py-0.5 rounded-sm bg-white border border-slate-300 font-mono text-slate-700">
                  {u.code}
                </span>
                <span className="text-slate-600">{u.name}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* RIGHT — Result (3/5) */}
      <div className="lg:col-span-3">
        <div className="rounded-sm border border-slate-200 bg-white p-6 min-h-[400px]">
          {!result && !loading && (
            <div className="flex flex-col items-center justify-center h-96 text-center text-slate-400">
              <FileText className="h-12 w-12 mb-3 opacity-30" />
              <p className="text-sm">เลือกไฟล์ แล้วกด "จำแนกด้วย AI"</p>
              <p className="text-xs mt-2 text-slate-300">
                ผลลัพธ์จะแสดงที่นี่ — หมวดหน่วยงาน + ความมั่นใจ + เหตุผล
              </p>
            </div>
          )}

          {loading && (
            <div className="flex flex-col items-center justify-center h-96 text-center">
              <Loader2 className="h-12 w-12 animate-spin text-[#1e3a5f]" />
              <p className="text-sm text-slate-600 mt-3">
                AI กำลังวิเคราะห์เอกสาร...
              </p>
              <p className="text-xs text-slate-400 mt-1">
                ใช้เวลาประมาณ 10-20 วินาที
              </p>
            </div>
          )}

          {result && <ResultCard result={result} />}
        </div>
      </div>
    </div>
  );
}

function ResultCard({ result }: { result: ClassifyResult }) {
  const cat = UNIT_CATEGORIES.find((u) => u.code === result.unitCode);
  const confidencePct = Math.round(result.confidence * 100);
  const isHighConf = confidencePct >= 80;

  return (
    <div className="space-y-5">
      {/* Top: confidence */}
      <div className="flex items-start justify-between pb-4 border-b border-slate-100">
        <div>
          <div className="text-[10px] font-semibold uppercase tracking-wider text-[#b8860b] mb-1">
            ผลการจำแนก
          </div>
          <div className="flex items-baseline gap-2">
            <span className="font-mono text-xl font-semibold text-[#1e3a5f]">
              {result.unitCode}
            </span>
            <span className="text-base text-slate-700">
              {cat?.name ?? result.unitName}
            </span>
          </div>
        </div>
        <div className="text-right">
          <div className="flex items-center gap-1.5 justify-end">
            {isHighConf ? (
              <CheckCircle2 className="h-4 w-4 text-emerald-600" />
            ) : (
              <AlertCircle className="h-4 w-4 text-amber-600" />
            )}
            <span
              className={`font-mono text-xl font-semibold tabular-nums ${
                isHighConf ? "text-emerald-700" : "text-amber-700"
              }`}
            >
              {confidencePct}%
            </span>
          </div>
          <div className="text-[10px] text-slate-500 uppercase tracking-wider">
            ความมั่นใจ
          </div>
        </div>
      </div>

      {/* Confidence bar */}
      <div>
        <div className="h-1.5 w-full rounded-sm bg-slate-100 overflow-hidden">
          <div
            className={`h-full rounded-sm transition-all ${
              isHighConf ? "bg-emerald-500" : "bg-amber-500"
            }`}
            style={{ width: `${confidencePct}%` }}
          />
        </div>
      </div>

      {/* Reasoning */}
      <div>
        <div className="text-[11px] font-semibold uppercase tracking-wider text-slate-500 mb-2">
          เหตุผลของ AI
        </div>
        <p className="text-sm text-slate-700 leading-relaxed bg-slate-50 rounded-sm border border-slate-100 p-3">
          {result.reasoning}
        </p>
      </div>

      {/* Extracted text */}
      {result.extractedText && (
        <div>
          <div className="text-[11px] font-semibold uppercase tracking-wider text-slate-500 mb-2">
            สรุปเนื้อหา / ข้อความที่สกัดได้
          </div>
          <div className="text-sm text-slate-700 leading-relaxed bg-slate-50 rounded-sm border border-slate-100 p-3 max-h-48 overflow-y-auto whitespace-pre-wrap">
            {result.extractedText}
          </div>
        </div>
      )}

      {/* Meta */}
      <div className="grid grid-cols-3 gap-2 pt-4 border-t border-slate-100">
        <Meta
          icon={<Zap className="h-3 w-3" />}
          label="โมเดล"
          value={result.model}
        />
        <Meta
          icon={<Clock className="h-3 w-3" />}
          label="เวลาที่ใช้"
          value={`${(result.elapsedMs / 1000).toFixed(1)} วินาที`}
        />
        <Meta
          icon={<FileText className="h-3 w-3" />}
          label="วิธีสกัด"
          value={result.extractedMethod.split("/")[0]}
        />
      </div>
    </div>
  );
}

function Meta({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
}) {
  return (
    <div className="text-center">
      <div className="flex items-center justify-center gap-1 text-[10px] text-slate-500 uppercase tracking-wider mb-1">
        {icon}
        {label}
      </div>
      <div className="text-xs font-medium text-slate-800 truncate">
        {value}
      </div>
    </div>
  );
}
