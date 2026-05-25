"use client";

import { useState } from "react";
import Link from "next/link";
import {
  Search as SearchIcon,
  Sparkles,
  Loader2,
  FileText,
  AlertTriangle,
  ClipboardList,
  FileEdit,
  Tag,
} from "lucide-react";
import type {
  SearchResult,
  SearchMode,
  SearchResultType,
} from "@/lib/intelligence/types";
import {
  SEARCH_MODE_LABELS,
  RESULT_TYPE_LABELS,
} from "@/lib/intelligence/types";

const MODES: SearchMode[] = ["BASIC", "ADVANCED", "FULLTEXT", "SEMANTIC"];

const MODE_DESCRIPTIONS: Record<SearchMode, string> = {
  BASIC: "ค้นหาจากชื่อเรื่อง/หัวเรื่องเท่านั้น — ตรงตัวเรียบง่าย",
  ADVANCED: "ค้นหาจากชื่อเรื่อง + tags พร้อมตัวกรองประเภท/หน่วย/วันที่",
  FULLTEXT: "ค้นหาทั่วทุกเนื้อหา — ดึงข้อความที่ตรงและไฮไลต์ผลลัพธ์",
  SEMANTIC:
    "ค้นหาเชิงความหมาย — รวมคำพ้องและคำที่เกี่ยวข้อง (เช่น “ยาเสพติด” → “ยาบ้า”, “ไอซ์”)",
};

const TYPE_ICONS: Record<SearchResultType, React.ComponentType<{ className?: string }>> = {
  command: FileEdit,
  document: FileText,
  incident: AlertTriangle,
  assessment: ClipboardList,
  form: ClipboardList,
};

const TYPE_COLORS: Record<SearchResultType, string> = {
  command: "bg-blue-50 text-blue-700 border-blue-200",
  document: "bg-amber-50 text-amber-700 border-amber-200",
  incident: "bg-red-50 text-red-700 border-red-200",
  assessment: "bg-purple-50 text-purple-700 border-purple-200",
  form: "bg-slate-50 text-slate-700 border-slate-200",
};

const EXAMPLES = ["ยาเสพติด", "อุบัติเหตุ Songkran", "แผนยุทธศาสตร์", "scam", "ชายแดน"];

interface AllCounts {
  BASIC: number;
  ADVANCED: number;
  FULLTEXT: number;
  SEMANTIC: number;
}

export function SearchInterface() {
  const [mode, setMode] = useState<SearchMode>("BASIC");
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResult[]>([]);
  const [counts, setCounts] = useState<AllCounts | null>(null);
  const [loading, setLoading] = useState(false);
  const [filterTypes, setFilterTypes] = useState<SearchResultType[]>([]);
  const [searchedQuery, setSearchedQuery] = useState("");

  async function doSearch(qOverride?: string, modeOverride?: SearchMode) {
    const q = qOverride ?? query;
    const m = modeOverride ?? mode;
    if (!q.trim()) return;
    setLoading(true);
    setSearchedQuery(q);
    try {
      const res = await fetch("/api/intelligence/search", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          query: q,
          mode: m,
          filters: filterTypes.length > 0 ? { types: filterTypes } : undefined,
          includeCounts: true,
        }),
      });
      const j = await res.json();
      if (j.success) {
        setResults(j.data.results);
        setCounts(j.data.counts);
      }
    } finally {
      setLoading(false);
    }
  }

  function toggleType(t: SearchResultType) {
    setFilterTypes((cur) =>
      cur.includes(t) ? cur.filter((x) => x !== t) : [...cur, t]
    );
  }

  function quickFill(ex: string) {
    setQuery(ex);
    doSearch(ex);
  }

  return (
    <div className="space-y-5">
      {/* Mode tabs */}
      <section className="bg-white border border-slate-200 rounded-sm overflow-hidden">
        <div className="flex items-center border-b border-slate-200 overflow-x-auto">
          {MODES.map((m) => {
            const active = m === mode;
            return (
              <button
                key={m}
                suppressHydrationWarning
                onClick={() => {
                  setMode(m);
                  if (searchedQuery) doSearch(searchedQuery, m);
                }}
                className={`px-4 py-3 text-sm font-medium whitespace-nowrap transition-colors relative ${
                  active
                    ? "text-[#1e3a5f] bg-blue-50/50"
                    : "text-slate-600 hover:text-slate-900 hover:bg-slate-50"
                }`}
              >
                {SEARCH_MODE_LABELS[m]}
                {active && (
                  <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#d4a017]" />
                )}
              </button>
            );
          })}
        </div>

        <div className="p-5 space-y-3">
          <div className="text-xs text-slate-600 italic">
            {MODE_DESCRIPTIONS[mode]}
          </div>

          {/* Search bar */}
          <div className="relative">
            <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <input
              suppressHydrationWarning
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") doSearch();
              }}
              placeholder="พิมพ์คำค้นหา..."
              className="w-full pl-9 pr-24 py-2.5 border border-slate-200 rounded-sm text-sm focus:outline-none focus:border-[#1e3a5f]"
            />
            <button
              suppressHydrationWarning
              onClick={() => doSearch()}
              disabled={loading || !query.trim()}
              className="absolute right-1 top-1 bottom-1 inline-flex items-center gap-1 rounded-sm bg-[#1e3a5f] hover:bg-[#142a45] disabled:bg-slate-300 text-white text-xs font-medium px-3"
            >
              {loading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Sparkles className="h-3.5 w-3.5" />}
              ค้นหา
            </button>
          </div>

          {/* Examples */}
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-[11px] text-slate-500">ตัวอย่าง:</span>
            {EXAMPLES.map((ex) => (
              <button
                key={ex}
                suppressHydrationWarning
                onClick={() => quickFill(ex)}
                className="text-xs rounded-sm border border-slate-200 hover:border-[#1e3a5f] hover:bg-blue-50 px-2 py-1"
              >
                {ex}
              </button>
            ))}
          </div>

          {/* Filter chips (ADVANCED+) */}
          {(mode === "ADVANCED" || mode === "FULLTEXT" || mode === "SEMANTIC") && (
            <div className="border-t border-slate-100 pt-3">
              <div className="text-[10px] font-semibold uppercase tracking-wider text-slate-500 mb-1.5">
                กรองตามประเภท
              </div>
              <div className="flex flex-wrap gap-2">
                {(Object.keys(RESULT_TYPE_LABELS) as SearchResultType[]).map(
                  (t) => {
                    const active = filterTypes.includes(t);
                    const Icon = TYPE_ICONS[t];
                    return (
                      <button
                        key={t}
                        suppressHydrationWarning
                        onClick={() => toggleType(t)}
                        className={`text-xs rounded-sm border px-2 py-1 inline-flex items-center gap-1 ${
                          active
                            ? "border-[#1e3a5f] bg-[#1e3a5f] text-white"
                            : "border-slate-200 text-slate-700 hover:border-[#1e3a5f]"
                        }`}
                      >
                        <Icon className="h-3 w-3" />
                        {RESULT_TYPE_LABELS[t]}
                      </button>
                    );
                  }
                )}
                {filterTypes.length > 0 && (
                  <button
                    suppressHydrationWarning
                    onClick={() => setFilterTypes([])}
                    className="text-xs rounded-sm border border-slate-200 hover:bg-slate-100 px-2 py-1 text-slate-500"
                  >
                    เคลียร์ตัวกรอง
                  </button>
                )}
              </div>
            </div>
          )}
        </div>
      </section>

      {/* Mode comparison */}
      {counts && searchedQuery && (
        <section className="bg-amber-50 border border-amber-200 rounded-sm p-4">
          <div className="text-xs font-semibold text-amber-900 mb-2">
            เปรียบเทียบผลลัพธ์ทั้ง ๔ โหมดสำหรับ "{searchedQuery}":
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
            {MODES.map((m) => (
              <button
                key={m}
                suppressHydrationWarning
                onClick={() => {
                  setMode(m);
                  doSearch(searchedQuery, m);
                }}
                className={`text-left rounded-sm border p-2.5 transition-colors ${
                  mode === m
                    ? "bg-white border-[#1e3a5f]"
                    : "bg-white/60 border-amber-200 hover:border-amber-400"
                }`}
              >
                <div className="text-[10px] font-semibold uppercase tracking-wider text-slate-500">
                  {SEARCH_MODE_LABELS[m]}
                </div>
                <div className="text-xl font-bold text-slate-900 tabular-nums mt-0.5">
                  {counts[m]}
                  <span className="text-xs font-normal text-slate-500 ml-1">
                    ผล
                  </span>
                </div>
              </button>
            ))}
          </div>
          {counts.SEMANTIC > counts.BASIC && (
            <div className="text-[11px] text-amber-800 mt-2 italic">
              💡 โหมด Semantic พบผลมากกว่า Basic เพราะรวมคำที่มีความหมายใกล้เคียง
            </div>
          )}
        </section>
      )}

      {/* Results */}
      <section className="bg-white border border-slate-200 rounded-sm overflow-hidden">
        <div className="border-b border-slate-100 px-5 py-3">
          <h2 className="text-sm font-semibold text-slate-900">
            ผลลัพธ์การค้นหา{" "}
            <span className="text-slate-500 font-normal">
              ({results.length} รายการ
              {searchedQuery ? ` · ค้นหาด้วยโหมด ${SEARCH_MODE_LABELS[mode]}` : ""})
            </span>
          </h2>
        </div>
        {loading ? (
          <div className="px-5 py-12 text-center text-sm text-slate-500">
            <Loader2 className="h-6 w-6 mx-auto animate-spin mb-2" />
            กำลังค้นหา...
          </div>
        ) : results.length === 0 ? (
          <div className="px-5 py-12 text-center text-sm text-slate-500">
            {searchedQuery
              ? `ไม่พบผลลัพธ์สำหรับ "${searchedQuery}"`
              : "พิมพ์คำค้นหาด้านบนเพื่อเริ่มต้น"}
          </div>
        ) : (
          <ul className="divide-y divide-slate-100">
            {results.map((r) => {
              const Icon = TYPE_ICONS[r.type];
              return (
                <li key={r.id} className="px-5 py-3 hover:bg-slate-50">
                  <Link href={r.href} className="block">
                    <div className="flex items-start gap-3">
                      <div
                        className={`h-9 w-9 rounded-sm border flex items-center justify-center shrink-0 ${TYPE_COLORS[r.type]}`}
                      >
                        <Icon className="h-4 w-4" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2 mb-0.5">
                          <span
                            className={`text-[10px] font-semibold uppercase tracking-wider px-1.5 py-0.5 rounded-sm border ${TYPE_COLORS[r.type]}`}
                          >
                            {RESULT_TYPE_LABELS[r.type]}
                          </span>
                          <span className="text-[10px] text-slate-500">
                            คะแนน {(r.score * 100).toFixed(0)}%
                          </span>
                        </div>
                        <div className="text-sm font-semibold text-slate-900 line-clamp-1">
                          {r.title}
                        </div>
                        <div className="text-xs text-slate-600 mt-1 line-clamp-2 leading-relaxed">
                          {r.snippet}
                        </div>
                        {r.matchedTerms.length > 0 && (
                          <div className="flex flex-wrap items-center gap-1 mt-1.5">
                            <Tag className="h-3 w-3 text-slate-400" />
                            {r.matchedTerms.slice(0, 6).map((t) => (
                              <span
                                key={t}
                                className="text-[10px] bg-amber-50 border border-amber-200 text-amber-900 px-1.5 py-0.5 rounded-sm"
                              >
                                {t}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  </Link>
                </li>
              );
            })}
          </ul>
        )}
      </section>
    </div>
  );
}
