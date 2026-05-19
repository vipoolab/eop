"use client";

// Search UI with 4 mode tabs

import { useState } from "react";
import Link from "next/link";
import {
  Search as SearchIcon,
  Sparkles,
  Loader2,
  Filter,
  FileText,
  Clock,
  AlertCircle,
  Zap,
} from "lucide-react";
import {
  STATUS_LABELS,
  STATUS_COLORS,
  PRIORITY_LABELS,
  type CommandStatus,
  type CommandPriority,
} from "@/features/commands/types";

type Mode = "basic" | "advanced" | "fulltext" | "semantic";

interface Hit {
  type: "command" | "document";
  id: string;
  title: string;
  snippet: string;
  meta: Record<string, string | number | null>;
  score?: number;
}

interface SearchResponse {
  mode: Mode;
  query: string;
  hits: Hit[];
  total: number;
  elapsedMs: number;
  aiReasoning?: string;
  tokensUsed?: number;
}

const MODES: { key: Mode; label: string; desc: string; ai?: boolean }[] = [
  {
    key: "basic",
    label: "พื้นฐาน",
    desc: "ค้นหาคำในหัวเรื่อง / เลขที่ / ผู้รับ",
  },
  {
    key: "advanced",
    label: "ขั้นสูง",
    desc: "ระบุสถานะ ความสำคัญ และช่วงวันที่",
  },
  {
    key: "fulltext",
    label: "Full-text",
    desc: "ค้นหาในเนื้อหาทั้งหมด — รวมเอกสาร",
  },
  {
    key: "semantic",
    label: "AI Semantic",
    desc: "เข้าใจความหมาย — ใช้ภาษาธรรมชาติ",
    ai: true,
  },
];

const STATUSES: CommandStatus[] = [
  "DRAFT",
  "SUBMITTED",
  "APPROVED",
  "PUBLISHED",
  "ACKNOWLEDGED",
  "IN_PROGRESS",
  "REPORTED",
  "AUDITED",
  "CLOSED",
];

const PRIORITIES: CommandPriority[] = [
  "LOW",
  "NORMAL",
  "HIGH",
  "URGENT",
  "CRITICAL",
];

export function SearchUI() {
  const [mode, setMode] = useState<Mode>("basic");
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState<CommandStatus | "">("");
  const [priority, setPriority] = useState<CommandPriority | "">("");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<SearchResponse | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function runSearch(e?: React.FormEvent) {
    e?.preventDefault();
    if (!query.trim() && mode !== "advanced") {
      setError("ใส่คำค้นก่อน");
      return;
    }
    setLoading(true);
    setError(null);

    const params = new URLSearchParams({ mode, q: query });
    if (mode === "advanced") {
      if (status) params.set("status", status);
      if (priority) params.set("priority", priority);
      if (dateFrom) params.set("dateFrom", dateFrom);
      if (dateTo) params.set("dateTo", dateTo);
    }

    try {
      const r = await fetch(`/api/search?${params.toString()}`);
      const data = await r.json();
      if (!r.ok || !data.success) {
        throw new Error(data.message || "ค้นหาไม่สำเร็จ");
      }
      setResult(data.data);
    } catch (e) {
      setError(e instanceof Error ? e.message : "เกิดข้อผิดพลาด");
    } finally {
      setLoading(false);
    }
  }

  const currentMode = MODES.find((m) => m.key === mode)!;

  return (
    <div className="space-y-5">
      {/* Mode tabs */}
      <div className="flex gap-1 border-b border-slate-200 -mb-px">
        {MODES.map((m) => {
          const active = m.key === mode;
          return (
            <button
              key={m.key}
              onClick={() => {
                setMode(m.key);
                setResult(null);
              }}
              className={`relative px-4 py-2.5 text-sm font-medium border-b-2 transition-colors ${
                active
                  ? "border-[#1e3a5f] text-[#1e3a5f]"
                  : "border-transparent text-slate-500 hover:text-slate-800"
              }`}
            >
              <span className="inline-flex items-center gap-1.5">
                {m.label}
                {m.ai && (
                  <span className="inline-flex items-center justify-center h-3.5 w-3.5 rounded-sm bg-[#b8860b]/15 text-[#b8860b]">
                    <Sparkles className="h-2.5 w-2.5" />
                  </span>
                )}
              </span>
            </button>
          );
        })}
      </div>

      {/* Mode description */}
      <p className="text-xs text-slate-500 italic -mt-2">
        {currentMode.desc}
      </p>

      {/* Search box */}
      <form onSubmit={runSearch} className="space-y-3">
        <div className="relative">
          <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={
              mode === "semantic"
                ? 'เช่น "เอกสารเกี่ยวกับยาเสพติด" หรือ "งานช่วงเทศกาล"'
                : "ใส่คำค้น..."
            }
            className="w-full rounded-sm border border-slate-300 bg-white pl-10 pr-32 py-3 text-sm focus:outline-none focus:border-[#1e3a5f] focus:ring-1 focus:ring-[#1e3a5f]"
          />
          <button
            type="submit"
            disabled={loading}
            className="absolute right-1.5 top-1/2 -translate-y-1/2 inline-flex items-center gap-1.5 rounded-sm bg-[#1e3a5f] hover:bg-[#142a45] border border-[#142a45] px-4 py-1.5 text-sm font-semibold text-white disabled:opacity-50"
          >
            {loading ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
            ) : (
              <SearchIcon className="h-3.5 w-3.5" />
            )}
            ค้นหา
          </button>
        </div>

        {/* Advanced filters */}
        {mode === "advanced" && (
          <div className="rounded-sm border border-slate-200 bg-slate-50/50 p-4">
            <div className="flex items-center gap-2 mb-3">
              <Filter className="h-3.5 w-3.5 text-slate-500" />
              <h3 className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">
                ตัวกรอง
              </h3>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <Field label="สถานะ">
                <select
                  value={status}
                  onChange={(e) =>
                    setStatus(e.target.value as CommandStatus | "")
                  }
                  className="w-full rounded-sm border border-slate-300 bg-white px-2.5 py-1.5 text-xs focus:outline-none focus:border-[#1e3a5f]"
                >
                  <option value="">— ทั้งหมด —</option>
                  {STATUSES.map((s) => (
                    <option key={s} value={s}>
                      {STATUS_LABELS[s]}
                    </option>
                  ))}
                </select>
              </Field>
              <Field label="ความสำคัญ">
                <select
                  value={priority}
                  onChange={(e) =>
                    setPriority(e.target.value as CommandPriority | "")
                  }
                  className="w-full rounded-sm border border-slate-300 bg-white px-2.5 py-1.5 text-xs focus:outline-none focus:border-[#1e3a5f]"
                >
                  <option value="">— ทั้งหมด —</option>
                  {PRIORITIES.map((p) => (
                    <option key={p} value={p}>
                      {PRIORITY_LABELS[p]}
                    </option>
                  ))}
                </select>
              </Field>
              <Field label="ตั้งแต่วันที่">
                <input
                  type="date"
                  value={dateFrom}
                  onChange={(e) => setDateFrom(e.target.value)}
                  className="w-full rounded-sm border border-slate-300 bg-white px-2.5 py-1.5 text-xs focus:outline-none focus:border-[#1e3a5f]"
                />
              </Field>
              <Field label="ถึงวันที่">
                <input
                  type="date"
                  value={dateTo}
                  onChange={(e) => setDateTo(e.target.value)}
                  className="w-full rounded-sm border border-slate-300 bg-white px-2.5 py-1.5 text-xs focus:outline-none focus:border-[#1e3a5f]"
                />
              </Field>
            </div>
          </div>
        )}
      </form>

      {error && (
        <div className="rounded-sm border border-rose-300 bg-rose-50 p-3 text-sm text-rose-700 flex items-start gap-2">
          <AlertCircle className="h-4 w-4 mt-0.5 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Results */}
      {loading && (
        <div className="rounded-sm border border-slate-200 bg-white p-10 text-center">
          <Loader2 className="h-8 w-8 animate-spin text-[#1e3a5f] mx-auto" />
          <p className="text-sm text-slate-600 mt-3">
            {mode === "semantic"
              ? "AI กำลังวิเคราะห์ความหมาย..."
              : "กำลังค้นหา..."}
          </p>
        </div>
      )}

      {!loading && result && <Results result={result} />}
    </div>
  );
}

function Results({ result }: { result: SearchResponse }) {
  return (
    <div className="space-y-3">
      {/* Stats bar */}
      <div className="flex items-center justify-between text-[11px] text-slate-500 px-1">
        <div className="inline-flex items-center gap-3">
          <span>
            พบ <strong className="text-slate-800">{result.total}</strong>{" "}
            รายการ
          </span>
          <span className="inline-flex items-center gap-1">
            <Clock className="h-3 w-3" />
            {result.elapsedMs} ms
          </span>
          {result.tokensUsed && (
            <span className="inline-flex items-center gap-1">
              <Zap className="h-3 w-3" />
              {result.tokensUsed} tokens
            </span>
          )}
        </div>
      </div>

      {/* AI reasoning (semantic mode) */}
      {result.aiReasoning && (
        <div className="rounded-sm border border-[#b8860b]/30 bg-[#b8860b]/5 p-3 flex items-start gap-2">
          <Sparkles className="h-4 w-4 mt-0.5 shrink-0 text-[#b8860b]" />
          <div>
            <div className="text-[10px] font-semibold uppercase tracking-wider text-[#b8860b] mb-0.5">
              AI เข้าใจคำค้นนี้
            </div>
            <p className="text-sm text-slate-800 leading-relaxed">
              {result.aiReasoning}
            </p>
          </div>
        </div>
      )}

      {/* Hits */}
      {result.hits.length === 0 ? (
        <div className="rounded-sm border border-slate-200 bg-white p-10 text-center text-slate-500">
          <FileText className="h-10 w-10 mx-auto opacity-30 mb-2" />
          <p className="text-sm">ไม่พบผลการค้นหา</p>
        </div>
      ) : (
        <div className="space-y-2">
          {result.hits.map((h) => (
            <Hit key={`${h.type}-${h.id}`} hit={h} mode={result.mode} />
          ))}
        </div>
      )}
    </div>
  );
}

function Hit({ hit, mode }: { hit: Hit; mode: Mode }) {
  const isCommand = hit.type === "command";
  const href = isCommand ? `/command/workflow/${hit.id}` : "#";
  const status = hit.meta.status as CommandStatus | undefined;
  const aiReason = hit.meta.aiReason as string | undefined;

  return (
    <Link
      href={href}
      className="block rounded-sm border border-slate-200 bg-white hover:border-[#1e3a5f]/40 hover:shadow-sm p-4 transition-all"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          {/* Doc no + badges */}
          <div className="flex items-center gap-2 mb-1 flex-wrap">
            {hit.meta.docNo && (
              <span className="font-mono text-[11px] text-slate-500">
                {hit.meta.docNo}
              </span>
            )}
            {status && (
              <span
                className={`text-[10px] px-1.5 py-0.5 rounded-sm border font-medium ${STATUS_COLORS[status]}`}
              >
                {STATUS_LABELS[status]}
              </span>
            )}
            <span className="inline-flex items-center gap-1 text-[10px] uppercase tracking-wider text-slate-400">
              {isCommand ? (
                <FileText className="h-3 w-3" />
              ) : (
                <FileText className="h-3 w-3" />
              )}
              {hit.type}
            </span>
          </div>

          <h3 className="text-sm font-medium text-slate-900 mb-1">
            {hit.title}
          </h3>

          <p className="text-xs text-slate-600 line-clamp-2 leading-relaxed">
            {hit.snippet}
          </p>

          {/* Semantic mode: show AI reasoning */}
          {mode === "semantic" && aiReason && (
            <div className="mt-2 inline-flex items-start gap-1.5 rounded-sm bg-[#b8860b]/5 border border-[#b8860b]/20 px-2 py-1 text-[11px] text-slate-700">
              <Sparkles className="h-2.5 w-2.5 mt-0.5 text-[#b8860b] shrink-0" />
              <span className="italic">{aiReason}</span>
            </div>
          )}
        </div>

        {/* Score */}
        {hit.score !== undefined && (
          <div className="text-right shrink-0">
            <div className="font-mono text-sm font-semibold text-[#1e3a5f] tabular-nums">
              {Math.round((hit.score ?? 0) * 100)}%
            </div>
            <div className="text-[9px] uppercase tracking-wider text-slate-400">
              relevance
            </div>
          </div>
        )}
      </div>
    </Link>
  );
}

function Field({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <label className="block text-[10px] font-semibold uppercase tracking-wider text-slate-500 mb-1">
        {label}
      </label>
      {children}
    </div>
  );
}
