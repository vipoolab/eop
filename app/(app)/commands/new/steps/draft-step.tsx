"use client";

import { useEffect, useState } from "react";
import {
  Sparkles,
  RefreshCw,
  Library,
  BookOpen,
  ClipboardList,
  AlertCircle,
  Check,
  FileText,
  Tag,
  Scale,
  Target,
  ListChecks,
  Clock,
  Pencil,
  Lock,
} from "lucide-react";
import type { DrafterOutput } from "@/lib/commands/types";
import { safeJson } from "@/lib/utils";
import { CommandLetterDocument } from "@/components/commands/command-letter-document";
import { DownloadDocxButton } from "@/components/commands/download-docx-button";

export interface IntentFields {
  keywords: string;
  baseInfo: string;
  context: string;
}

interface Props {
  fields: IntentFields;
  intent: string; // legacy fallback
  draft: DrafterOutput | null;
  onDraftReceived: (
    result: DrafterOutput,
    meta: {
      model: string;
      durationMs: number;
      inputTokens: number;
      outputTokens: number;
    }
  ) => void;
  onChange: (result: DrafterOutput) => void;
}

interface AlignedItem {
  id: string;
  level: 1 | 2 | 3;
  text: string;
}

// ── Thai-numeral helper (used by the loading-state step counter) ──
const THAI_DIGIT = ["๐", "๑", "๒", "๓", "๔", "๕", "๖", "๗", "๘", "๙"];
function toThaiNumeral(n: number): string {
  return String(n)
    .split("")
    .map((c) => (c >= "0" && c <= "9" ? THAI_DIGIT[Number(c)] : c))
    .join("");
}

export function DraftStep({ fields, intent, draft, onDraftReceived, onChange }: Props) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [planTitles, setPlanTitles] = useState<Record<string, AlignedItem>>({});
  // Chunked drafting: which of the 3 steps is currently running (0,1,2) — see run()
  const [activeStep, setActiveStep] = useState(0);

  // Auto-run draft on first entry to this step
  useEffect(() => {
    if (!draft && !loading) {
      run();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Fetch plan titles for alignment display
  useEffect(() => {
    fetch("/api/strategic/tree")
      .then((r) => r.json())
      .then((j) => {
        const titles: Record<string, AlignedItem> = {};
        const tree = j.data?.tree;
        if (!tree) return;
        const visit = (items: { id: string; number: string; name: string; children?: typeof items }[], level: 1 | 2 | 3) => {
          for (const it of items) {
            titles[it.id] = { id: it.id, level, text: `${it.number} ${it.name}` };
            if (it.children?.length) visit(it.children, level);
          }
        };
        visit(tree.items ?? [], 1);
        for (const c of tree.childDocs ?? []) {
          titles[`${c.id}-doc`] = { id: `${c.id}-doc`, level: 2, text: c.title };
          for (const it of c.items ?? []) {
            titles[it.id] = { id: it.id, level: 2, text: `${it.number} ${it.name}` };
          }
          for (const ap of c.childDocs ?? []) {
            titles[`${ap.id}-doc`] = { id: `${ap.id}-doc`, level: 3, text: ap.title };
          }
        }
        setPlanTitles(titles);
      })
      .catch(() => {});
  }, []);

  // Chunked drafting — 3 sequential calls, each < 60s (Vercel Hobby cap):
  //   Step 1 /letter     → letter core (subject/objective/legalBasis/directives/...)
  //   Step 2 /alignment  → match to 3-level plans
  //   Step 3 /kpis       → suggested KPIs + target units + duration
  async function run() {
    setLoading(true);
    setError(null);
    setActiveStep(0);
    try {
      const body: Record<string, string> = {};
      if (fields.keywords || fields.baseInfo || fields.context) {
        body.keywords = fields.keywords;
        body.baseInfo = fields.baseInfo;
        body.context = fields.context;
      } else {
        body.intent = intent;
      }

      // ── Step 1: letter core ──
      const r1 = await fetch("/api/commands/draft/letter", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(body),
      });
      const j1 = await safeJson(r1);
      if (!j1.success) {
        setError(j1.message ?? "ร่างหนังสือไม่สำเร็จ");
        setLoading(false);
        return;
      }
      const ld = j1.data as {
        letter: DrafterOutput["letter"];
        model: string;
        durationMs: number;
        tokens: { input: number; output: number };
      };
      const letter = ld.letter;
      const letterSummary = [
        `เรื่อง ${letter.subject}`,
        letter.objective ?? "",
        ...(letter.directives ?? []),
      ]
        .filter(Boolean)
        .join("\n");

      // ── Step 2: alignment ──
      setActiveStep(1);
      const r2 = await fetch("/api/commands/draft/alignment", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ letterSummary }),
      });
      const j2 = await safeJson(r2);
      const alignment = j2.success
        ? (j2.data as { alignment: DrafterOutput["alignment"] }).alignment
        : {
            nationalStrategyItemIds: [],
            masterPlanItemIds: [],
            actionPlanItemIds: [],
            explanation: "",
          };

      // ── Step 3: KPIs + targets ──
      setActiveStep(2);
      const r3 = await fetch("/api/commands/draft/kpis", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ letterSummary, recipient: letter.recipient ?? "" }),
      });
      const j3 = await safeJson(r3);
      const kpiData = j3.success
        ? (j3.data as {
            suggestedKpis: DrafterOutput["suggestedKpis"];
            suggestedTargetUnitIds: string[];
            suggestedCascadeMode: "DIRECT" | "CASCADE";
            suggestedDurationDays: number;
          })
        : {
            suggestedKpis: [],
            suggestedTargetUnitIds: [],
            suggestedCascadeMode: "CASCADE" as const,
            suggestedDurationDays: 30,
          };

      // ── Combine into a single DrafterOutput ──
      const result: DrafterOutput = {
        letter,
        alignment,
        suggestedKpis: kpiData.suggestedKpis ?? [],
        suggestedTargetUnitIds: kpiData.suggestedTargetUnitIds,
        suggestedCascadeMode: kpiData.suggestedCascadeMode,
        suggestedDurationDays: kpiData.suggestedDurationDays,
      };

      onDraftReceived(result, {
        model: ld.model,
        durationMs: ld.durationMs,
        inputTokens: ld.tokens.input,
        outputTokens: ld.tokens.output,
      });
      setLoading(false);
    } catch (e) {
      setError((e as Error).message);
      setLoading(false);
    }
  }

  if (loading) {
    return <DraftLoadingState activeStep={activeStep} />;
  }

  if (error) {
    return (
      <div className="space-y-4">
        <div className="rounded-sm border border-red-300 bg-red-50 p-4">
          <div className="flex items-start gap-3">
            <AlertCircle className="h-5 w-5 text-red-700 shrink-0" />
            <div className="flex-1">
              <div className="text-sm font-semibold text-red-900">ร่างไม่สำเร็จ</div>
              <div className="text-sm text-red-800 mt-1">{error}</div>
            </div>
          </div>
        </div>
        <button
          type="button"
          suppressHydrationWarning
          onClick={run}
          className="inline-flex items-center gap-1.5 rounded-sm bg-[#1e3a5f] hover:bg-[#142a45] text-white text-sm font-medium px-4 py-2"
        >
          <RefreshCw className="h-4 w-4" />
          ลองอีกครั้ง
        </button>
      </div>
    );
  }

  if (!draft) {
    return (
      <div className="text-center text-sm text-slate-500 py-12">
        กดเพื่อเริ่มร่าง
      </div>
    );
  }

  const l3 = draft.alignment.actionPlanItemIds.map((id) => planTitles[id]).filter(Boolean);
  const l2 = draft.alignment.masterPlanItemIds.map((id) => planTitles[id]).filter(Boolean);
  const l1 = draft.alignment.nationalStrategyItemIds.map((id) => planTitles[id]).filter(Boolean);

  const setLetter = (patch: Partial<DrafterOutput["letter"]>) =>
    onChange({ ...draft, letter: { ...draft.letter, ...patch } });

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-wider text-[#b8860b] mb-1">
            <span>ขั้นที่ ๒</span>
            <span className="text-[9px] bg-emerald-100 text-emerald-800 px-1.5 py-0.5 rounded-sm">
              PoC OUTPUT FORMAT
            </span>
          </div>
          <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100">
            ร่างหนังสือสั่งการ — ๕ องค์ประกอบ + เอกสารราชการเต็มรูปแบบ
          </h2>
        </div>
        <button
          type="button"
          suppressHydrationWarning
          onClick={run}
          className="inline-flex items-center gap-1 text-xs text-slate-600 hover:text-slate-900 px-3 py-1.5 border border-slate-300 rounded-sm hover:bg-slate-50"
        >
          <RefreshCw className="h-3 w-3" />
          ร่างใหม่
        </button>
      </div>

      {/* ── 5-Section คำสั่ง Output Cards ── */}
      <section className="rounded-sm border-2 border-[#b8860b]/40 bg-gradient-to-br from-amber-50/40 to-white dark:from-amber-900/10 dark:to-slate-900 p-4">
        <div className="flex items-center gap-2 mb-3">
          <Sparkles className="h-4 w-4 text-[#b8860b]" />
          <h3 className="text-sm font-bold text-[#b8860b] uppercase tracking-wider">
            ๕ องค์ประกอบของคำสั่ง (ตามระเบียบสารบรรณ ข้อ ๒๒)
          </h3>
        </div>

        <div className="space-y-3">
          {/* 1. Subject */}
          <PocCard num="๑" icon={Tag} accent="navy" label="ชื่อเรื่องของคำสั่ง (เรื่อง)" editable={false}>
            <input
              type="text"
              value={draft.letter.subject}
              onChange={(e) => setLetter({ subject: e.target.value })}
              className="w-full bg-transparent border-b border-dashed border-slate-300 hover:border-slate-400 focus:border-[#1e3a5f] focus:outline-none text-sm font-semibold text-slate-900 dark:text-slate-100 py-1"
            />
          </PocCard>

          {/* 2. Objective — EDITABLE: ที่มา/เหตุผล */}
          <PocCard num="๒" icon={Target} accent="blue" label="ความนำ — ที่มา / เหตุผล / บริบท" editable={true}>
            <textarea
              value={draft.letter.objective ?? ""}
              onChange={(e) => setLetter({ objective: e.target.value })}
              rows={3}
              className="w-full bg-transparent border-b-2 border-[#b8860b]/40 hover:border-[#b8860b]/60 focus:border-[#b8860b] focus:outline-none text-sm text-slate-900 dark:text-slate-100 py-1 resize-y leading-relaxed"
            />
          </PocCard>

          {/* 3. Legal basis — EDITABLE: อาศัยอำนาจตาม... */}
          <PocCard num="๓" icon={Scale} accent="gold" label="อำนาจที่อ้าง — อาศัยอำนาจตาม...จึงสั่งให้..." editable={true}>
            <textarea
              value={draft.letter.legalBasis ?? ""}
              onChange={(e) => setLetter({ legalBasis: e.target.value })}
              rows={2}
              placeholder="อาศัยอำนาจตามความในมาตรา ๑๑ แห่งพระราชบัญญัติตำรวจแห่งชาติ พ.ศ. ๒๕๖๕ ผู้บัญชาการตำรวจแห่งชาติ จึงสั่งให้ดำเนินการดังต่อไปนี้"
              className="w-full bg-transparent border-b-2 border-[#b8860b]/40 hover:border-[#b8860b]/60 focus:border-[#b8860b] focus:outline-none text-sm text-slate-900 dark:text-slate-100 py-1 resize-y leading-relaxed"
            />
          </PocCard>

          {/* 4. Directives */}
          <PocCard num="๔" icon={ListChecks} accent="emerald" label="ข้อสั่งการ (เลขไทย ๑./๒./๓.)" editable={false}>
            <div className="space-y-1.5">
              {draft.letter.directives.map((d, idx) => (
                <textarea
                  key={idx}
                  value={d}
                  onChange={(e) => {
                    const next = [...draft.letter.directives];
                    next[idx] = e.target.value;
                    setLetter({ directives: next });
                  }}
                  rows={2}
                  className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 hover:border-slate-300 focus:border-[#1e3a5f] focus:outline-none text-sm text-slate-800 dark:text-slate-200 py-1.5 px-2 rounded-sm leading-relaxed resize-y"
                />
              ))}
            </div>
          </PocCard>

          {/* 5. Effective Clause — EDITABLE */}
          <PocCard num="๕" icon={Clock} accent="amber" label="คำลงท้าย — ระยะเวลามีผล (ทั้งนี้ ตั้งแต่...)" editable={true}>
            <textarea
              value={draft.letter.effectiveClause ?? ""}
              onChange={(e) => setLetter({ effectiveClause: e.target.value })}
              rows={2}
              placeholder="ทั้งนี้ ตั้งแต่บัดนี้เป็นต้นไป จนถึงวันที่ ... พ.ศ. ๒๕๖๙"
              className="w-full bg-transparent border-b-2 border-[#b8860b]/40 hover:border-[#b8860b]/60 focus:border-[#b8860b] focus:outline-none text-sm text-slate-900 dark:text-slate-100 py-1 resize-y leading-relaxed"
            />
          </PocCard>
        </div>
      </section>

      {/* ── Strategic Alignment Cards ── */}
      <div>
        <div className="text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-2">
          การจับคู่แผนยุทธศาสตร์ ๓ ระดับ
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <AlignmentCard icon={Library} accent="navy" level="ระดับ ๑" title="ยุทธศาสตร์ชาติ" items={l1} />
          <AlignmentCard icon={BookOpen} accent="gold" level="ระดับ ๒" title="แผนแม่บท" items={l2} />
          <AlignmentCard icon={ClipboardList} accent="slate" level="ระดับ ๓" title="แผนปฏิบัติราชการ" items={l3} />
        </div>
      </div>

      {draft.alignment.explanation && (
        <div className="rounded-sm border border-emerald-200 bg-emerald-50 dark:bg-emerald-900/20 p-3">
          <div className="flex items-start gap-2">
            <Check className="h-4 w-4 text-emerald-700 mt-0.5 shrink-0" />
            <div className="text-xs text-emerald-900 dark:text-emerald-200 leading-relaxed">
              <span className="font-semibold">เหตุผลการจับคู่: </span>
              {draft.alignment.explanation}
            </div>
          </div>
        </div>
      )}

      {/* ── Formal Government Letter Preview ── */}
      <FormalLetterPreview draft={draft} />
    </div>
  );
}

// ── PocCard component ─────────────────────────────────

interface PocCardProps {
  num: string;
  icon: React.ComponentType<{ className?: string }>;
  accent: "navy" | "gold" | "blue" | "emerald" | "amber";
  label: string;
  editable: boolean;
  children: React.ReactNode;
}

function PocCard({ num, icon: Icon, accent, label, editable, children }: PocCardProps) {
  const colorMap = {
    navy: { iconBg: "bg-[#1e3a5f]", border: "border-[#1e3a5f]/30", bg: "bg-white dark:bg-slate-900" },
    gold: { iconBg: "bg-[#b8860b]", border: "border-[#b8860b]/40", bg: "bg-amber-50/30 dark:bg-amber-900/10" },
    blue: { iconBg: "bg-blue-600", border: "border-blue-200", bg: "bg-white dark:bg-slate-900" },
    emerald: { iconBg: "bg-emerald-600", border: "border-emerald-200", bg: "bg-white dark:bg-slate-900" },
    amber: { iconBg: "bg-amber-600", border: "border-amber-300", bg: "bg-amber-50/30 dark:bg-amber-900/10" },
  }[accent];

  return (
    <div className={`rounded-sm border ${colorMap.border} ${colorMap.bg} p-3`}>
      <div className="flex items-center gap-2 mb-1.5">
        <div className={`h-7 w-7 rounded-sm ${colorMap.iconBg} flex items-center justify-center shrink-0`}>
          <Icon className="h-3.5 w-3.5 text-white" />
        </div>
        <div className="flex items-center gap-2 flex-1">
          <span className="text-[10px] font-bold text-slate-500">#{num}</span>
          <span className="text-sm font-semibold text-slate-900 dark:text-slate-100">{label}</span>
          {editable ? (
            <span className="ml-auto inline-flex items-center gap-0.5 text-[10px] font-bold text-[#b8860b] bg-amber-100 dark:bg-amber-900/40 px-1.5 py-0.5 rounded-sm">
              <Pencil className="h-2.5 w-2.5" />
              แก้ไขได้
            </span>
          ) : (
            <span className="ml-auto inline-flex items-center gap-0.5 text-[10px] text-slate-400">
              <Lock className="h-2.5 w-2.5" />
              AI generated
            </span>
          )}
        </div>
      </div>
      <div className="ml-9">{children}</div>
    </div>
  );
}

// ── Formal Letter Preview — wraps the shared A4 คำสั่ง document ──

function FormalLetterPreview({ draft }: { draft: DrafterOutput }) {
  return (
    <section className="border border-slate-300 dark:border-slate-700 rounded-sm bg-white dark:bg-slate-950 overflow-hidden shadow-sm">
      <div className="border-b border-slate-200 dark:border-slate-700 px-4 py-2.5 flex items-center justify-between gap-3 bg-slate-50 dark:bg-slate-900">
        <div className="flex items-center gap-2 min-w-0">
          <FileText className="h-4 w-4 text-[#1e3a5f] dark:text-amber-400 shrink-0" />
          <span className="text-sm font-semibold text-slate-800 dark:text-slate-100 truncate">
            ตัวอย่างคำสั่ง (Preview) — หน้ากระดาษ A4
          </span>
        </div>
        <DownloadDocxButton letter={draft.letter} />
      </div>
      <CommandLetterDocument letter={draft.letter} mode="draft" />
    </section>
  );
}

// ── Loading state ─────────────────────────────────

function DraftLoadingState({ activeStep }: { activeStep: number }) {
  const [elapsed, setElapsed] = useState(0);

  useEffect(() => {
    const elapsedTimer = setInterval(() => setElapsed((e) => e + 1), 1000);
    return () => clearInterval(elapsedTimer);
  }, []);

  // The 3 real chunked steps (each its own < 60s API call)
  const phases = [
    "ขั้น ๑ — ร่างตัวหนังสือคำสั่ง (๕ องค์ประกอบ)",
    "ขั้น ๒ — จับคู่แผนยุทธศาสตร์ ๓ ระดับ",
    "ขั้น ๓ — แนะนำ KPI + หน่วยรับคำสั่ง",
  ];

  return (
    <div className="flex flex-col items-center justify-center py-12 text-center">
      <div className="relative h-16 w-16 mb-4">
        <div className="absolute inset-0 rounded-full border-4 border-[#1e3a5f]/10" />
        <div
          className="absolute inset-0 rounded-full border-4 border-[#1e3a5f] border-t-transparent animate-spin"
          style={{ animationDuration: "1.5s" }}
        />
        <Sparkles className="absolute inset-0 m-auto h-7 w-7 text-[#1e3a5f]" />
      </div>
      <div className="text-base font-semibold text-slate-900 dark:text-slate-100">
        AI Engine กำลังประมวลผล (ขั้นที่ {toThaiNumeral(activeStep + 1)}/๓)
      </div>
      <div className="text-xs text-slate-500 dark:text-slate-400 mt-1">
        แบ่งเป็น ๓ ขั้น แต่ละขั้นไม่เกิน ๖๐ วินาที
      </div>

      <div className="mt-6 w-full max-w-md space-y-1.5">
        {phases.map((p, idx) => {
          const done = idx < activeStep;
          const active = idx === activeStep;
          return (
            <div
              key={idx}
              className={`flex items-center gap-2 text-sm rounded-sm px-3 py-2 ${
                done
                  ? "bg-emerald-50 text-emerald-900 dark:bg-emerald-900/20 dark:text-emerald-200"
                  : active
                  ? "bg-blue-50 text-blue-900 dark:bg-blue-900/20 dark:text-blue-200 ring-2 ring-blue-300"
                  : "bg-slate-50 text-slate-400 dark:bg-slate-800 dark:text-slate-500"
              }`}
            >
              <div className="shrink-0">
                {done ? (
                  <Check className="h-4 w-4 text-emerald-700 dark:text-emerald-400" />
                ) : active ? (
                  <div className="h-3 w-3 rounded-full border-2 border-blue-500 border-t-transparent animate-spin" />
                ) : (
                  <div className="h-3 w-3 rounded-full border-2 border-slate-300 dark:border-slate-600" />
                )}
              </div>
              <span className="text-left">{p}</span>
            </div>
          );
        })}
      </div>

      <div className="text-[11px] text-slate-400 mt-4 tabular-nums">
        เวลาที่ใช้: {toThaiNumeral(elapsed)} วินาที
      </div>
    </div>
  );
}

// ── Alignment Card ─────────────────────────────────

interface AlignmentCardProps {
  icon: React.ComponentType<{ className?: string }>;
  accent: "navy" | "gold" | "slate";
  level: string;
  title: string;
  items: AlignedItem[];
}

function AlignmentCard({ icon: Icon, accent, level, title, items }: AlignmentCardProps) {
  const accents = {
    navy: "border-[#1e3a5f]/30 bg-[#1e3a5f]/[0.03]",
    gold: "border-[#b8860b]/30 bg-[#b8860b]/[0.03]",
    slate: "border-slate-300 bg-slate-50 dark:bg-slate-900/50",
  }[accent];
  const iconBg = {
    navy: "bg-[#1e3a5f] text-white",
    gold: "bg-[#b8860b] text-white",
    slate: "bg-slate-600 text-white",
  }[accent];
  return (
    <div className={`rounded-sm border ${accents} p-3`}>
      <div className="flex items-center gap-2 mb-2">
        <div className={`h-7 w-7 rounded-sm flex items-center justify-center ${iconBg}`}>
          <Icon className="h-3.5 w-3.5" />
        </div>
        <div>
          <div className="text-[10px] uppercase tracking-wider font-semibold text-slate-500">
            {level}
          </div>
          <div className="text-sm font-semibold text-slate-900 dark:text-slate-100 leading-tight">{title}</div>
        </div>
      </div>
      {items.length === 0 ? (
        <div className="text-[11px] text-slate-400 italic">— ไม่จับคู่ —</div>
      ) : (
        <ul className="space-y-1">
          {items.map((it) => (
            <li key={it.id} className="text-xs text-slate-700 dark:text-slate-300 leading-snug line-clamp-2">
              <Check className="inline h-2.5 w-2.5 mr-1 text-emerald-600" />
              {it.text}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
