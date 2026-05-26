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
  Send,
  Target,
  ListChecks,
  Clock,
  Pencil,
  Lock,
} from "lucide-react";
import type { DrafterOutput } from "@/lib/commands/types";
import { safeJson } from "@/lib/utils";

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

// ── Thai-numeral helper ─────────────────────────
const THAI_DIGIT = ["๐", "๑", "๒", "๓", "๔", "๕", "๖", "๗", "๘", "๙"];
function toThaiNumeral(n: number): string {
  return String(n)
    .split("")
    .map((c) => (c >= "0" && c <= "9" ? THAI_DIGIT[Number(c)] : c))
    .join("");
}
function thaiDate(d: Date): string {
  const months = [
    "มกราคม", "กุมภาพันธ์", "มีนาคม", "เมษายน", "พฤษภาคม", "มิถุนายน",
    "กรกฎาคม", "สิงหาคม", "กันยายน", "ตุลาคม", "พฤศจิกายน", "ธันวาคม",
  ];
  return `${toThaiNumeral(d.getDate())} ${months[d.getMonth()]} พ.ศ. ${toThaiNumeral(d.getFullYear() + 543)}`;
}

export function DraftStep({ fields, intent, draft, onDraftReceived, onChange }: Props) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [planTitles, setPlanTitles] = useState<Record<string, AlignedItem>>({});

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

  async function run() {
    setLoading(true);
    setError(null);
    try {
      const body: Record<string, string> = {};
      if (fields.keywords || fields.baseInfo || fields.context) {
        body.keywords = fields.keywords;
        body.baseInfo = fields.baseInfo;
        body.context = fields.context;
      } else {
        body.intent = intent;
      }
      // Sync endpoint — Vercel serverless can't keep in-memory tasks across
      // lambda invocations, so we wait for Claude inline within this request.
      const res = await fetch("/api/commands/draft", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(body),
      });
      const j = await safeJson(res);
      if (!j.success) {
        setError(j.message ?? "ร่างไม่สำเร็จ");
        setLoading(false);
        return;
      }
      const data = j.data as {
        result: DrafterOutput;
        model: string;
        durationMs: number;
        tokens: { input: number; output: number };
      };
      onDraftReceived(data.result, {
        model: data.model,
        durationMs: data.durationMs,
        inputTokens: data.tokens.input,
        outputTokens: data.tokens.output,
      });
      setLoading(false);
    } catch (e) {
      setError((e as Error).message);
      setLoading(false);
    }
  }

  if (loading) {
    return <DraftLoadingState />;
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

      {/* ── 5-Section PoC Output Cards ── */}
      <section className="rounded-sm border-2 border-[#b8860b]/40 bg-gradient-to-br from-amber-50/40 to-white dark:from-amber-900/10 dark:to-slate-900 p-4">
        <div className="flex items-center gap-2 mb-3">
          <Sparkles className="h-4 w-4 text-[#b8860b]" />
          <h3 className="text-sm font-bold text-[#b8860b] uppercase tracking-wider">
            ๕ องค์ประกอบ (ตามเกณฑ์ PoC)
          </h3>
        </div>

        <div className="space-y-3">
          {/* 1. Subject */}
          <PocCard num="๑" icon={Tag} accent="navy" label="หัวเรื่อง" editable={false}>
            <input
              type="text"
              value={draft.letter.subject}
              onChange={(e) => setLetter({ subject: e.target.value })}
              className="w-full bg-transparent border-b border-dashed border-slate-300 hover:border-slate-400 focus:border-[#1e3a5f] focus:outline-none text-sm font-semibold text-slate-900 dark:text-slate-100 py-1"
            />
          </PocCard>

          {/* 2. Recipient — EDITABLE flag */}
          <PocCard num="๒" icon={Send} accent="gold" label="หน่วยงาน/ผู้รับคำสั่ง" editable={true}>
            <input
              type="text"
              value={draft.letter.recipient}
              onChange={(e) => setLetter({ recipient: e.target.value })}
              className="w-full bg-transparent border-b-2 border-[#b8860b]/40 hover:border-[#b8860b]/60 focus:border-[#b8860b] focus:outline-none text-sm font-semibold text-slate-900 dark:text-slate-100 py-1"
            />
          </PocCard>

          {/* 3. Objective */}
          <PocCard num="๓" icon={Target} accent="blue" label="วัตถุประสงค์/เหตุผลของการสั่งการ" editable={false}>
            <textarea
              value={draft.letter.objective ?? ""}
              onChange={(e) => setLetter({ objective: e.target.value })}
              rows={2}
              className="w-full bg-transparent border-b border-dashed border-slate-300 hover:border-slate-400 focus:border-[#1e3a5f] focus:outline-none text-sm text-slate-900 dark:text-slate-100 py-1 resize-none leading-relaxed"
            />
          </PocCard>

          {/* 4. Directives */}
          <PocCard num="๔" icon={ListChecks} accent="emerald" label="ข้อสั่งการหลัก/แนวทางปฏิบัติ" editable={false}>
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

          {/* 5. Report Instruction — EDITABLE flag */}
          <PocCard num="๕" icon={Clock} accent="amber" label="ระยะเวลา/เงื่อนไขการรายงานผล" editable={true}>
            <textarea
              value={draft.letter.reportInstruction ?? ""}
              onChange={(e) => setLetter({ reportInstruction: e.target.value })}
              rows={2}
              className="w-full bg-transparent border-b-2 border-[#b8860b]/40 hover:border-[#b8860b]/60 focus:border-[#b8860b] focus:outline-none text-sm text-slate-900 dark:text-slate-100 py-1 resize-none leading-relaxed"
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

// ── Formal Letter Preview (real Thai government format) ──

function FormalLetterPreview({ draft }: { draft: DrafterOutput }) {
  const today = thaiDate(new Date());
  const docNumber = draft.letter.docNumber ?? "ที่ ตร. ........./๒๕๖๙";

  return (
    <section className="border border-slate-300 dark:border-slate-700 rounded-sm bg-white dark:bg-slate-950 overflow-hidden shadow-sm">
      <div className="border-b border-slate-200 dark:border-slate-700 px-4 py-2.5 flex items-center justify-between bg-slate-50 dark:bg-slate-900">
        <div className="flex items-center gap-2">
          <FileText className="h-4 w-4 text-[#1e3a5f] dark:text-amber-400" />
          <span className="text-sm font-semibold text-slate-800 dark:text-slate-100">
            ตัวอย่างหนังสือสั่งการ (Preview)
          </span>
        </div>
        <span className="text-[10px] text-slate-500 dark:text-slate-400">
          ตามระเบียบสำนักนายกรัฐมนตรีว่าด้วยงานสารบรรณ พ.ศ. ๒๕๒๖
        </span>
      </div>

      <div className="p-8 md:p-10 bg-white dark:bg-slate-950 font-[var(--font-thai)] text-slate-900 dark:text-slate-100 leading-loose">
        {/* Header — ตราครุฑ */}
        <div className="flex flex-col items-center mb-6">
          <div className="h-12 w-12 rounded-full border-2 border-slate-700 dark:border-slate-300 flex items-center justify-center text-2xl">
            <span aria-hidden>🛡️</span>
          </div>
          <div className="text-[10px] text-slate-500 mt-1">[ตราครุฑ]</div>
        </div>

        {/* Doc # + Date */}
        <div className="flex justify-between text-sm mb-3">
          <div>
            <div>{docNumber}</div>
            <div className="text-xs text-slate-500">สำนักงานตำรวจแห่งชาติ</div>
          </div>
          <div className="text-right">
            <div>{today}</div>
          </div>
        </div>

        {/* Subject + Recipient */}
        <div className="space-y-1 mb-4 mt-6">
          <div>
            <span className="font-semibold mr-2">เรื่อง</span>
            <span>{stripLead(draft.letter.subject, "เรื่อง")}</span>
          </div>
          <div>
            <span className="font-semibold mr-2">เรียน</span>
            <span>{stripLead(draft.letter.recipient, "เรียน")}</span>
          </div>
          {draft.letter.references && draft.letter.references.length > 0 && (
            <div>
              <span className="font-semibold mr-2">อ้างถึง</span>
              <span>{draft.letter.references.join(" / ")}</span>
            </div>
          )}
        </div>

        {/* Introduction + Objective */}
        <div className="text-justify indent-12 my-4 leading-loose">
          {draft.letter.introduction || draft.letter.objective}
        </div>

        {/* Directives */}
        <div className="my-4">
          <div className="indent-12 mb-2">จึงให้ดำเนินการดังนี้</div>
          <div className="space-y-2 pl-8">
            {draft.letter.directives.map((d, idx) => (
              <div key={idx} className="text-justify">{d}</div>
            ))}
          </div>
        </div>

        {/* Report timeframe */}
        {draft.letter.reportInstruction && (
          <div className="text-justify indent-12 my-4 leading-loose">
            {draft.letter.reportInstruction}
          </div>
        )}

        {/* Closing */}
        <div className="text-justify indent-12 my-4 leading-loose">
          {draft.letter.closing}
        </div>

        {/* Signature */}
        <div className="text-right mt-12 space-y-0.5">
          <div className="border-b border-slate-400 dark:border-slate-600 w-48 ml-auto mb-1" />
          <div className="text-sm">{draft.letter.signerName ?? "( )"}</div>
          <div className="text-sm">{draft.letter.signerTitle ?? ""}</div>
        </div>
      </div>
    </section>
  );
}

function stripLead(s: string, lead: string): string {
  return s.replace(new RegExp(`^\\s*${lead}\\s*`), "");
}

// ── Loading state ─────────────────────────────────

function DraftLoadingState() {
  const [phase, setPhase] = useState(0);
  const [elapsed, setElapsed] = useState(0);

  useEffect(() => {
    const phaseTimer = setInterval(() => {
      setPhase((p) => Math.min(p + 1, 4));
    }, 12000);
    const elapsedTimer = setInterval(() => {
      setElapsed((e) => e + 1);
    }, 1000);
    return () => {
      clearInterval(phaseTimer);
      clearInterval(elapsedTimer);
    };
  }, []);

  const phases = [
    "อ่าน ๓ ส่วน input (คำสำคัญ + ข้อมูลตั้งต้น + บริบท)",
    "ค้นหาแผนที่สอดคล้องใน ๓ ระดับ",
    "ร่าง ๕ องค์ประกอบของหนังสือสั่งการ",
    "จัดรูปแบบให้ตรงตามระเบียบงานสารบรรณ",
    "แนะนำ KPI สำหรับติดตามผล",
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
        AI Engine กำลังประมวลผล
      </div>
      <div className="text-xs text-slate-500 dark:text-slate-400 mt-1">
        ใช้เวลา ~๔๕-๙๐ วินาที สำหรับงานคุณภาพระดับร่างราชการ
      </div>

      <div className="mt-6 w-full max-w-md space-y-1.5">
        {phases.map((p, idx) => {
          const done = idx < phase;
          const active = idx === phase;
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
