"use client";

import { useState, useRef } from "react";
import {
  UploadCloud,
  FileText,
  Loader2,
  CheckCircle2,
  Sparkles,
  Tag,
  X,
  AlertCircle,
  BarChart3,
  Clock,
  FileCheck,
} from "lucide-react";
import {
  CATEGORY_STYLES,
  CATEGORY_DESCRIPTIONS,
  DOC_CATEGORIES,
  type DocCategory,
} from "@/lib/intelligence/types";
import { MAX_UPLOAD_BYTES, formatBytes, safeJson } from "@/lib/utils";

interface RecentItem {
  id: string;
  title: string;
  fileName: string;
  category: DocCategory;
  confidence: number;
  summary: string;
  extractedText: string;
}

interface SingleClassifyResult {
  filename?: string;
  results: {
    category: DocCategory;
    matches: string[];
    confidence: number;
    categoryDescription: string;
  }[];
  allResults: {
    category: DocCategory;
    matches: string[];
    confidence: number;
    categoryDescription: string;
  }[];
  predicted: DocCategory;
  predictedConfidence: number;
  reasoning?: string;
  processingTimeMs: number;
  method: "ai" | "keyword-fallback";
}

interface BatchEntry {
  filename: string;
  fileSize?: number;
  fileType?: string;
  textLength?: number;
  ok: boolean;
  error?: string;
  result?: {
    predicted: DocCategory;
    predictedConfidence: number;
    results: {
      category: DocCategory;
      categoryDescription: string;
      confidence: number;
      matches: string[];
    }[];
    reasoning?: string;
    processingTimeMs: number;
    method: "ai" | "keyword-fallback";
  };
}

interface BatchResult {
  entries: BatchEntry[];
  summary: {
    total: number;
    successful: number;
    failed: number;
    byCategory: Record<string, number>;
    avgConfidence: number;
    totalMs: number;
    avgMsPerFile: number;
  };
}

type Mode = "single" | "batch";

const EXAMPLE_TEXTS = [
  {
    label: "ตัวอย่าง: ยุทธศาสตร์",
    expectedCategory: "ยศ." as DocCategory,
    text: "แผนปฏิบัติราชการประจำปีงบประมาณ ๒๕๖๙ จัดทำขึ้นโดยให้สอดคล้องกับยุทธศาสตร์ชาติ ๒๐ ปี และแผนแม่บทภายใต้ยุทธศาสตร์ชาติ กำหนดตัวชี้วัด KPI จำนวน ๔๒ ตัว",
  },
  {
    label: "ตัวอย่าง: ความมั่นคง",
    expectedCategory: "มค." as DocCategory,
    text: "รายงานสถานการณ์ความมั่นคงในพื้นที่ ๓ จังหวัดชายแดนภาคใต้ ปัตตานี ยะลา นราธิวาส รายงานเหตุการณ์ความรุนแรงและการก่อความวุ่นวาย พร้อมข้อมูลข่าวกรองเกี่ยวกับกลุ่มเคลื่อนไหว",
  },
  {
    label: "ตัวอย่าง: กิจการพิเศษ",
    expectedCategory: "มข." as DocCategory,
    text: "แผนปฏิบัติการปราบปรามยาเสพติดในพื้นที่ภาคอีสานตอนบน บูรณาการกับ ป.ป.ส. และ ตชด. เน้นการสกัดที่ชายแดนและปราบปรามขบวนการค้ายาเสพติด",
  },
  {
    label: "ตัวอย่าง: วิจัย",
    expectedCategory: "วจ." as DocCategory,
    text: "รายงานผลการวิจัยปัจจัยที่ส่งผลต่อความพึงพอใจของประชาชนต่องานตำรวจ กลุ่มตัวอย่าง ๔,๒๐๐ คน วิเคราะห์ทางสถิติ พบว่าความเร็วในการตอบสนองมีอิทธิพลสูงสุด β = 0.42",
  },
  {
    label: "ตัวอย่าง: อำนวยการ",
    expectedCategory: "ผบ." as DocCategory,
    text: "คำสั่งสำนักงานตำรวจแห่งชาติ ที่ ๔๒๐/๒๕๖๗ เรื่อง การจัดสรรงบประมาณรายจ่าย ประจำปีงบประมาณ ๒๕๖๘ ให้กับหน่วยงานในสังกัด ตามระเบียบกระทรวงการคลัง",
  },
  {
    label: "ตัวอย่าง: ธุรการ",
    expectedCategory: "อจ." as DocCategory,
    text: "บันทึกข้อความ เรียน ผอ.ฝ่ายอำนวยการ เรื่อง ขอเชิญประชุมประจำสัปดาห์ วันพุธที่ ๒๖ พ.ค. เวลา ๐๙.๓๐ น. ณ ห้องประชุม สยศ.ตร. โดยมีระเบียบวาระตามที่แจ้งเวียน",
  },
];

export function ClassifyDemo({ recent }: { recent: RecentItem[] }) {
  return (
    <div className="space-y-5">
      <BatchClassify />

      {/* Recent */}
      <RecentSection recent={recent} />
    </div>
  );
}

// ── Single mode ───────────────────────────────────

function SingleClassify() {
  const [text, setText] = useState("");
  const [expectedCategory, setExpectedCategory] = useState<DocCategory | null>(null);
  const [result, setResult] = useState<SingleClassifyResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function classify() {
    if (!text.trim()) {
      setError("กรุณาใส่ข้อความก่อนวิเคราะห์");
      return;
    }
    setError(null);
    setResult(null);
    setLoading(true);
    try {
      const res = await fetch("/api/intelligence/classify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text }),
      });
      const j = await safeJson(res);
      if (j.success) {
        setResult(j.data as SingleClassifyResult);
      } else {
        setError(j.message ?? "วิเคราะห์ไม่สำเร็จ");
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : "เกิดข้อผิดพลาด");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-5">
      {/* Input */}
      <section className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-sm overflow-hidden">
        <div className="border-b border-slate-100 dark:border-slate-800 px-5 py-3">
          <h2 className="text-sm font-semibold text-slate-900 dark:text-slate-100">
            วางข้อความเอกสารที่ต้องการจำแนก
          </h2>
        </div>
        <div className="p-5 space-y-4">
          <textarea
            suppressHydrationWarning
            value={text}
            onChange={(e) => {
              setText(e.target.value);
              setExpectedCategory(null);
            }}
            placeholder="วางข้อความเอกสารราชการ หรือเลือกตัวอย่างด้านล่าง..."
            className="w-full h-32 border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950 rounded-sm p-3 text-sm leading-relaxed focus:outline-none focus:border-[#1e3a5f]"
          />

          <div className="flex items-center justify-between gap-3 flex-wrap">
            <div className="flex flex-wrap gap-2">
              {EXAMPLE_TEXTS.map((ex) => (
                <button
                  key={ex.label}
                  type="button"
                  suppressHydrationWarning
                  onClick={() => {
                    setText(ex.text);
                    setExpectedCategory(ex.expectedCategory);
                    setResult(null);
                  }}
                  disabled={loading}
                  className="text-xs rounded-sm border border-slate-200 dark:border-slate-700 hover:border-[#1e3a5f] hover:bg-blue-50 dark:hover:bg-blue-900/20 disabled:opacity-50 px-3 py-1.5 text-slate-700 dark:text-slate-300"
                >
                  {ex.label}
                </button>
              ))}
            </div>
            <button
              type="button"
              suppressHydrationWarning
              onClick={classify}
              disabled={loading || !text.trim()}
              className="inline-flex items-center gap-1.5 rounded-sm bg-[#1e3a5f] hover:bg-[#142a45] disabled:bg-slate-300 disabled:cursor-not-allowed text-white text-sm font-medium px-4 py-2 transition-colors"
            >
              {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
              {loading ? "กำลังวิเคราะห์..." : "วิเคราะห์ด้วย AI"}
            </button>
          </div>
        </div>
      </section>

      {error && (
        <div className="border border-red-300 bg-red-50 rounded-sm p-4 text-sm text-red-800">
          {error}
        </div>
      )}

      {result && (
        <ResultPanel result={result} expectedCategory={expectedCategory} />
      )}
    </div>
  );
}

// ── Result panel ──────────────────────────────────

function ResultPanel({
  result,
  expectedCategory,
}: {
  result: SingleClassifyResult;
  expectedCategory: DocCategory | null;
}) {
  const correct = expectedCategory ? expectedCategory === result.predicted : null;

  return (
    <section className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-sm overflow-hidden">
      <div className="border-b border-slate-100 dark:border-slate-800 px-5 py-3 flex items-center gap-2 flex-wrap">
        <CheckCircle2 className="h-4 w-4 text-emerald-600" />
        <span className="text-sm font-semibold text-slate-900 dark:text-slate-100">
          ผลการจำแนก
        </span>
        <span className="text-xs text-slate-500 ml-auto">
          {result.method === "ai" ? "AI Engine" : "Keyword Fallback"} ·{" "}
          {(result.processingTimeMs / 1000).toFixed(2)} วินาที
        </span>
      </div>
      <div className="p-5 space-y-4">
        {/* Predicted */}
        <div>
          <div className="text-[10px] font-semibold uppercase tracking-wider text-slate-500 mb-1.5">
            หมวดที่ทำนาย
          </div>
          <div className="flex items-center gap-3 flex-wrap">
            <div className={`text-2xl font-bold px-3 py-1.5 rounded-sm border ${CATEGORY_STYLES[result.predicted]}`}>
              {result.predicted}
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                {result.results[0].categoryDescription}
              </div>
              <div className="text-xs text-slate-500 dark:text-slate-400">
                ความมั่นใจ {(result.predictedConfidence * 100).toFixed(1)}%
              </div>
            </div>
            {correct !== null && (
              <div className={`text-xs font-semibold px-2.5 py-1.5 rounded-sm ${
                correct
                  ? "bg-emerald-100 text-emerald-800 border border-emerald-300"
                  : "bg-red-100 text-red-800 border border-red-300"
              }`}>
                {correct ? "✓ ตรงกับ ground truth" : `✗ ground truth: ${expectedCategory}`}
              </div>
            )}
          </div>
        </div>

        {/* All 6 categories with bars */}
        <div>
          <div className="text-[10px] font-semibold uppercase tracking-wider text-slate-500 mb-2">
            ความน่าจะเป็นของทั้ง ๖ หมวด
          </div>
          <div className="space-y-2">
            {result.allResults.map((r, i) => (
              <div key={r.category} className="flex items-center gap-3">
                <div className={`text-xs font-bold px-2 py-1 rounded-sm border w-14 text-center ${CATEGORY_STYLES[r.category]}`}>
                  {r.category}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-0.5 text-xs">
                    <span className="text-slate-600 dark:text-slate-300">
                      {r.categoryDescription}
                    </span>
                    <span className="font-semibold text-slate-900 dark:text-slate-100 tabular-nums">
                      {(r.confidence * 100).toFixed(1)}%
                    </span>
                  </div>
                  <div className="w-full bg-slate-100 dark:bg-slate-800 rounded-sm h-2">
                    <div
                      className={`h-full rounded-sm transition-all ${
                        i === 0 ? "bg-emerald-500" : i === 1 ? "bg-amber-400" : "bg-slate-300 dark:bg-slate-600"
                      }`}
                      style={{ width: `${r.confidence * 100}%` }}
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Reasoning */}
        {result.reasoning && (
          <div className="border-t border-slate-100 dark:border-slate-800 pt-3">
            <div className="text-[10px] font-semibold uppercase tracking-wider text-slate-500 mb-1.5">
              เหตุผลในการตัดสินใจ
            </div>
            <div className="text-sm text-slate-700 dark:text-slate-300 leading-relaxed italic">
              {result.reasoning}
            </div>
          </div>
        )}

        {/* Matched keywords */}
        {result.results[0].matches.length > 0 && (
          <div className="border-t border-slate-100 dark:border-slate-800 pt-3">
            <div className="text-[10px] font-semibold uppercase tracking-wider text-slate-500 mb-2">
              คีย์เวิร์ดที่พบ
            </div>
            <div className="flex flex-wrap gap-1.5">
              {result.results[0].matches.map((k) => (
                <span
                  key={k}
                  className="inline-flex items-center gap-1 text-xs px-2 py-1 rounded-sm bg-amber-50 border border-amber-200 text-amber-900 dark:bg-amber-900/20 dark:text-amber-300 dark:border-amber-700"
                >
                  <Tag className="h-3 w-3" />
                  {k}
                </span>
              ))}
            </div>
          </div>
        )}
      </div>
    </section>
  );
}

// ── Batch mode ────────────────────────────────────

function BatchClassify() {
  const [files, setFiles] = useState<File[]>([]);
  const [dragging, setDragging] = useState(false);
  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [result, setResult] = useState<BatchResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const fileInput = useRef<HTMLInputElement>(null);

  function addFiles(newFiles: File[]) {
    const okType = newFiles.filter((f) => {
      const n = f.name.toLowerCase();
      return (
        n.endsWith(".docx") ||
        n.endsWith(".pdf") ||
        n.endsWith(".txt") ||
        n.endsWith(".md")
      );
    });
    const oversized = okType.filter((f) => f.size > MAX_UPLOAD_BYTES);
    const accepted = okType.filter((f) => f.size <= MAX_UPLOAD_BYTES);
    const wrongType = newFiles.length - okType.length;

    const problems: string[] = [];
    if (wrongType > 0) {
      problems.push(`ไม่รองรับ ${wrongType} ไฟล์ (รับเฉพาะ .pdf, .docx, .txt, .md)`);
    }
    if (oversized.length > 0) {
      problems.push(
        `ไฟล์ใหญ่เกิน ${formatBytes(MAX_UPLOAD_BYTES)}: ${oversized.map((f) => f.name).join(", ")}`
      );
    }
    setError(problems.length > 0 ? problems.join(" · ") : null);
    setFiles((prev) => [...prev, ...accepted].slice(0, 30));
  }

  function removeFile(i: number) {
    setFiles((prev) => prev.filter((_, idx) => idx !== i));
  }

  async function runBatch() {
    if (files.length === 0) {
      setError("กรุณาเลือกไฟล์อย่างน้อย ๑ ไฟล์");
      return;
    }
    const totalSize = files.reduce((sum, f) => sum + f.size, 0);
    if (totalSize > MAX_UPLOAD_BYTES) {
      setError(
        `ขนาดรวมของไฟล์ทั้งหมด ${formatBytes(totalSize)} เกินที่ระบบรองรับ (สูงสุด ${formatBytes(MAX_UPLOAD_BYTES)} ต่อครั้ง) — กรุณาแยกส่งทีละน้อย`
      );
      return;
    }
    setError(null);
    setResult(null);
    setLoading(true);
    setProgress(0);

    try {
      const fd = new FormData();
      for (const f of files) fd.append("files", f);
      // Sync endpoint — Vercel serverless requires inline processing
      const res = await fetch("/api/intelligence/classify/batch", {
        method: "POST",
        body: fd,
      });
      const j = await safeJson(res);
      if (j.success && j.data) {
        setResult(j.data as BatchResult);
        setProgress(100);
      } else {
        setError(j.message ?? "ส่งงานไม่สำเร็จ");
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : "เกิดข้อผิดพลาด");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-5">
      {/* Upload zone */}
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
          addFiles(Array.from(e.dataTransfer.files));
        }}
        className={`bg-white dark:bg-slate-900 border-2 border-dashed rounded-sm p-8 text-center transition-colors ${
          dragging
            ? "border-[#1e3a5f] bg-blue-50 dark:bg-blue-900/20"
            : "border-slate-300 dark:border-slate-700"
        }`}
      >
        <UploadCloud className="h-12 w-12 text-slate-400 mx-auto mb-2" />
        <div className="text-base font-semibold text-slate-900 dark:text-slate-100 mb-1">
          ลากไฟล์มาวางที่นี่ หรือคลิกเพื่อเลือก
        </div>
        <div className="text-xs text-slate-500 mb-3">
          รองรับ <strong>.pdf, .docx, .txt, .md</strong> — สูงสุด ๓๐ ไฟล์ต่อครั้ง · ขนาดรวมไม่เกิน{" "}
          {formatBytes(MAX_UPLOAD_BYTES)}
          <br />
          <span className="text-[10px]">PDF แบบ scan ระบบจะใช้ AI Vision อ่านโดยตรง</span>
        </div>
        <input
          ref={fileInput}
          type="file"
          multiple
          accept=".pdf,.docx,.txt,.md,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document,text/plain,text/markdown"
          onChange={(e) => {
            if (e.target.files) addFiles(Array.from(e.target.files));
            if (fileInput.current) fileInput.current.value = "";
          }}
          className="hidden"
        />
        <button
          type="button"
          suppressHydrationWarning
          onClick={() => fileInput.current?.click()}
          disabled={loading}
          className="inline-flex items-center gap-1.5 rounded-sm bg-[#1e3a5f] hover:bg-[#142a45] disabled:bg-slate-300 text-white text-sm font-medium px-4 py-2"
        >
          <FileText className="h-4 w-4" />
          เลือกไฟล์
        </button>
      </section>

      {/* Selected file list */}
      {files.length > 0 && (
        <section className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-sm overflow-hidden">
          <div className="border-b border-slate-100 dark:border-slate-800 px-5 py-3 flex items-center justify-between">
            <div className="text-sm font-semibold text-slate-900 dark:text-slate-100">
              ไฟล์ที่จะวิเคราะห์ ({files.length})
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                suppressHydrationWarning
                onClick={() => setFiles([])}
                disabled={loading}
                className="text-xs text-slate-500 hover:text-red-600 disabled:opacity-50"
              >
                ล้างทั้งหมด
              </button>
              <button
                type="button"
                suppressHydrationWarning
                onClick={runBatch}
                disabled={loading || files.length === 0}
                className="inline-flex items-center gap-1.5 rounded-sm bg-[#1e3a5f] hover:bg-[#142a45] disabled:bg-slate-300 text-white text-sm font-medium px-4 py-1.5"
              >
                {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
                {loading ? "กำลังประมวลผล..." : `จำแนกทั้งหมด (${files.length} ไฟล์)`}
              </button>
            </div>
          </div>
          <ul className="divide-y divide-slate-100 dark:divide-slate-800 max-h-60 overflow-y-auto">
            {files.map((f, i) => (
              <li key={i} className="px-5 py-2 flex items-center gap-3 text-sm">
                <FileText className="h-4 w-4 text-slate-400 shrink-0" />
                <span className="flex-1 truncate text-slate-700 dark:text-slate-300">{f.name}</span>
                <span className="text-xs text-slate-500 shrink-0">
                  {(f.size / 1024).toFixed(1)} KB
                </span>
                <button
                  type="button"
                  suppressHydrationWarning
                  onClick={() => removeFile(i)}
                  disabled={loading}
                  className="text-slate-400 hover:text-red-600 disabled:opacity-50"
                  aria-label="ลบ"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              </li>
            ))}
          </ul>
        </section>
      )}

      {/* Loading progress */}
      {loading && (
        <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-700 rounded-sm p-4">
          <div className="flex items-center gap-2 mb-2">
            <Loader2 className="h-4 w-4 text-blue-700 dark:text-blue-300 animate-spin" />
            <span className="text-sm font-semibold text-blue-900 dark:text-blue-200">
              AI Engine กำลังวิเคราะห์ {files.length} ไฟล์...
            </span>
          </div>
          <div className="h-2 bg-blue-100 dark:bg-blue-900/40 rounded-sm overflow-hidden">
            <div
              className="h-full bg-blue-600 transition-all"
              style={{ width: `${progress}%` }}
            />
          </div>
          <div className="text-[11px] text-blue-700 dark:text-blue-300 mt-1.5">
            ดึงข้อความ DOCX → ส่งเข้า AI → จัดอันดับหมวด · ใช้เวลา ~3-5 วินาที/ไฟล์
          </div>
        </div>
      )}

      {error && (
        <div className="border border-red-300 bg-red-50 rounded-sm p-4 text-sm text-red-800 flex items-center gap-2">
          <AlertCircle className="h-4 w-4" />
          {error}
        </div>
      )}

      {/* Batch results */}
      {result && <BatchResults result={result} />}
    </div>
  );
}

// ── Batch results display ─────────────────────────

function BatchResults({ result }: { result: BatchResult }) {
  const successful = result.entries.filter((e) => e.ok && e.result);

  return (
    <div className="space-y-4">
      {/* Summary stats */}
      <section className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-sm p-5">
        <div className="flex items-center gap-2 mb-3">
          <BarChart3 className="h-4 w-4 text-[#b8860b]" />
          <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">
            สรุปผลการจำแนก
          </h3>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <Stat label="ไฟล์ทั้งหมด" value={result.summary.total} icon={FileText} />
          <Stat label="สำเร็จ" value={result.summary.successful} icon={FileCheck} accent="emerald" />
          <Stat
            label="ความมั่นใจเฉลี่ย"
            value={`${(result.summary.avgConfidence * 100).toFixed(1)}%`}
            icon={Sparkles}
            accent="amber"
          />
          <Stat
            label="เวลาเฉลี่ย/ไฟล์"
            value={`${(result.summary.avgMsPerFile / 1000).toFixed(1)}s`}
            icon={Clock}
          />
        </div>

        {/* Per-category distribution */}
        <div className="mt-4 pt-4 border-t border-slate-100 dark:border-slate-800">
          <div className="text-[10px] font-semibold uppercase tracking-wider text-slate-500 mb-2">
            จำแนกเข้า ๖ หมวด
          </div>
          <div className="grid grid-cols-3 md:grid-cols-6 gap-2">
            {DOC_CATEGORIES.map((cat) => {
              const n = result.summary.byCategory[cat] ?? 0;
              const pct = result.summary.successful > 0 ? (n / result.summary.successful) * 100 : 0;
              return (
                <div
                  key={cat}
                  className={`rounded-sm border p-2.5 text-center ${CATEGORY_STYLES[cat]}`}
                >
                  <div className="text-xs font-bold">{cat}</div>
                  <div className="text-xl font-bold leading-none mt-1">{n}</div>
                  <div className="text-[10px] mt-0.5 opacity-70">{pct.toFixed(0)}%</div>
                  <div className="text-[9px] mt-0.5 leading-tight opacity-60 line-clamp-1">
                    {CATEGORY_DESCRIPTIONS[cat]}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Per-file table */}
      <section className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-sm overflow-hidden">
        <div className="border-b border-slate-100 dark:border-slate-800 px-5 py-3">
          <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">
            ผลรายไฟล์
          </h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 dark:bg-slate-800 text-[10px] font-semibold uppercase tracking-wider text-slate-500 border-b border-slate-200 dark:border-slate-700">
              <tr>
                <th className="text-left px-4 py-2 w-8">#</th>
                <th className="text-left px-4 py-2">ชื่อไฟล์</th>
                <th className="text-center px-4 py-2 w-24">หมวด</th>
                <th className="text-center px-4 py-2 w-32">ความมั่นใจ</th>
                <th className="text-left px-4 py-2 hidden md:table-cell">เหตุผล</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {result.entries.map((e, idx) => (
                <tr key={idx} className="hover:bg-slate-50 dark:hover:bg-slate-800/40">
                  <td className="px-4 py-2 text-xs text-slate-400 tabular-nums">{idx + 1}</td>
                  <td className="px-4 py-2">
                    <div className="text-sm text-slate-800 dark:text-slate-200 line-clamp-1">
                      {e.filename}
                    </div>
                    {e.textLength && (
                      <div className="text-[10px] text-slate-500 mt-0.5">
                        {e.textLength.toLocaleString()} ตัวอักษร
                      </div>
                    )}
                  </td>
                  <td className="px-4 py-2 text-center">
                    {e.ok && e.result ? (
                      <span
                        className={`inline-block text-xs font-bold px-2 py-1 rounded-sm border ${CATEGORY_STYLES[e.result.predicted]}`}
                      >
                        {e.result.predicted}
                      </span>
                    ) : (
                      <span className="text-xs text-red-600">ผิดพลาด</span>
                    )}
                  </td>
                  <td className="px-4 py-2 text-center">
                    {e.ok && e.result ? (
                      <div className="flex items-center gap-2">
                        <div className="flex-1 h-1.5 bg-slate-100 dark:bg-slate-700 rounded-sm overflow-hidden">
                          <div
                            className={`h-full ${
                              e.result.predictedConfidence >= 0.7
                                ? "bg-emerald-500"
                                : e.result.predictedConfidence >= 0.5
                                  ? "bg-amber-500"
                                  : "bg-slate-400"
                            }`}
                            style={{ width: `${e.result.predictedConfidence * 100}%` }}
                          />
                        </div>
                        <span className="text-xs tabular-nums w-10 text-right text-slate-700 dark:text-slate-300">
                          {(e.result.predictedConfidence * 100).toFixed(0)}%
                        </span>
                      </div>
                    ) : (
                      <span className="text-xs text-red-500">—</span>
                    )}
                  </td>
                  <td className="px-4 py-2 hidden md:table-cell text-xs text-slate-600 dark:text-slate-400 max-w-md">
                    {e.ok && e.result?.reasoning ? (
                      <span className="italic line-clamp-2">{e.result.reasoning}</span>
                    ) : e.ok ? (
                      <span className="text-slate-400">—</span>
                    ) : (
                      <span className="text-red-600">{e.error}</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="px-5 py-2.5 text-[11px] text-slate-500 border-t border-slate-100 dark:border-slate-800">
          ประมวลผลด้วย {successful[0]?.result?.method === "ai" ? "AI Engine" : "Keyword Fallback"} ·
          เวลารวม {(result.summary.totalMs / 1000).toFixed(2)} วินาที สำหรับ {result.summary.total} ไฟล์
        </div>
      </section>
    </div>
  );
}

function Stat({
  label,
  value,
  icon: Icon,
  accent = "navy",
}: {
  label: string;
  value: number | string;
  icon: React.ComponentType<{ className?: string }>;
  accent?: "navy" | "emerald" | "amber";
}) {
  const colorMap = {
    navy: "bg-[#1e3a5f] text-white",
    emerald: "bg-emerald-600 text-white",
    amber: "bg-amber-600 text-white",
  };
  return (
    <div className="rounded-sm border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 p-3 flex items-center gap-2.5">
      <div className={`h-8 w-8 rounded-sm flex items-center justify-center ${colorMap[accent]}`}>
        <Icon className="h-3.5 w-3.5" />
      </div>
      <div>
        <div className="text-[10px] font-semibold uppercase tracking-wider text-slate-500">
          {label}
        </div>
        <div className="text-lg font-bold text-slate-900 dark:text-slate-100 leading-none mt-0.5">
          {value}
        </div>
      </div>
    </div>
  );
}

// ── Recent ───────────────────────────────────────

function RecentSection({ recent }: { recent: RecentItem[] }) {
  return (
    <section className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-sm overflow-hidden">
      <div className="border-b border-slate-100 dark:border-slate-800 px-5 py-3">
        <h2 className="text-sm font-semibold text-slate-900 dark:text-slate-100">
          การจำแนกล่าสุดในระบบ
        </h2>
      </div>
      <ul className="divide-y divide-slate-100 dark:divide-slate-800">
        {recent.map((d) => (
          <li key={d.id} className="px-5 py-3 hover:bg-slate-50 dark:hover:bg-slate-800/40 flex items-start gap-3">
            <div className={`text-sm font-bold rounded-sm border w-14 text-center px-2 py-1 shrink-0 ${CATEGORY_STYLES[d.category]}`}>
              {d.category}
            </div>
            <div className="min-w-0 flex-1">
              <div className="text-sm font-semibold text-slate-900 dark:text-slate-100 line-clamp-1">
                {d.title}
              </div>
              <div className="text-xs text-slate-500 mt-0.5 flex items-center gap-2">
                <FileText className="h-3 w-3 inline" />
                <span>{d.fileName}</span>
                <span>·</span>
                <span>ความมั่นใจ {(d.confidence * 100).toFixed(0)}%</span>
              </div>
              <div className="text-xs text-slate-600 dark:text-slate-400 mt-1 line-clamp-1">
                {d.summary}
              </div>
            </div>
          </li>
        ))}
      </ul>
    </section>
  );
}
