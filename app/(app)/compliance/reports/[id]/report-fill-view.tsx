"use client";

// Self-Assessment Fill + Review + Approve view
// TOR 5.4.3 ๓.๑ + ๓.๒
// Cross-system: pull KPI data for auto-fill suggestions

import { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import {
  Loader2,
  Send,
  CheckCircle2,
  ChevronDown,
  ChevronRight,
  Sparkles,
  Save,
  AlertCircle,
  TrendingUp,
  FileText,
  Download,
  Trash2,
  ShieldCheck,
} from "lucide-react";
import { ApprovalModal } from "./approval-modal";

type ReportStatus = "DRAFT" | "SUBMITTED" | "REVIEWED" | "APPROVED";

interface Item {
  id: string;
  code: string;
  category: string;
  question: string;
  weight: number;
  evidenceRequired: boolean;
}

interface Answer {
  itemId: string;
  answer: string | null;
  selfScore: number | null;
  reviewerScore: number | null;
  evidenceDoc: { id: string; name: string } | null;
  answeredBy: { name: string } | null;
}

interface LinkedKpi {
  code: string;
  name: string;
  target: number;
  actual: number;
  unit: string | null;
  status: string;
}

export function ReportFillView({
  reportId,
  reportTitle,
  status,
  approverName,
  approverRank,
  canEdit,
  canSubmit,
  canReview,
  canApprove,
  canDelete,
  items,
  answers,
  linkedKpis,
}: {
  reportId: string;
  reportTitle: string;
  status: ReportStatus;
  approverName: string;
  approverRank: string | null;
  canEdit: boolean;
  canSubmit: boolean;
  canReview: boolean;
  canApprove: boolean;
  canDelete: boolean;
  items: Item[];
  answers: Answer[];
  linkedKpis: LinkedKpi[];
}) {
  const router = useRouter();
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [showApprovalModal, setShowApprovalModal] = useState(false);
  const [localAnswers, setLocalAnswers] = useState<Record<string, Answer>>(() => {
    const map: Record<string, Answer> = {};
    for (const a of answers) map[a.itemId] = a;
    return map;
  });
  const [reviewerScores, setReviewerScores] = useState<Record<string, number | null>>(() => {
    const map: Record<string, number | null> = {};
    for (const a of answers) map[a.itemId] = a.reviewerScore;
    return map;
  });

  // Group items by category for collapsible sections
  const grouped = useMemo(() => {
    const m = new Map<string, Item[]>();
    for (const it of items) {
      const arr = m.get(it.category) ?? [];
      arr.push(it);
      m.set(it.category, arr);
    }
    return Array.from(m.entries());
  }, [items]);

  const [expandedCat, setExpandedCat] = useState<Set<string>>(
    new Set(grouped[0] ? [grouped[0][0]] : [])
  );
  function toggleCat(c: string) {
    setExpandedCat((curr) => {
      const next = new Set(curr);
      if (next.has(c)) next.delete(c);
      else next.add(c);
      return next;
    });
  }

  async function saveAnswer(itemId: string, patch: Partial<Answer>) {
    if (!canEdit) return;
    const curr = localAnswers[itemId] ?? {
      itemId,
      answer: null,
      selfScore: null,
      reviewerScore: null,
      evidenceDoc: null,
      answeredBy: null,
    };
    const merged = { ...curr, ...patch };
    setLocalAnswers({ ...localAnswers, [itemId]: merged });

    try {
      await fetch(`/api/compliance/reports/${reportId}/answers`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          itemId,
          answer: merged.answer,
          selfScore: merged.selfScore,
          evidenceDocId: merged.evidenceDoc?.id ?? null,
        }),
      });
    } catch {
      /* silent — auto-save */
    }
  }

  async function action(path: string, label: string) {
    setBusy(label);
    setError(null);
    try {
      const res = await fetch(path, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({}) });
      const data = await res.json();
      if (!res.ok || !data.success) throw new Error(data.message);
      router.refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : "เกิดข้อผิดพลาด");
    } finally {
      setBusy(null);
    }
  }

  async function submitReview() {
    setBusy("review");
    setError(null);
    try {
      const reviewAnswers = items.map((it) => ({
        itemId: it.id,
        reviewerScore: reviewerScores[it.id] ?? null,
      }));
      const res = await fetch(`/api/compliance/reports/${reportId}/review`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ answers: reviewAnswers }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) throw new Error(data.message);
      router.refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : "เกิดข้อผิดพลาด");
    } finally {
      setBusy(null);
    }
  }

  async function handleDelete() {
    if (!confirm("ลบรายงานนี้ถาวร — แน่ใจ?")) return;
    setBusy("delete");
    setError(null);
    try {
      const res = await fetch(`/api/compliance/reports/${reportId}`, { method: "DELETE" });
      const data = await res.json();
      if (!res.ok || !data.success) throw new Error(data.message);
      router.push("/compliance/reports");
      router.refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : "เกิดข้อผิดพลาด");
      setBusy(null);
    }
  }

  // Cross-system AI suggestion (TOR ๓.๑ data integration with P1)
  function suggestFromKpis(question: string): { text: string; score: number } | null {
    const q = question.toLowerCase();
    const isKpiQ = q.includes("kpi") || q.includes("ตัวชี้วัด") || q.includes("บรรลุ") || q.includes("เป้าหมาย");
    if (!isKpiQ || linkedKpis.length === 0) return null;

    const achievedCount = linkedKpis.filter((k) => k.status === "green").length;
    const totalCount = linkedKpis.length;
    const ratio = totalCount > 0 ? achievedCount / totalCount : 0;
    const score = Math.round(ratio * 5 * 10) / 10; // 0-5 scale

    const lines = [
      `จากข้อมูล KPI ของ ตร. ในช่วงนี้ — บรรลุเป้าหมาย ${achievedCount}/${totalCount} ตัว (${(ratio * 100).toFixed(0)}%)`,
      ``,
      `KPI ที่บรรลุเป้า:`,
      ...linkedKpis
        .filter((k) => k.status === "green")
        .slice(0, 5)
        .map((k) => `- ${k.code}: ${k.name} (จริง ${k.actual}/${k.target} ${k.unit ?? ""})`),
      ``,
      `KPI ที่ยังไม่บรรลุ:`,
      ...linkedKpis
        .filter((k) => k.status !== "green")
        .slice(0, 3)
        .map((k) => `- ${k.code}: ${k.name} (จริง ${k.actual}/${k.target} ${k.unit ?? ""})`),
    ];
    return { text: lines.join("\n"), score };
  }

  return (
    <div className="space-y-4">
      {/* Action bar */}
      {(canSubmit || canReview || canApprove || canDelete) && (
        <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm flex flex-wrap items-center gap-2 justify-between">
          <div className="text-sm text-slate-700">
            {status === "DRAFT" && "กรอกคำตอบครบแล้ว → กดส่ง Reviewer"}
            {status === "SUBMITTED" && "Reviewer ตรวจรายงาน + ให้คะแนน"}
            {status === "REVIEWED" && "Commander อนุมัติ + ส่งหน่วยประเมินภายนอก"}
            {status === "APPROVED" && "✓ อนุมัติและส่งหน่วยประเมินภายนอกแล้ว"}
          </div>
          <div className="flex items-center gap-2">
            <a
              href={`/api/compliance/reports/${reportId}/export`}
              target="_blank"
              rel="noopener"
              className="inline-flex items-center gap-1 rounded bg-slate-100 hover:bg-slate-200 border border-slate-300 px-3 py-1.5 text-xs font-medium text-slate-700"
            >
              <Download className="h-3.5 w-3.5" />
              Export PDF
            </a>
            {canSubmit && (
              <button
                onClick={() => action(`/api/compliance/reports/${reportId}/submit`, "submit")}
                disabled={busy !== null}
                className="inline-flex items-center gap-1 rounded bg-blue-600 hover:bg-blue-700 px-3 py-1.5 text-xs font-semibold text-white disabled:opacity-50"
              >
                {busy === "submit" ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Send className="h-3.5 w-3.5" />}
                ส่ง Reviewer
              </button>
            )}
            {canReview && (
              <button
                onClick={submitReview}
                disabled={busy !== null}
                className="inline-flex items-center gap-1 rounded bg-amber-600 hover:bg-amber-700 px-3 py-1.5 text-xs font-semibold text-white disabled:opacity-50"
              >
                {busy === "review" ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <CheckCircle2 className="h-3.5 w-3.5" />}
                บันทึกผลตรวจ
              </button>
            )}
            {canApprove && (
              <button
                onClick={() => setShowApprovalModal(true)}
                disabled={busy !== null}
                className="inline-flex items-center gap-1 rounded bg-emerald-600 hover:bg-emerald-700 px-3 py-1.5 text-xs font-semibold text-white disabled:opacity-50"
              >
                <ShieldCheck className="h-3.5 w-3.5" />
                ลงนามอนุมัติ + ส่งภายนอก
              </button>
            )}
            {canDelete && (
              <button
                onClick={handleDelete}
                disabled={busy !== null}
                className="inline-flex items-center gap-1 rounded bg-rose-50 hover:bg-rose-100 border border-rose-200 px-3 py-1.5 text-xs font-medium text-rose-700 disabled:opacity-50"
              >
                {busy === "delete" ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Trash2 className="h-3.5 w-3.5" />}
                ลบ
              </button>
            )}
          </div>
        </div>
      )}

      {error && (
        <div className="rounded-md bg-rose-50 border border-rose-200 px-3 py-2 text-xs text-rose-700 flex items-start gap-2">
          <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
          {error}
        </div>
      )}

      {/* Cross-system linked KPIs */}
      {linkedKpis.length > 0 && (
        <div className="rounded-xl border border-blue-200 bg-blue-50/30 p-4">
          <div className="flex items-center gap-2 mb-2">
            <TrendingUp className="h-4 w-4 text-blue-700" />
            <h3 className="text-sm font-semibold text-blue-900">
              KPI จากระบบยุทธศาสตร์ที่เกี่ยวข้อง ({linkedKpis.length})
            </h3>
          </div>
          <p className="text-[11px] text-blue-800 mb-2">
            ใช้เป็น context ตอบคำถามเกี่ยวกับการบรรลุเป้าหมาย — กดปุ่ม "🤖 แนะนำ" ในแต่ละข้อ
          </p>
          <div className="flex flex-wrap gap-1">
            {linkedKpis.slice(0, 8).map((k) => (
              <span
                key={k.code}
                className={`text-[10px] px-1.5 py-0.5 rounded border ${
                  k.status === "green" ? "bg-emerald-50 text-emerald-700 border-emerald-200" :
                  k.status === "yellow" ? "bg-amber-50 text-amber-700 border-amber-200" :
                  "bg-rose-50 text-rose-700 border-rose-200"
                }`}
              >
                {k.code}: {k.actual}/{k.target}{k.unit ?? ""}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Items grouped by category */}
      <div className="space-y-3">
        {grouped.map(([cat, catItems]) => {
          const expanded = expandedCat.has(cat);
          const answered = catItems.filter((it) => {
            const a = localAnswers[it.id];
            return a?.selfScore !== null && a?.selfScore !== undefined;
          }).length;

          return (
            <div key={cat} className="rounded-xl border border-slate-200 bg-white shadow-sm overflow-hidden">
              <button
                type="button"
                onClick={() => toggleCat(cat)}
                className="w-full flex items-center justify-between gap-3 px-5 py-3 text-left hover:bg-slate-50"
              >
                <div className="flex items-center gap-2">
                  {expanded ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                  <span className="text-sm font-semibold text-slate-700">{cat}</span>
                </div>
                <span className="text-xs text-slate-500 tabular-nums">
                  {answered}/{catItems.length} ข้อ
                </span>
              </button>

              {expanded && (
                <div className="divide-y divide-slate-100">
                  {catItems.map((it) => {
                    const ans = localAnswers[it.id];
                    const suggestion = canEdit ? suggestFromKpis(it.question) : null;
                    return (
                      <div key={it.id} className="px-5 py-4 space-y-2">
                        <div className="flex items-start gap-2">
                          <span className="font-mono text-[10px] text-slate-500 mt-0.5">{it.code}</span>
                          <div className="flex-1">
                            <p className="text-sm text-slate-800">
                              {it.question}
                              {it.evidenceRequired && (
                                <span className="ml-1 text-[10px] px-1 py-0.5 rounded bg-amber-50 text-amber-700 border border-amber-200">
                                  ต้องมีหลักฐาน
                                </span>
                              )}
                            </p>
                            <span className="text-[10px] text-slate-500">น้ำหนัก {it.weight}</span>
                          </div>
                        </div>

                        {/* Answer textarea */}
                        <textarea
                          rows={2}
                          value={ans?.answer ?? ""}
                          disabled={!canEdit}
                          onChange={(e) => saveAnswer(it.id, { answer: e.target.value })}
                          placeholder={canEdit ? "ตอบคำถาม + ระบุหลักฐาน..." : ""}
                          className="w-full rounded border border-slate-200 px-2 py-1.5 text-xs resize-none disabled:bg-slate-50"
                        />

                        {/* Score selector */}
                        <div className="flex items-center gap-3 flex-wrap">
                          {canEdit && (
                            <div className="flex items-center gap-1.5">
                              <span className="text-[10px] text-slate-500">selfScore:</span>
                              {[0, 1, 2, 3, 4, 5].map((s) => (
                                <button
                                  key={s}
                                  type="button"
                                  onClick={() => saveAnswer(it.id, { selfScore: s })}
                                  className={`w-6 h-6 rounded text-[11px] font-semibold ${
                                    ans?.selfScore === s
                                      ? "bg-blue-600 text-white"
                                      : "bg-slate-100 text-slate-700 hover:bg-slate-200"
                                  }`}
                                >
                                  {s}
                                </button>
                              ))}
                            </div>
                          )}
                          {!canEdit && ans?.selfScore !== null && ans?.selfScore !== undefined && (
                            <span className="text-[11px] text-slate-700">
                              self: <strong>{ans.selfScore}</strong>/5
                            </span>
                          )}

                          {/* Reviewer score */}
                          {(canReview || ans?.reviewerScore !== null) && (
                            <div className="flex items-center gap-1.5">
                              <span className="text-[10px] text-amber-700">reviewerScore:</span>
                              {canReview ? (
                                [0, 1, 2, 3, 4, 5].map((s) => (
                                  <button
                                    key={s}
                                    type="button"
                                    onClick={() => setReviewerScores({ ...reviewerScores, [it.id]: s })}
                                    className={`w-6 h-6 rounded text-[11px] font-semibold ${
                                      reviewerScores[it.id] === s
                                        ? "bg-amber-600 text-white"
                                        : "bg-amber-50 text-amber-700 hover:bg-amber-100"
                                    }`}
                                  >
                                    {s}
                                  </button>
                                ))
                              ) : (
                                <span className="text-[11px] text-amber-700">
                                  <strong>{ans?.reviewerScore}</strong>/5
                                </span>
                              )}
                            </div>
                          )}

                          {/* AI suggestion */}
                          {canEdit && suggestion && (
                            <button
                              type="button"
                              onClick={() => {
                                if (confirm(`ใช้ข้อมูล KPI กรอกคำตอบนี้? (selfScore: ${suggestion.score})`)) {
                                  saveAnswer(it.id, {
                                    answer: suggestion.text,
                                    selfScore: suggestion.score,
                                  });
                                }
                              }}
                              className="inline-flex items-center gap-1 text-[11px] text-violet-600 hover:text-violet-800 font-medium"
                              title="ดึงข้อมูลจาก KPI ระบบยุทธศาสตร์ (TOR ๓.๑ data integration)"
                            >
                              <Sparkles className="h-3 w-3" />
                              แนะนำจาก KPI
                            </button>
                          )}

                          {/* Save indicator */}
                          {canEdit && (
                            <span className="text-[10px] text-slate-400 ml-auto inline-flex items-center gap-1">
                              <Save className="h-3 w-3" />
                              บันทึกอัตโนมัติ
                            </span>
                          )}
                        </div>

                        {ans?.evidenceDoc && (
                          <div className="text-[11px] text-slate-500 inline-flex items-center gap-1">
                            <FileText className="h-3 w-3" />
                            หลักฐาน: {ans.evidenceDoc.name}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {showApprovalModal && (
        <ApprovalModal
          reportId={reportId}
          reportTitle={reportTitle}
          approverName={approverName}
          approverRank={approverRank}
          onClose={() => setShowApprovalModal(false)}
        />
      )}
    </div>
  );
}
