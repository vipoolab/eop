"use client";

// Client component — AI draft form + live result preview

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  Loader2,
  Sparkles,
  Copy,
  Check,
  FileText,
  Clock,
  Zap,
  RotateCcw,
} from "lucide-react";
import {
  PRIORITY_LABELS,
  type CommandPriority,
} from "@/features/commands/types";

const PRIORITIES: CommandPriority[] = [
  "LOW",
  "NORMAL",
  "HIGH",
  "URGENT",
  "CRITICAL",
];

interface DraftResult {
  reference: string;
  objective: string;
  body: string;
  model: string;
  tokensUsed: number;
  elapsedMs: number;
}

// Demo presets — TOR 2.2.2 (ก่อเหตุ / อันตรายร้ายแรง / งานสำคัญพิเศษ / งานพิเศษอื่นๆ)
const PRESETS = [
  {
    label: "ก่อเหตุประท้วง",
    icon: "⚠️",
    data: {
      subject: "การเตรียมความพร้อมรับมือการชุมนุมในพื้นที่ บก.น. ๕",
      objective:
        "กำหนดมาตรการดูแลความปลอดภัยและรักษาความสงบเรียบร้อยในช่วงการชุมนุม",
      recipient: "ผกก.สน. ในสังกัด บก.น. ๕ ทุกหน่วย",
      timeframe: "ตั้งแต่บัดนี้จนกว่าสถานการณ์จะคลี่คลาย",
      priority: "URGENT" as CommandPriority,
      context:
        "ได้รับรายงานว่าจะมีการชุมนุมประท้วงในวันที่ ๒๕ พ.ค. ๖๙ ที่หน้ารัฐสภา",
    },
  },
  {
    label: "ภัยพิบัติฉุกเฉิน",
    icon: "🚨",
    data: {
      subject: "การช่วยเหลือผู้ประสบอุทกภัยในพื้นที่ภาคใต้",
      objective:
        "จัดกำลังพลร่วมช่วยเหลือผู้ประสบภัยและรักษาความปลอดภัยทรัพย์สิน",
      recipient: "ผบช.ภ. ๘, ผบช.ภ. ๙ และหน่วยปฏิบัติทุกหน่วยในพื้นที่",
      timeframe: "ทันที — จนกว่าสถานการณ์จะคลี่คลาย",
      priority: "CRITICAL" as CommandPriority,
      context:
        "เกิดอุทกภัยรุนแรงในจังหวัดสุราษฎร์ธานี นครศรีธรรมราช และสงขลา",
    },
  },
  {
    label: "งานสำคัญพิเศษ",
    icon: "👑",
    data: {
      subject: "การถวายความปลอดภัยในการเสด็จพระราชดำเนิน",
      objective:
        "จัดกำลังถวายความปลอดภัยและอำนวยความสะดวกการจราจรตามเส้นทางเสด็จฯ",
      recipient:
        "บก.อก. และ ผกก.สน. ในเส้นทางเสด็จฯ ทุกหน่วย",
      timeframe: "วันที่ ๒๘ พ.ค. ๖๙ เวลา ๐๘.๐๐ — ๑๖.๐๐ น.",
      priority: "CRITICAL" as CommandPriority,
      context: "พระบาทสมเด็จพระเจ้าอยู่หัวฯ เสด็จฯ ทรงเปิดงานที่ ลานคนเมือง",
    },
  },
  {
    label: "งานทั่วไป",
    icon: "📋",
    data: {
      subject: "การจัดทำรายงาน ก.พ.ร. ประจำไตรมาส",
      objective:
        "รวบรวมและจัดทำรายงานผลการปฏิบัติราชการตามตัวชี้วัด ก.พ.ร.",
      recipient: "หน.หน่วยในสังกัด สยศ.ตร. ทุกหน่วย",
      timeframe: "ส่งภายในวันที่ ๓๐ พ.ค. ๖๙",
      priority: "NORMAL" as CommandPriority,
      context: "ครบกำหนดส่งรายงาน ก.พ.ร. ไตรมาสที่ ๓ ปีงบประมาณ ๒๕๖๙",
    },
  },
];

export function CommandDraftForm() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<DraftResult | null>(null);
  const [copied, setCopied] = useState(false);

  const [subject, setSubject] = useState("");
  const [objective, setObjective] = useState("");
  const [recipient, setRecipient] = useState("");
  const [timeframe, setTimeframe] = useState("");
  const [context, setContext] = useState("");
  const [priority, setPriority] = useState<CommandPriority>("NORMAL");

  function loadPreset(p: (typeof PRESETS)[number]) {
    setSubject(p.data.subject);
    setObjective(p.data.objective);
    setRecipient(p.data.recipient);
    setTimeframe(p.data.timeframe);
    setContext(p.data.context);
    setPriority(p.data.priority);
    setResult(null);
    setError(null);
  }

  function reset() {
    setSubject("");
    setObjective("");
    setRecipient("");
    setTimeframe("");
    setContext("");
    setPriority("NORMAL");
    setResult(null);
    setError(null);
  }

  async function handleGenerate(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const res = await fetch("/api/ai/draft", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          subject,
          objective,
          recipient,
          timeframe: timeframe || undefined,
          context: context || undefined,
          priority,
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        if (data.errors && Array.isArray(data.errors)) {
          throw new Error(
            data.errors
              .map(
                (er: { field?: string; message: string }) =>
                  `${er.field ? er.field + ": " : ""}${er.message}`
              )
              .join("\n")
          );
        }
        throw new Error(data.message || "ร่างคำสั่งไม่สำเร็จ");
      }

      setResult(data.data);
    } catch (e) {
      setError(e instanceof Error ? e.message : "เกิดข้อผิดพลาด");
    } finally {
      setLoading(false);
    }
  }

  async function copyResult() {
    if (!result) return;
    const text = [
      result.reference ? `อ้างถึง: ${result.reference}` : "",
      `วัตถุประสงค์: ${result.objective}`,
      "",
      result.body,
    ]
      .filter(Boolean)
      .join("\n");
    await navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  async function saveAsDraft() {
    if (!result) return;
    setLoading(true);
    setError(null);
    try {
      // Need at least 1 target unit — let user pick later in workflow page
      // For now, redirect to /command/workflow/new with prefill via sessionStorage
      sessionStorage.setItem(
        "ai-draft-prefill",
        JSON.stringify({
          subject,
          recipient,
          reference: result.reference,
          objective: result.objective,
          body: result.body,
          priority,
          aiAssisted: true,
          aiPromptUsed: { subject, objective, timeframe, context },
        })
      );
      router.push("/command/workflow/new?from=ai");
    } catch (e) {
      setError(e instanceof Error ? e.message : "เกิดข้อผิดพลาด");
      setLoading(false);
    }
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* LEFT: Form */}
      <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-sm font-semibold text-slate-700">
            กรอกข้อมูล 5 ช่อง
          </h2>
          <button
            type="button"
            onClick={reset}
            className="inline-flex items-center gap-1 text-xs text-slate-500 hover:text-slate-700"
          >
            <RotateCcw className="h-3 w-3" />
            ล้าง
          </button>
        </div>

        {/* Presets */}
        <div className="mb-4">
          <p className="text-xs text-slate-500 mb-2">
            เริ่มจากตัวอย่าง:
          </p>
          <div className="grid grid-cols-2 gap-2">
            {PRESETS.map((p) => (
              <button
                key={p.label}
                type="button"
                onClick={() => loadPreset(p)}
                className="inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-slate-50 hover:bg-[#1e3a5f]/5 hover:border-[#1e3a5f] px-3 py-2 text-xs text-slate-700 transition-colors text-left"
              >
                <span className="text-base">{p.icon}</span>
                <span className="font-medium">{p.label}</span>
              </button>
            ))}
          </div>
        </div>

        <form onSubmit={handleGenerate} className="space-y-3">
          <Field label="หัวเรื่อง *">
            <input
              type="text"
              required
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              placeholder="ระบุหัวเรื่องของคำสั่ง"
              className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#1e3a5f]"
            />
          </Field>

          <Field label="วัตถุประสงค์ *">
            <textarea
              required
              rows={2}
              value={objective}
              onChange={(e) => setObjective(e.target.value)}
              placeholder="เป้าหมายของการสั่งการ"
              className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#1e3a5f] resize-none"
            />
          </Field>

          <Field label="หน่วยรับ *">
            <input
              type="text"
              required
              value={recipient}
              onChange={(e) => setRecipient(e.target.value)}
              placeholder="เช่น ผบก. / หน่วยปฏิบัติทุกหน่วยในสังกัด"
              className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#1e3a5f]"
            />
          </Field>

          <div className="grid grid-cols-2 gap-3">
            <Field label="ระยะเวลา/Deadline">
              <input
                type="text"
                value={timeframe}
                onChange={(e) => setTimeframe(e.target.value)}
                placeholder="เช่น ภายใน ๓๐ พ.ค."
                className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#1e3a5f]"
              />
            </Field>

            <Field label="ความสำคัญ">
              <select
                value={priority}
                onChange={(e) =>
                  setPriority(e.target.value as CommandPriority)
                }
                className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-[#1e3a5f]"
              >
                {PRIORITIES.map((p) => (
                  <option key={p} value={p}>
                    {PRIORITY_LABELS[p]}
                  </option>
                ))}
              </select>
            </Field>
          </div>

          <Field label="บริบทเพิ่มเติม / สถานการณ์">
            <textarea
              rows={3}
              value={context}
              onChange={(e) => setContext(e.target.value)}
              placeholder="รายละเอียดสถานการณ์ ที่ต้องให้ AI พิจารณา"
              className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#1e3a5f] resize-none"
            />
          </Field>

          <button
            type="submit"
            disabled={loading}
            className="w-full inline-flex items-center justify-center gap-2 rounded-lg bg-[#1e3a5f] hover:bg-[#142a45] border border-[#142a45] px-4 py-3 text-sm font-semibold text-white shadow-md transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                AI กำลังร่าง...
              </>
            ) : (
              <>
                <Sparkles className="h-4 w-4" />
                ให้ AI ร่างให้
              </>
            )}
          </button>

          {error && (
            <div className="rounded-md bg-rose-50 border border-rose-200 px-3 py-2 text-xs text-rose-700 whitespace-pre-wrap">
              {error}
            </div>
          )}
        </form>
      </div>

      {/* RIGHT: Result */}
      <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-sm font-semibold text-slate-700 flex items-center gap-2">
            <FileText className="h-4 w-4" />
            ผลลัพธ์จาก AI
          </h2>
          {result && (
            <div className="flex items-center gap-2">
              <button
                onClick={copyResult}
                className="inline-flex items-center gap-1 text-xs text-slate-500 hover:text-slate-700"
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
          <div className="flex flex-col items-center justify-center h-96 text-center text-slate-400">
            <Sparkles className="h-12 w-12 mb-3 opacity-30" />
            <p className="text-sm">กรอกข้อมูลด้านซ้าย แล้วกด</p>
            <p className="text-sm font-medium">"ให้ AI ร่างให้"</p>
            <p className="text-xs mt-2 text-slate-300">
              หรือเลือกตัวอย่าง 4 กรณีด้านบนเพื่อทดลองทันที
            </p>
          </div>
        )}

        {loading && (
          <div className="flex flex-col items-center justify-center h-96 text-center">
            <div className="relative">
              <Loader2 className="h-12 w-12 animate-spin text-[#1e3a5f]" />
              <Sparkles className="h-5 w-5 absolute top-3.5 left-3.5 text-[#1e3a5f]/40" />
            </div>
            <p className="text-sm text-slate-600 mt-3">
              Claude AI กำลังร่างคำสั่ง...
            </p>
            <p className="text-xs text-slate-400 mt-1">
              ใช้เวลาประมาณ 5-15 วินาที
            </p>
          </div>
        )}

        {result && (
          <div className="space-y-4">
            {/* Meta badges */}
            <div className="flex flex-wrap gap-2">
              <Badge icon={<Zap className="h-3 w-3" />}>
                {result.model}
              </Badge>
              <Badge icon={<Clock className="h-3 w-3" />}>
                {(result.elapsedMs / 1000).toFixed(1)} วินาที
              </Badge>
              <Badge>{result.tokensUsed} tokens</Badge>
            </div>

            {/* Result content */}
            <div className="space-y-3 max-h-[450px] overflow-y-auto">
              {result.reference && (
                <ResultField label="อ้างถึง">
                  {result.reference}
                </ResultField>
              )}
              <ResultField label="วัตถุประสงค์">
                {result.objective}
              </ResultField>
              <ResultField label="เนื้อหาคำสั่ง">
                <div className="whitespace-pre-wrap leading-relaxed">
                  {result.body}
                </div>
              </ResultField>
            </div>

            {/* Action: save as draft */}
            <button
              onClick={saveAsDraft}
              disabled={loading}
              className="w-full inline-flex items-center justify-center gap-2 rounded-lg bg-[#1e3a5f] hover:bg-[#142a45] border border-[#142a45] px-4 py-2.5 text-sm font-medium text-white disabled:opacity-50"
            >
              <FileText className="h-4 w-4" />
              บันทึกเป็นร่างคำสั่งใหม่
            </button>
            <p className="text-[10px] text-slate-400 text-center">
              จะนำไปยังหน้าสร้างคำสั่ง — ให้เลือกหน่วยรับและตรวจทานก่อนบันทึก
            </p>
          </div>
        )}
      </div>
    </div>
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
      <label className="block text-xs font-medium text-slate-700 mb-1">
        {label}
      </label>
      {children}
    </div>
  );
}

function Badge({
  children,
  icon,
}: {
  children: React.ReactNode;
  icon?: React.ReactNode;
}) {
  return (
    <span className="inline-flex items-center gap-1 rounded-md bg-[#1e3a5f]/5 border border-[#1e3a5f]/20 px-2 py-0.5 text-[11px] font-medium text-[#1e3a5f]">
      {icon}
      {children}
    </span>
  );
}

function ResultField({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <div className="text-[11px] font-medium text-slate-500 uppercase tracking-wider mb-1">
        {label}
      </div>
      <div className="rounded-lg bg-slate-50 border border-slate-100 px-3 py-2 text-sm text-slate-800">
        {children}
      </div>
    </div>
  );
}
