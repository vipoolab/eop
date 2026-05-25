"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  CheckCircle2,
  Send,
  Loader2,
  Building2,
  Pencil,
  Sparkles,
  AlertCircle,
} from "lucide-react";

interface SubUnitInfo {
  id: string;
  name: string;
  shortName: string;
  commanderTitle?: string;
  province?: string;
  currentStatus: string;
}

interface Props {
  commandId: string;
  myUnitId: string;
  myUnitName: string;
  isAlreadyAcknowledged: boolean;
  subUnits: SubUnitInfo[];
}

interface SubUnitAssignment {
  unitId: string;
  selected: boolean;
  priority: "NORMAL" | "URGENT";
  customDirective: string;
}

export function CascadeForm({
  commandId,
  myUnitId,
  myUnitName,
  isAlreadyAcknowledged,
  subUnits,
}: Props) {
  const router = useRouter();

  // Step state — auto-advance to step 2 if already ACK
  const [step, setStep] = useState<1 | 2>(isAlreadyAcknowledged ? 2 : 1);
  const [acking, setAcking] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const [assignments, setAssignments] = useState<SubUnitAssignment[]>(
    subUnits.map((u) => ({
      unitId: u.id,
      selected: true,
      priority: "NORMAL" as const,
      customDirective: "",
    }))
  );

  function toggleSelect(unitId: string) {
    setAssignments((prev) =>
      prev.map((a) => (a.unitId === unitId ? { ...a, selected: !a.selected } : a))
    );
  }

  function updateAssignment(unitId: string, patch: Partial<SubUnitAssignment>) {
    setAssignments((prev) =>
      prev.map((a) => (a.unitId === unitId ? { ...a, ...patch } : a))
    );
  }

  function selectAll() {
    setAssignments((prev) => prev.map((a) => ({ ...a, selected: true })));
  }
  function selectNone() {
    setAssignments((prev) => prev.map((a) => ({ ...a, selected: false })));
  }
  function selectUrgent() {
    setAssignments((prev) => prev.map((a) => ({ ...a, priority: "URGENT" })));
  }

  async function ack() {
    setAcking(true);
    setError(null);
    try {
      const res = await fetch(`/api/commands/${commandId}/transition`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "acknowledge", unitId: myUnitId }),
      });
      const j = await res.json();
      if (!j.success) {
        setError(j.message ?? "รับทราบไม่สำเร็จ");
        return;
      }
      setStep(2);
    } catch (e) {
      setError(e instanceof Error ? e.message : "เกิดข้อผิดพลาด");
    } finally {
      setAcking(false);
    }
  }

  async function submit() {
    const selected = assignments.filter((a) => a.selected);
    if (selected.length === 0) {
      setError("กรุณาเลือกหน่วยรองอย่างน้อย ๑ หน่วยที่จะมอบหมาย");
      return;
    }
    setSubmitting(true);
    setError(null);
    try {
      const res = await fetch(`/api/commands/${commandId}/cascade`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          parentUnitId: myUnitId,
          assignments: selected.map((a) => ({
            unitId: a.unitId,
            priority: a.priority,
            customDirective: a.customDirective.trim() || undefined,
          })),
        }),
      });
      const j = await res.json();
      if (!j.success) {
        setError(j.message ?? "ส่งต่อไม่สำเร็จ");
        return;
      }
      setSuccess(true);
      // After short delay, go back to detail
      setTimeout(() => {
        router.push(`/commands/${commandId}`);
        router.refresh();
      }, 1500);
    } catch (e) {
      setError(e instanceof Error ? e.message : "เกิดข้อผิดพลาด");
    } finally {
      setSubmitting(false);
    }
  }

  const selectedCount = assignments.filter((a) => a.selected).length;
  const urgentCount = assignments.filter((a) => a.selected && a.priority === "URGENT").length;

  if (success) {
    return (
      <div className="rounded-sm border-2 border-emerald-400 bg-emerald-50 dark:bg-emerald-900/20 p-6 text-center">
        <CheckCircle2 className="h-12 w-12 text-emerald-600 mx-auto mb-2" />
        <div className="text-base font-bold text-emerald-900 dark:text-emerald-200 mb-1">
          มอบหมายเรียบร้อย!
        </div>
        <div className="text-sm text-emerald-800 dark:text-emerald-300">
          ส่งคำสั่งไปยัง {selectedCount} หน่วยรองสำเร็จ — กำลังกลับไปหน้ารายละเอียดคำสั่ง...
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* STEP 1: Acknowledge */}
      <div
        className={`rounded-sm border ${
          step >= 1
            ? "border-emerald-300 bg-emerald-50 dark:bg-emerald-900/20"
            : "border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900"
        } p-4`}
      >
        <div className="flex items-center gap-2 mb-2">
          <div
            className={`h-7 w-7 rounded-sm flex items-center justify-center shrink-0 ${
              isAlreadyAcknowledged
                ? "bg-emerald-600 text-white"
                : step === 1
                  ? "bg-[#1e3a5f] text-white animate-pulse"
                  : "bg-slate-300 text-slate-600"
            }`}
          >
            {isAlreadyAcknowledged ? (
              <CheckCircle2 className="h-4 w-4" />
            ) : (
              <span className="text-xs font-bold">๑</span>
            )}
          </div>
          <div className="flex-1">
            <div className="text-sm font-bold text-slate-900 dark:text-slate-100">
              รับทราบหนังสือสั่งการ
            </div>
            <div className="text-[11px] text-slate-600 dark:text-slate-400">
              ในนาม {myUnitName} ยืนยันการรับทราบและพร้อมมอบหมายต่อ
            </div>
          </div>
        </div>
        {!isAlreadyAcknowledged && (
          <div className="flex justify-end">
            <button
              type="button"
              suppressHydrationWarning
              onClick={ack}
              disabled={acking}
              className="inline-flex items-center gap-1.5 rounded-sm bg-emerald-600 hover:bg-emerald-700 disabled:bg-slate-300 text-white text-sm font-medium px-4 py-2"
            >
              {acking ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle2 className="h-4 w-4" />}
              {acking ? "กำลังรับทราบ..." : "รับทราบและไปขั้นถัดไป"}
            </button>
          </div>
        )}
      </div>

      {/* STEP 2: Cascade to sub-units */}
      <div
        className={`rounded-sm border ${
          step >= 2
            ? "border-blue-300 bg-blue-50/30 dark:bg-blue-900/10"
            : "border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 opacity-60"
        } p-4`}
      >
        <div className="flex items-center gap-2 mb-3">
          <div
            className={`h-7 w-7 rounded-sm flex items-center justify-center shrink-0 ${
              step >= 2 ? "bg-blue-600 text-white" : "bg-slate-300 text-slate-600"
            }`}
          >
            <span className="text-xs font-bold">๒</span>
          </div>
          <div className="flex-1">
            <div className="text-sm font-bold text-slate-900 dark:text-slate-100">
              มอบหมายหน่วยรอง ({subUnits.length} หน่วยในสังกัด)
            </div>
            <div className="text-[11px] text-slate-600 dark:text-slate-400">
              เลือกหน่วยที่จะมอบหมาย + กำหนดความเร่งด่วน + เพิ่มข้อสั่งการเฉพาะ
            </div>
          </div>
        </div>

        {step >= 2 && (
          <>
            {/* Quick actions */}
            <div className="flex items-center gap-2 mb-3 text-xs">
              <button
                type="button"
                suppressHydrationWarning
                onClick={selectAll}
                className="rounded-sm border border-slate-300 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 px-2.5 py-1"
              >
                เลือกทั้งหมด
              </button>
              <button
                type="button"
                suppressHydrationWarning
                onClick={selectNone}
                className="rounded-sm border border-slate-300 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 px-2.5 py-1"
              >
                ล้างการเลือก
              </button>
              <button
                type="button"
                suppressHydrationWarning
                onClick={selectUrgent}
                className="rounded-sm border border-amber-300 hover:bg-amber-50 dark:hover:bg-amber-900/20 text-amber-700 dark:text-amber-400 px-2.5 py-1 font-semibold"
              >
                ⚡ ตั้งทั้งหมดเป็นด่วน
              </button>
              <span className="ml-auto text-[11px] text-slate-500">
                เลือก {selectedCount}/{subUnits.length} · ด่วน {urgentCount}
              </span>
            </div>

            {/* Sub-unit list */}
            <div className="space-y-2 max-h-96 overflow-y-auto">
              {subUnits.map((u) => {
                const a = assignments.find((x) => x.unitId === u.id)!;
                return (
                  <div
                    key={u.id}
                    className={`rounded-sm border p-3 transition-colors ${
                      a.selected
                        ? "border-blue-300 bg-white dark:bg-slate-900"
                        : "border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/30 opacity-60"
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      <input
                        type="checkbox"
                        checked={a.selected}
                        onChange={() => toggleSelect(u.id)}
                        className="mt-1 h-4 w-4 rounded-sm accent-[#1e3a5f]"
                      />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <Building2 className="h-3.5 w-3.5 text-slate-400 shrink-0" />
                          <span className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                            {u.shortName}
                          </span>
                          <span className="text-xs text-slate-500">
                            {u.name}
                          </span>
                          {u.currentStatus !== "PENDING" && (
                            <span className="text-[10px] bg-emerald-100 text-emerald-800 px-1.5 py-0.5 rounded-sm">
                              {u.currentStatus}
                            </span>
                          )}
                        </div>
                        {a.selected && (
                          <div className="mt-2.5 space-y-2">
                            {/* Priority */}
                            <div className="flex items-center gap-2 text-xs">
                              <span className="text-slate-600 dark:text-slate-400">ความเร่งด่วน:</span>
                              <div className="inline-flex rounded-sm border border-slate-300 dark:border-slate-700 p-0.5">
                                <button
                                  type="button"
                                  suppressHydrationWarning
                                  onClick={() => updateAssignment(u.id, { priority: "NORMAL" })}
                                  className={`px-2 py-0.5 rounded-sm text-xs font-medium ${
                                    a.priority === "NORMAL"
                                      ? "bg-slate-600 text-white"
                                      : "text-slate-600 dark:text-slate-300"
                                  }`}
                                >
                                  ปกติ
                                </button>
                                <button
                                  type="button"
                                  suppressHydrationWarning
                                  onClick={() => updateAssignment(u.id, { priority: "URGENT" })}
                                  className={`px-2 py-0.5 rounded-sm text-xs font-medium ${
                                    a.priority === "URGENT"
                                      ? "bg-amber-600 text-white"
                                      : "text-slate-600 dark:text-slate-300"
                                  }`}
                                >
                                  ⚡ ด่วน
                                </button>
                              </div>
                            </div>

                            {/* Custom directive */}
                            <div>
                              <label className="text-[10px] font-semibold uppercase tracking-wider text-slate-500 flex items-center gap-1 mb-1">
                                <Pencil className="h-2.5 w-2.5" />
                                ข้อสั่งการเฉพาะหน่วยนี้ (optional)
                              </label>
                              <textarea
                                value={a.customDirective}
                                onChange={(e) =>
                                  updateAssignment(u.id, { customDirective: e.target.value })
                                }
                                placeholder={`เช่น: ${u.shortName} เน้นพื้นที่... รายงานก่อน...`}
                                rows={2}
                                className="w-full rounded-sm border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950 px-2 py-1.5 text-xs focus:border-[#1e3a5f] focus:outline-none resize-y"
                              />
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </>
        )}
      </div>

      {error && (
        <div className="rounded-sm border border-red-300 bg-red-50 p-3 text-sm text-red-800 flex items-start gap-2">
          <AlertCircle className="h-4 w-4 mt-0.5 shrink-0" />
          {error}
        </div>
      )}

      {/* Submit */}
      {step === 2 && (
        <div className="flex items-center gap-3 pt-2">
          <div className="text-[11px] text-slate-600 dark:text-slate-400 flex-1">
            ส่งคำสั่งไปยัง <strong>{selectedCount}</strong> หน่วย
            {urgentCount > 0 && (
              <span className="text-amber-700 dark:text-amber-400">
                {" "}
                ({urgentCount} หน่วยด่วน)
              </span>
            )}
          </div>
          <button
            type="button"
            suppressHydrationWarning
            onClick={submit}
            disabled={submitting || selectedCount === 0}
            className="inline-flex items-center gap-1.5 rounded-sm bg-[#1e3a5f] hover:bg-[#142a45] disabled:bg-slate-300 text-white text-sm font-bold px-5 py-2"
          >
            {submitting ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Send className="h-4 w-4" />
            )}
            {submitting ? "กำลังส่ง..." : `ส่งต่อให้ ${selectedCount} หน่วยรอง`}
            {!submitting && <Sparkles className="h-3 w-3" />}
          </button>
        </div>
      )}
    </div>
  );
}
