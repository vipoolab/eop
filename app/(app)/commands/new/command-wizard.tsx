"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  CheckCircle2,
  AlertCircle,
  ChevronRight,
  Send,
  Save,
  UserCheck,
  Siren,
  AlertOctagon,
  Zap,
} from "lucide-react";
import type { Persona } from "@/lib/police-org/types";
import type {
  WizardStep,
  DrafterOutput,
  CascadeMode,
  KpiDefinition,
  CommandPriority,
  EmergencyTriggerType,
} from "@/lib/commands/types";
import {
  PRIORITY_LABELS,
  EMERGENCY_TRIGGER_TYPES,
} from "@/lib/commands/types";
import { IntentStep } from "./steps/intent-step";
import { DraftStep } from "./steps/draft-step";
import { TargetsStep } from "./steps/targets-step";
import { ScheduleStep } from "./steps/schedule-step";
import { KpiStep } from "./steps/kpi-step";
import { ReviewStep } from "./steps/review-step";

const STEPS: { key: WizardStep; label: string; description: string }[] = [
  { key: "INTENT", label: "เจตนา", description: "บอก AI ว่าจะสั่งอะไร" },
  { key: "DRAFT", label: "ร่าง+จับคู่", description: "AI ร่างหนังสือ+จับคู่แผน" },
  { key: "TARGETS", label: "หน่วยรับ", description: "เลือกหน่วยที่จะสั่ง" },
  { key: "SCHEDULE", label: "ระยะเวลา", description: "วันเริ่ม-สิ้นสุด" },
  { key: "KPI", label: "ตัวชี้วัด", description: "KPI ติดตามผล" },
  { key: "REVIEW", label: "ตรวจสอบ", description: "ดูครบและส่ง" },
];

// In EMERGENCY mode we skip DRAFT/KPI (auto-templated by server) and show
// only the targets step.
const EMERGENCY_STEPS: { key: WizardStep; label: string; description: string }[] = [
  { key: "TARGETS", label: "หน่วยรับ", description: "เลือกหน่วยที่จะสั่งฉุกเฉิน" },
  { key: "REVIEW", label: "ตรวจสอบ", description: "ตรวจและส่งทันที" },
];

export interface WizardState {
  // PoC 3-input fields
  intentKeywords: string;
  intentBaseInfo: string;
  intentContext: string;
  // Derived legacy combined intent (for compat with command record)
  intent: string;
  draftResult: DrafterOutput | null;
  draftMeta: { model: string; durationMs: number; inputTokens: number; outputTokens: number } | null;
  targetUnitIds: string[];
  cascadeMode: CascadeMode;
  effectiveDate: string;
  dueDate: string;
  kpis: KpiDefinition[];
  // Priority + emergency-specific
  priority: CommandPriority;
  emergencyTriggerType: EmergencyTriggerType;
  emergencyLocation: string;
  emergencyDescription: string;
}

const TODAY = new Date();
const DEFAULT_END = new Date(TODAY.getTime() + 30 * 24 * 60 * 60 * 1000);

function toDateInput(d: Date): string {
  return d.toISOString().slice(0, 10);
}

const INITIAL_STATE: WizardState = {
  intentKeywords: "",
  intentBaseInfo: "",
  intentContext: "",
  intent: "",
  draftResult: null,
  draftMeta: null,
  targetUnitIds: [],
  cascadeMode: "CASCADE",
  effectiveDate: toDateInput(TODAY),
  dueDate: toDateInput(DEFAULT_END),
  kpis: [],
  priority: "NORMAL",
  emergencyTriggerType: "เหตุก่อการร้าย",
  emergencyLocation: "",
  emergencyDescription: "",
};

export function CommandWizard() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const initialPriority = (searchParams.get("priority") as CommandPriority | null) ?? "NORMAL";

  const [state, setState] = useState<WizardState>({
    ...INITIAL_STATE,
    priority: initialPriority === "EMERGENCY" || initialPriority === "URGENT"
      ? initialPriority
      : "NORMAL",
  });
  const stepList = state.priority === "EMERGENCY" ? EMERGENCY_STEPS : STEPS;
  const [step, setStep] = useState<WizardStep>(stepList[0].key);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [persona, setPersona] = useState<Persona | null>(null);
  const [supervisor, setSupervisor] = useState<Persona | null>(null);

  const currentIdx = stepList.findIndex((s) => s.key === step);

  // Load persona
  useEffect(() => {
    fetch("/api/persona")
      .then((r) => r.json())
      .then((j) => {
        const p: Persona | undefined = j.data?.active;
        if (p) setPersona(p);
        if (p?.supervisorPersonaId) {
          const sup = (j.data?.personas as Persona[]).find(
            (x) => x.id === p.supervisorPersonaId
          );
          if (sup) setSupervisor(sup);
        }
      })
      .catch(() => {});
  }, []);

  const isJunior = persona?.authority === "DRAFT_ONLY";
  const isEmergency = state.priority === "EMERGENCY";

  function updateState(patch: Partial<WizardState>) {
    setState((prev) => ({ ...prev, ...patch }));
  }

  function changePriority(p: CommandPriority) {
    setState((prev) => ({ ...prev, priority: p }));
    // Reset step to the first one of the new flow
    const list = p === "EMERGENCY" ? EMERGENCY_STEPS : STEPS;
    setStep(list[0].key);
    setError(null);
  }

  function goNext() {
    setError(null);
    const nextIdx = currentIdx + 1;
    if (nextIdx < stepList.length) setStep(stepList[nextIdx].key);
  }

  function goPrev() {
    setError(null);
    const prevIdx = currentIdx - 1;
    if (prevIdx >= 0) setStep(stepList[prevIdx].key);
  }

  async function submit(action: "draft" | "submit" | "dispatch") {
    if (!state.draftResult) {
      setError("ยังไม่มีร่าง");
      return;
    }
    setSubmitting(true);
    setError(null);
    try {
      const res = await fetch("/api/commands", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          userIntent: state.intent,
          letter: state.draftResult.letter,
          alignment: state.draftResult.alignment,
          draftedBy: state.draftMeta?.model ?? "ai-engine",
          draftDurationMs: state.draftMeta?.durationMs,
          draftTokens: state.draftMeta
            ? state.draftMeta.inputTokens + state.draftMeta.outputTokens
            : undefined,
          targetUnitIds: state.targetUnitIds,
          cascadeMode: state.cascadeMode,
          effectiveDate: new Date(state.effectiveDate).toISOString(),
          dueDate: new Date(state.dueDate).toISOString(),
          kpis: state.kpis,
          action,
          priority: state.priority,
        }),
      });
      const j = await res.json();
      if (!j.success) {
        setError(j.message ?? "เกิดข้อผิดพลาด");
        return;
      }
      router.push(`/commands/${j.data.command.id}`);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setSubmitting(false);
    }
  }

  async function submitEmergency() {
    if (!state.emergencyDescription.trim()) {
      setError("กรุณากรอกรายละเอียดเหตุฉุกเฉิน");
      return;
    }
    if (state.targetUnitIds.length === 0) {
      setError("กรุณาเลือกหน่วยรับคำสั่งอย่างน้อย 1 หน่วย");
      return;
    }
    setSubmitting(true);
    setError(null);
    try {
      const res = await fetch("/api/commands/emergency", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          triggerType: state.emergencyTriggerType,
          location: state.emergencyLocation,
          description: state.emergencyDescription,
          targetUnitIds: state.targetUnitIds,
          cascadeMode: state.cascadeMode,
          instructions: state.intent,
        }),
      });
      const j = await res.json();
      if (!j.success) {
        setError(j.message ?? "เกิดข้อผิดพลาด");
        return;
      }
      router.push(`/commands/${j.data.command.id}`);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="space-y-6">
      {/* Priority selector (always visible at top) */}
      <PrioritySelector value={state.priority} onChange={changePriority} />

      {/* Emergency form (only when EMERGENCY is selected) */}
      {isEmergency && (
        <EmergencyDetails
          triggerType={state.emergencyTriggerType}
          location={state.emergencyLocation}
          description={state.emergencyDescription}
          instructions={state.intent}
          onChange={(patch) => updateState(patch)}
        />
      )}

      {/* Stepper */}
      <Stepper currentIdx={currentIdx} steps={stepList} />

      {/* Step content */}
      <div className="bg-white border border-slate-200 rounded-sm p-5 min-h-[300px]">
        {!isEmergency && step === "INTENT" && (
          <IntentStep
            fields={{
              keywords: state.intentKeywords,
              baseInfo: state.intentBaseInfo,
              context: state.intentContext,
            }}
            onChange={(next) => {
              // also keep `intent` as a combined string for backwards compat
              const combined = [
                next.keywords && `คำสำคัญ: ${next.keywords}`,
                next.baseInfo && `ข้อมูลตั้งต้น: ${next.baseInfo}`,
                next.context && `บริบท: ${next.context}`,
              ]
                .filter(Boolean)
                .join("\n\n");
              updateState({
                intentKeywords: next.keywords,
                intentBaseInfo: next.baseInfo,
                intentContext: next.context,
                intent: combined,
              });
            }}
            onNext={goNext}
          />
        )}
        {!isEmergency && step === "DRAFT" && (
          <DraftStep
            fields={{
              keywords: state.intentKeywords,
              baseInfo: state.intentBaseInfo,
              context: state.intentContext,
            }}
            intent={state.intent}
            draft={state.draftResult}
            onDraftReceived={(r, meta) => {
              const updates: Partial<WizardState> = {
                draftResult: r,
                draftMeta: meta,
                kpis: r.suggestedKpis ?? [],
              };
              // Auto-fill targets from AI suggestion
              if (r.suggestedTargetUnitIds && r.suggestedTargetUnitIds.length > 0) {
                updates.targetUnitIds = r.suggestedTargetUnitIds;
              }
              if (r.suggestedCascadeMode) {
                updates.cascadeMode = r.suggestedCascadeMode;
              }
              // Auto-fill schedule from AI suggested duration
              if (r.suggestedDurationDays && r.suggestedDurationDays > 0) {
                const start = new Date();
                const end = new Date();
                end.setDate(end.getDate() + r.suggestedDurationDays);
                updates.effectiveDate = start.toISOString().slice(0, 10);
                updates.dueDate = end.toISOString().slice(0, 10);
              }
              updateState(updates);
            }}
            onChange={(r) => updateState({ draftResult: r })}
          />
        )}
        {step === "TARGETS" && (
          <TargetsStep
            selectedIds={state.targetUnitIds}
            cascadeMode={state.cascadeMode}
            onChange={(ids, mode) =>
              updateState({ targetUnitIds: ids, cascadeMode: mode })
            }
            aiPrefilled={!isEmergency && !!state.draftResult?.suggestedTargetUnitIds?.length}
            aiSuggestedFrom={state.draftResult?.letter.recipient}
          />
        )}
        {!isEmergency && step === "SCHEDULE" && (
          <ScheduleStep
            effectiveDate={state.effectiveDate}
            dueDate={state.dueDate}
            onChange={(s, d) => updateState({ effectiveDate: s, dueDate: d })}
            aiPrefilled={!!state.draftResult?.suggestedDurationDays}
            aiSuggestedFrom={state.draftResult?.letter.reportInstruction}
          />
        )}
        {!isEmergency && step === "KPI" && (
          <KpiStep
            kpis={state.kpis}
            onChange={(kpis) => updateState({ kpis })}
            suggestedKpis={state.draftResult?.suggestedKpis ?? []}
          />
        )}
        {step === "REVIEW" && isEmergency && (
          <EmergencyReview state={state} />
        )}
        {step === "REVIEW" && !isEmergency && (
          <ReviewStep state={state} />
        )}
      </div>

      {error && (
        <div className="rounded-sm border border-red-300 bg-red-50 p-4 flex items-start gap-3">
          <AlertCircle className="h-5 w-5 text-red-700 shrink-0" />
          <div className="text-sm text-red-900">{error}</div>
        </div>
      )}

      {/* Navigation */}
      <div className="flex items-center justify-between">
        <button
          type="button"
          onClick={goPrev}
          disabled={currentIdx === 0 || submitting}
          className="text-sm rounded-sm border border-slate-300 hover:bg-slate-50 px-4 py-2 disabled:opacity-40 disabled:cursor-not-allowed"
        >
          ย้อนกลับ
        </button>

        {step === "REVIEW" ? (
          isEmergency ? (
            <button
              type="button"
              suppressHydrationWarning
              onClick={submitEmergency}
              disabled={submitting}
              className="inline-flex items-center gap-1.5 text-sm rounded-sm bg-red-600 hover:bg-red-700 text-white font-bold px-5 py-2.5 disabled:opacity-40 disabled:cursor-not-allowed shadow"
            >
              <Siren className="h-4 w-4" />
              {submitting ? "กำลังส่งคำสั่งฉุกเฉิน..." : "ส่งคำสั่งฉุกเฉินทันที"}
            </button>
          ) : (
            <div className="flex flex-col items-end gap-2">
              {isJunior && supervisor && (
                <div className="text-[11px] text-amber-700 dark:text-amber-400">
                  💡 ในฐานะ <strong>{persona?.role}</strong> ระบบจะเสนอให้{" "}
                  <strong>
                    {supervisor.rank} {supervisor.name.split(" ").slice(1).join(" ")}
                  </strong>{" "}
                  ({supervisor.role}) อนุมัติ
                </div>
              )}
              <div className="flex gap-2">
                <button
                  type="button"
                  suppressHydrationWarning
                  onClick={() => submit("draft")}
                  disabled={submitting}
                  className="inline-flex items-center gap-1.5 text-sm rounded-sm border border-slate-300 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 px-4 py-2 disabled:opacity-40"
                >
                  <Save className="h-4 w-4" />
                  บันทึกเป็นร่าง
                </button>
                {isJunior ? (
                  <button
                    type="button"
                    suppressHydrationWarning
                    onClick={() => submit("submit")}
                    disabled={submitting}
                    className="inline-flex items-center gap-1.5 text-sm rounded-sm bg-[#b8860b] hover:bg-[#92400e] text-white px-4 py-2 disabled:opacity-40 disabled:cursor-not-allowed"
                  >
                    <UserCheck className="h-4 w-4" />
                    {submitting ? "กำลังเสนอ..." : "เสนอเพื่อขออนุมัติ"}
                  </button>
                ) : (
                  <button
                    type="button"
                    suppressHydrationWarning
                    onClick={() => submit("dispatch")}
                    disabled={submitting}
                    className="inline-flex items-center gap-1.5 text-sm rounded-sm bg-[#1e3a5f] hover:bg-[#142a45] text-white px-4 py-2 disabled:opacity-40 disabled:cursor-not-allowed"
                  >
                    <Send className="h-4 w-4" />
                    {submitting ? "กำลังส่ง..." : "อนุมัติและเผยแพร่"}
                  </button>
                )}
              </div>
            </div>
          )
        ) : (
          <button
            type="button"
            onClick={goNext}
            disabled={!canProceed(step, state, isEmergency)}
            className={`inline-flex items-center gap-1.5 text-sm rounded-sm text-white px-4 py-2 disabled:opacity-40 disabled:cursor-not-allowed ${
              isEmergency
                ? "bg-red-600 hover:bg-red-700"
                : "bg-[#1e3a5f] hover:bg-[#142a45]"
            }`}
          >
            ถัดไป
            <ChevronRight className="h-4 w-4" />
          </button>
        )}
      </div>
    </div>
  );
}

// ── Priority Selector ──────────────────────────

function PrioritySelector({
  value,
  onChange,
}: {
  value: CommandPriority;
  onChange: (p: CommandPriority) => void;
}) {
  const options: { key: CommandPriority; icon: typeof Send; desc: string; color: string }[] = [
    {
      key: "NORMAL",
      icon: Send,
      desc: "หนังสือสั่งการตามขั้นตอนปกติ — ผ่านการอนุมัติ",
      color: "border-slate-300 hover:border-slate-500 text-slate-700",
    },
    {
      key: "URGENT",
      icon: Zap,
      desc: "เร่งด่วน — แจ้งเตือนผ่าน EMAIL + LINE ทันที",
      color:
        "border-amber-300 hover:border-amber-500 text-amber-800",
    },
    {
      key: "EMERGENCY",
      icon: Siren,
      desc: "ฉุกเฉินสูงสุด — ข้ามขั้นตอนอนุมัติ ส่งทันที + แจ้งเตือนทุกช่องทาง",
      color: "border-red-400 hover:border-red-600 text-red-800",
    },
  ];

  return (
    <div className="rounded-sm border-2 border-slate-200 bg-white p-4">
      <div className="text-xs font-semibold uppercase tracking-wider text-slate-700 mb-2 flex items-center gap-1.5">
        <AlertOctagon className="h-3.5 w-3.5" />
        ระดับความสำคัญ (Priority)
      </div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
        {options.map((o) => {
          const Icon = o.icon;
          const active = value === o.key;
          return (
            <button
              key={o.key}
              type="button"
              suppressHydrationWarning
              onClick={() => onChange(o.key)}
              className={`text-left rounded-sm border-2 p-3 transition-colors ${
                active
                  ? o.key === "EMERGENCY"
                    ? "border-red-600 bg-red-50"
                    : o.key === "URGENT"
                    ? "border-amber-500 bg-amber-50"
                    : "border-[#1e3a5f] bg-slate-50"
                  : `bg-white ${o.color}`
              }`}
            >
              <div className="flex items-center gap-2 mb-1">
                <div
                  className={`h-4 w-4 rounded-full border-2 flex items-center justify-center ${
                    active
                      ? o.key === "EMERGENCY"
                        ? "border-red-600 bg-red-600"
                        : o.key === "URGENT"
                        ? "border-amber-500 bg-amber-500"
                        : "border-[#1e3a5f] bg-[#1e3a5f]"
                      : "border-slate-300"
                  }`}
                >
                  {active && <div className="h-1.5 w-1.5 rounded-full bg-white" />}
                </div>
                <Icon
                  className={`h-4 w-4 ${
                    o.key === "EMERGENCY"
                      ? "text-red-600"
                      : o.key === "URGENT"
                      ? "text-amber-600"
                      : "text-slate-600"
                  }`}
                />
                <div className="text-sm font-bold text-slate-900">
                  {PRIORITY_LABELS[o.key]}
                </div>
              </div>
              <div className="text-[11px] leading-snug text-slate-600">
                {o.desc}
              </div>
            </button>
          );
        })}
      </div>

      {value === "EMERGENCY" && (
        <div className="mt-3 rounded-sm border-2 border-red-400 bg-red-50 px-3 py-2.5 text-sm font-semibold text-red-900 flex items-center gap-2">
          <Siren className="h-4 w-4 animate-pulse" />
          โหมดฉุกเฉิน — จะข้ามขั้นตอนอนุมัติและส่งทันที พร้อมแจ้งเตือนทุกช่องทาง (EMAIL/LINE/SMS/วิทยุสื่อสาร)
        </div>
      )}
    </div>
  );
}

// ── Emergency details form ─────────────────────

function EmergencyDetails({
  triggerType,
  location,
  description,
  instructions,
  onChange,
}: {
  triggerType: EmergencyTriggerType;
  location: string;
  description: string;
  instructions: string;
  onChange: (p: Partial<WizardState>) => void;
}) {
  return (
    <div className="rounded-sm border-2 border-red-400 bg-red-50/40 p-4 space-y-3">
      <div className="flex items-center gap-2 text-sm font-bold text-red-900">
        <Siren className="h-4 w-4" />
        รายละเอียดเหตุฉุกเฉิน
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1">
            ประเภทเหตุ <span className="text-red-600">*</span>
          </label>
          <select
            value={triggerType}
            onChange={(e) =>
              onChange({ emergencyTriggerType: e.target.value as EmergencyTriggerType })
            }
            className="w-full rounded-sm border border-red-300 bg-white px-3 py-2 text-sm focus:border-red-600 focus:outline-none"
          >
            {EMERGENCY_TRIGGER_TYPES.map((t) => (
              <option key={t} value={t}>
                {t}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1">
            สถานที่ / พิกัด
          </label>
          <input
            type="text"
            value={location}
            onChange={(e) => onChange({ emergencyLocation: e.target.value })}
            placeholder="เช่น ห้างสรรพสินค้าพันทิป ประตูน้ำ"
            className="w-full rounded-sm border border-red-300 bg-white px-3 py-2 text-sm focus:border-red-600 focus:outline-none"
          />
        </div>
      </div>
      <div>
        <label className="block text-xs font-semibold text-slate-700 mb-1">
          รายละเอียดเหตุ <span className="text-red-600">*</span>
        </label>
        <textarea
          value={description}
          onChange={(e) => onChange({ emergencyDescription: e.target.value })}
          placeholder="ระบุสิ่งที่เกิดขึ้น ผู้บาดเจ็บ ความเสียหาย ที่ต้องรู้ทันที"
          rows={2}
          className="w-full rounded-sm border border-red-300 bg-white px-3 py-2 text-sm focus:border-red-600 focus:outline-none resize-y"
        />
      </div>
      <div>
        <label className="block text-xs font-semibold text-slate-700 mb-1">
          คำสั่งเพิ่มเติม (ถ้ามี)
        </label>
        <textarea
          value={instructions}
          onChange={(e) => onChange({ intent: e.target.value })}
          placeholder="เช่น ระดมกำลัง คฝ. ๒๐๐ นาย ตั้งแนวกันชน เปิดเส้นทางเลี่ยง..."
          rows={2}
          className="w-full rounded-sm border border-slate-300 bg-white px-3 py-2 text-sm focus:border-red-600 focus:outline-none resize-y"
        />
      </div>
    </div>
  );
}

// ── Emergency Review ───────────────────────────

function EmergencyReview({ state }: { state: WizardState }) {
  return (
    <div className="space-y-4">
      <div>
        <div className="text-[11px] font-semibold uppercase tracking-wider text-red-700 mb-1">
          ตรวจสอบและส่งฉุกเฉิน
        </div>
        <h2 className="text-lg font-semibold text-slate-900">
          ก่อนกดส่ง — ตรวจรายละเอียดอีกครั้ง
        </h2>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        <ReviewRow label="ระดับ" value={PRIORITY_LABELS[state.priority]} />
        <ReviewRow label="ประเภทเหตุ" value={state.emergencyTriggerType} />
        <ReviewRow label="สถานที่" value={state.emergencyLocation || "—"} />
        <ReviewRow
          label="หน่วยรับ"
          value={`${state.targetUnitIds.length} หน่วย (${
            state.cascadeMode === "CASCADE" ? "+กระจาย" : "ตรง"
          })`}
        />
      </div>

      <div className="rounded-sm border border-slate-200 bg-slate-50 p-3">
        <div className="text-[11px] font-semibold uppercase tracking-wider text-slate-600 mb-1">
          รายละเอียดเหตุ
        </div>
        <div className="text-sm text-slate-800 leading-relaxed">
          {state.emergencyDescription || "(ยังไม่ได้ระบุ)"}
        </div>
      </div>

      {state.intent.trim() && (
        <div className="rounded-sm border border-slate-200 bg-slate-50 p-3">
          <div className="text-[11px] font-semibold uppercase tracking-wider text-slate-600 mb-1">
            คำสั่งเพิ่มเติม
          </div>
          <div className="text-sm text-slate-800 leading-relaxed whitespace-pre-wrap">
            {state.intent}
          </div>
        </div>
      )}

      <div className="rounded-sm border-2 border-red-400 bg-red-50 px-3 py-2.5">
        <div className="text-sm font-semibold text-red-900 flex items-center gap-2">
          <Siren className="h-4 w-4 animate-pulse" />
          กดส่งครั้งเดียว — ระบบจะ:
        </div>
        <ul className="text-xs text-red-900 mt-1 pl-6 list-disc space-y-0.5">
          <li>ข้ามขั้นตอนอนุมัติ (Auto-dispatch)</li>
          <li>ส่งคำสั่งถึงหน่วยทันที ผ่าน EMAIL + LINE + SMS + วิทยุสื่อสาร</li>
          <li>เริ่มติดตามใน EOC dashboard แบบ real-time</li>
        </ul>
      </div>
    </div>
  );
}

function ReviewRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-sm border border-slate-200 bg-white px-3 py-2">
      <div className="text-[10px] font-semibold uppercase tracking-wider text-slate-500">
        {label}
      </div>
      <div className="text-sm font-semibold text-slate-900">{value}</div>
    </div>
  );
}

function canProceed(
  step: WizardStep,
  state: WizardState,
  isEmergency: boolean
): boolean {
  if (isEmergency) {
    switch (step) {
      case "TARGETS":
        return (
          state.targetUnitIds.length > 0 &&
          state.emergencyDescription.trim().length > 0
        );
      case "REVIEW":
        return true;
      default:
        return false;
    }
  }
  switch (step) {
    case "INTENT":
      return state.intent.trim().length >= 10;
    case "DRAFT":
      return !!state.draftResult;
    case "TARGETS":
      return state.targetUnitIds.length > 0;
    case "SCHEDULE":
      return !!state.effectiveDate && !!state.dueDate && state.effectiveDate <= state.dueDate;
    case "KPI":
      return state.kpis.length > 0;
    case "REVIEW":
      return true;
    default:
      return false;
  }
}

interface StepperProps {
  currentIdx: number;
  steps: typeof STEPS;
}

function Stepper({ currentIdx, steps }: StepperProps) {
  return (
    <div className="flex items-center gap-0 overflow-x-auto bg-white border border-slate-200 rounded-sm p-3">
      {steps.map((s, idx) => {
        const done = idx < currentIdx;
        const active = idx === currentIdx;
        return (
          <div key={s.key} className="flex items-center shrink-0">
            <div className={`flex items-center gap-2 px-3 py-1.5 rounded-sm ${
              active ? "bg-[#1e3a5f] text-white" : ""
            }`}>
              {done ? (
                <CheckCircle2 className="h-4 w-4 text-emerald-500" />
              ) : (
                <div className={`flex h-5 w-5 items-center justify-center rounded-full text-[11px] font-bold ${
                  active ? "bg-[#d4a017] text-[#1e3a5f]" : "bg-slate-200 text-slate-500"
                }`}>
                  {idx + 1}
                </div>
              )}
              <div className="min-w-0">
                <div className={`text-xs font-semibold leading-tight ${active ? "text-white" : done ? "text-slate-700" : "text-slate-500"}`}>
                  {s.label}
                </div>
                <div className={`text-[10px] leading-tight ${active ? "text-slate-300" : "text-slate-400"}`}>
                  {s.description}
                </div>
              </div>
            </div>
            {idx < steps.length - 1 && (
              <ChevronRight className="h-3.5 w-3.5 text-slate-300 mx-1 shrink-0" />
            )}
          </div>
        );
      })}
    </div>
  );
}
