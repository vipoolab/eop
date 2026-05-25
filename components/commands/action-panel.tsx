"use client";

// Action panel — shows contextual actions based on
//   (current persona × command status × per-unit status)

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  CheckCircle2,
  Send,
  X,
  PlayCircle,
  FileCheck,
  ClipboardCheck,
  Lock,
  Sparkles,
  AlertCircle,
} from "lucide-react";
import type { Command } from "@/lib/commands/types";
import type { Persona } from "@/lib/police-org/types";
import { UNIT_STATUS_LABELS } from "@/lib/commands/types";

interface Props {
  command: Command;
  persona: Persona;
  /** Are we showing the "approver" view (highlight approve/reject)? */
  isApprover: boolean;
  /** Is this persona the drafter (highlight submit)? */
  isDrafter: boolean;
  /** Per-unit progress matching this persona's unit (if any) */
  unitProgress: { status: string } | null;
  /** Available command-level actions (computed server-side via workflow.ts) */
  commandActions: string[];
  /** Available unit-level actions */
  unitActions: string[];
}

export function ActionPanel({
  command,
  persona,
  isApprover,
  isDrafter,
  unitProgress,
  commandActions,
  unitActions,
}: Props) {
  const router = useRouter();
  const [working, setWorking] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showApprovalModal, setShowApprovalModal] = useState(false);
  const [showReportModal, setShowReportModal] = useState(false);
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [rejectReason, setRejectReason] = useState("");

  async function callTransition(action: string, note?: string) {
    setWorking(true);
    setError(null);
    try {
      const res = await fetch(`/api/commands/${command.id}/transition`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ action, note }),
      });
      const j = await res.json();
      if (!j.success) {
        setError(j.message);
        return false;
      }
      router.refresh();
      return true;
    } catch (e) {
      setError((e as Error).message);
      return false;
    } finally {
      setWorking(false);
    }
  }

  async function callUnitTransition(action: string) {
    setWorking(true);
    setError(null);
    try {
      const res = await fetch(
        `/api/commands/${command.id}/units/${persona.unitId}/transition`,
        {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ action }),
        }
      );
      const j = await res.json();
      if (!j.success) {
        setError(j.message);
        return;
      }
      router.refresh();
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setWorking(false);
    }
  }

  // Decide which panel to show — only show if there's at least one action
  const hasCommandActions = commandActions.length > 0;
  const hasUnitActions = unitActions.length > 0;
  if (!hasCommandActions && !hasUnitActions) {
    return (
      <div className="rounded-sm border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 p-4 text-center text-sm text-slate-500 dark:text-slate-400">
        <Lock className="h-4 w-4 inline mr-1.5" />
        ไม่มีคำสั่งที่ทำได้สำหรับ persona ปัจจุบันในสถานะนี้
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {error && (
        <div className="rounded-sm border border-red-300 bg-red-50 p-3 flex items-center gap-2 text-sm text-red-900">
          <AlertCircle className="h-4 w-4 shrink-0" />
          {error}
        </div>
      )}

      {/* Unit-level actions card */}
      {hasUnitActions && (
        <div className="rounded-sm border-2 border-blue-300 dark:border-blue-700 bg-blue-50 dark:bg-blue-900/20 p-4">
          <div className="flex items-center gap-2 mb-3">
            <ClipboardCheck className="h-4 w-4 text-blue-700 dark:text-blue-300" />
            <div className="text-xs font-semibold uppercase tracking-wide text-blue-900 dark:text-blue-200">
              คำสั่งสำหรับหน่วยของคุณ
            </div>
          </div>
          {unitProgress && (
            <div className="text-xs text-blue-800 dark:text-blue-300 mb-3">
              สถานะปัจจุบัน:{" "}
              <span className="font-semibold">
                {UNIT_STATUS_LABELS[unitProgress.status as keyof typeof UNIT_STATUS_LABELS]}
              </span>
            </div>
          )}
          <div className="flex flex-wrap gap-2">
            {unitActions.includes("acknowledge") && (
              <button
                type="button"
                suppressHydrationWarning
                onClick={() => callUnitTransition("acknowledge")}
                disabled={working}
                className="inline-flex items-center gap-1.5 rounded-sm bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium px-4 py-2 disabled:opacity-40"
              >
                <CheckCircle2 className="h-4 w-4" />
                รับทราบคำสั่ง
              </button>
            )}
            {unitActions.includes("start") && (
              <button
                type="button"
                suppressHydrationWarning
                onClick={() => callUnitTransition("start")}
                disabled={working}
                className="inline-flex items-center gap-1.5 rounded-sm bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-medium px-4 py-2 disabled:opacity-40"
              >
                <PlayCircle className="h-4 w-4" />
                เริ่มปฏิบัติ
              </button>
            )}
            {unitActions.includes("report") && (
              <button
                type="button"
                suppressHydrationWarning
                onClick={() => setShowReportModal(true)}
                disabled={working}
                className="inline-flex items-center gap-1.5 rounded-sm bg-[#b8860b] hover:bg-[#92400e] text-white text-sm font-medium px-4 py-2 disabled:opacity-40"
              >
                <FileCheck className="h-4 w-4" />
                ส่งผลรายงาน
              </button>
            )}
          </div>
        </div>
      )}

      {/* Command-level actions card */}
      {hasCommandActions && (
        <div
          className={`rounded-sm border-2 p-4 ${
            isApprover
              ? "border-amber-300 dark:border-amber-700 bg-amber-50 dark:bg-amber-900/20"
              : "border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900"
          }`}
        >
          <div className="flex items-center justify-between gap-2 mb-3">
            <div className="flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-[#b8860b]" />
              <div className="text-xs font-semibold uppercase tracking-wide text-slate-700 dark:text-slate-200">
                {isApprover
                  ? "คำสั่งนี้รออนุมัติ — ในฐานะผู้บังคับบัญชา"
                  : isDrafter
                  ? "คำสั่งของคุณ"
                  : "การจัดการคำสั่ง"}
              </div>
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            {commandActions.includes("submit") && (
              <button
                type="button"
                suppressHydrationWarning
                onClick={() => callTransition("submit")}
                disabled={working}
                className="inline-flex items-center gap-1.5 rounded-sm bg-[#b8860b] hover:bg-[#92400e] text-white text-sm font-medium px-4 py-2 disabled:opacity-40"
              >
                <Send className="h-4 w-4" />
                เสนอเพื่อขออนุมัติ
              </button>
            )}
            {commandActions.includes("approve") && (
              <button
                type="button"
                suppressHydrationWarning
                onClick={() => setShowApprovalModal(true)}
                disabled={working}
                className="inline-flex items-center gap-1.5 rounded-sm bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-medium px-4 py-2 disabled:opacity-40"
              >
                <CheckCircle2 className="h-4 w-4" />
                อนุมัติด้วยลายเซ็น
              </button>
            )}
            {commandActions.includes("reject") && (
              <button
                type="button"
                suppressHydrationWarning
                onClick={() => setShowRejectModal(true)}
                disabled={working}
                className="inline-flex items-center gap-1.5 rounded-sm border border-red-300 hover:bg-red-50 text-red-900 dark:text-red-300 dark:border-red-700 dark:hover:bg-red-900/30 text-sm font-medium px-4 py-2 disabled:opacity-40"
              >
                <X className="h-4 w-4" />
                ตีกลับเพื่อแก้ไข
              </button>
            )}
            {commandActions.includes("dispatch") && (
              <button
                type="button"
                suppressHydrationWarning
                onClick={() => callTransition("dispatch")}
                disabled={working}
                className="inline-flex items-center gap-1.5 rounded-sm bg-[#1e3a5f] hover:bg-[#142a45] text-white text-sm font-medium px-4 py-2 disabled:opacity-40"
              >
                <Send className="h-4 w-4" />
                เผยแพร่คำสั่ง
              </button>
            )}
            {commandActions.includes("close") && (
              <button
                type="button"
                suppressHydrationWarning
                onClick={() => {
                  if (confirm("ยืนยันปิดงาน? — หน่วยที่ยังไม่ส่งผลจะถูกปิดตามไปด้วย")) {
                    callTransition("close");
                  }
                }}
                disabled={working}
                className="inline-flex items-center gap-1.5 rounded-sm bg-slate-700 hover:bg-slate-800 text-white text-sm font-medium px-4 py-2 disabled:opacity-40"
              >
                <Lock className="h-4 w-4" />
                ปิดงาน
              </button>
            )}
            {commandActions.includes("revoke") && (
              <button
                type="button"
                suppressHydrationWarning
                onClick={() => {
                  if (confirm("ยืนยันยกเลิกร่างนี้?")) callTransition("revoke");
                }}
                disabled={working}
                className="inline-flex items-center gap-1.5 rounded-sm border border-slate-300 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 text-sm font-medium px-4 py-2 disabled:opacity-40"
              >
                <X className="h-4 w-4" />
                ยกเลิกร่าง
              </button>
            )}
          </div>
        </div>
      )}

      {/* Approval modal — signature application */}
      {showApprovalModal && (
        <ApprovalModal
          persona={persona}
          onCancel={() => setShowApprovalModal(false)}
          onConfirm={async () => {
            const ok = await callTransition("approve");
            if (ok) setShowApprovalModal(false);
          }}
          working={working}
        />
      )}

      {/* Reject modal — require reason */}
      {showRejectModal && (
        <RejectModal
          reason={rejectReason}
          onChange={setRejectReason}
          onCancel={() => setShowRejectModal(false)}
          onConfirm={async () => {
            if (!rejectReason.trim()) {
              setError("ต้องระบุเหตุผลการตีกลับ");
              return;
            }
            const ok = await callTransition("reject", rejectReason);
            if (ok) {
              setShowRejectModal(false);
              setRejectReason("");
            }
          }}
          working={working}
        />
      )}

      {/* Report modal — KPI report submission */}
      {showReportModal && (
        <ReportModal
          command={command}
          unitId={persona.unitId}
          onCancel={() => setShowReportModal(false)}
          onSuccess={() => {
            setShowReportModal(false);
            router.refresh();
          }}
        />
      )}
    </div>
  );
}

// ── Sub-components ────────────────────────────

interface ApprovalModalProps {
  persona: Persona;
  onCancel: () => void;
  onConfirm: () => void;
  working: boolean;
}

function ApprovalModal({ persona, onCancel, onConfirm, working }: ApprovalModalProps) {
  return (
    <Modal title="ลงนามอนุมัติด้วยลายเซ็นดิจิทัล" onClose={onCancel}>
      <div className="space-y-4">
        <div className="rounded-sm border border-amber-300 bg-amber-50 dark:bg-amber-900/20 p-3 text-sm text-amber-900 dark:text-amber-200">
          เมื่อกด <strong>ยืนยัน</strong> ระบบจะนำลายเซ็นดิจิทัลของท่านที่เก็บไว้
          มาประทับลงในหนังสือสั่งการ และ <strong>เผยแพร่ทันที</strong> ไปยังทุกหน่วยรับ
        </div>
        <div className="bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-sm p-4">
          <div className="text-xs text-slate-500 dark:text-slate-400 mb-1">
            ลายเซ็นดิจิทัล
          </div>
          <div className="font-[var(--font-thai)] italic text-lg text-slate-900 dark:text-slate-100">
            {persona.digitalSignature ?? "(ไม่มีลายเซ็นในระบบ)"}
          </div>
          <div className="text-xs text-slate-600 dark:text-slate-400 mt-1">
            {persona.rank} {persona.name.split(" ").slice(1).join(" ")} · {persona.role}
          </div>
        </div>
        <div className="flex justify-end gap-2 pt-2">
          <button
            type="button"
            onClick={onCancel}
            disabled={working}
            className="text-sm rounded-sm border border-slate-300 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 px-4 py-2"
          >
            ยกเลิก
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={working || !persona.digitalSignature}
            className="inline-flex items-center gap-1.5 rounded-sm bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-medium px-4 py-2 disabled:opacity-40"
          >
            <CheckCircle2 className="h-4 w-4" />
            ยืนยันลงนามและเผยแพร่
          </button>
        </div>
      </div>
    </Modal>
  );
}

interface RejectModalProps {
  reason: string;
  onChange: (v: string) => void;
  onCancel: () => void;
  onConfirm: () => void;
  working: boolean;
}

function RejectModal({ reason, onChange, onCancel, onConfirm, working }: RejectModalProps) {
  return (
    <Modal title="ตีกลับเพื่อให้ผู้ร่างแก้ไข" onClose={onCancel}>
      <div className="space-y-3">
        <textarea
          value={reason}
          onChange={(e) => onChange(e.target.value)}
          rows={4}
          placeholder="ระบุเหตุผลการตีกลับ — เช่น ปรับเป้าหมายให้ชัดขึ้น เพิ่ม KPI..."
          className="w-full rounded-sm border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2 text-sm focus:border-[#1e3a5f] focus:outline-none"
        />
        <div className="flex justify-end gap-2">
          <button
            type="button"
            onClick={onCancel}
            disabled={working}
            className="text-sm rounded-sm border border-slate-300 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 px-4 py-2"
          >
            ยกเลิก
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={working}
            className="inline-flex items-center gap-1.5 rounded-sm bg-red-600 hover:bg-red-700 text-white text-sm font-medium px-4 py-2 disabled:opacity-40"
          >
            <X className="h-4 w-4" />
            ตีกลับ
          </button>
        </div>
      </div>
    </Modal>
  );
}

interface ReportModalProps {
  command: Command;
  unitId: string;
  onCancel: () => void;
  onSuccess: () => void;
}

function ReportModal({ command, unitId, onCancel, onSuccess }: ReportModalProps) {
  const [working, setWorking] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notes, setNotes] = useState("");
  const [values, setValues] = useState<Record<string, number>>({});

  const kpisForUnit = command.assignments
    .filter((a) => a.unitId === unitId)
    .map((a) => {
      const kpi = command.kpis.find((k) => k.id === a.kpiId);
      return { assignment: a, kpi };
    })
    .filter((x) => x.kpi);

  async function submit() {
    setWorking(true);
    setError(null);
    try {
      const kpiValues = kpisForUnit
        .filter((x) => values[x.kpi!.id] !== undefined)
        .map((x) => ({
          kpiId: x.kpi!.id,
          value: values[x.kpi!.id] ?? 0,
        }));
      if (kpiValues.length === 0) {
        setError("กรุณากรอกค่า KPI อย่างน้อย ๑ ตัว");
        setWorking(false);
        return;
      }
      const res = await fetch(
        `/api/commands/${command.id}/units/${unitId}/report`,
        {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ notes, kpiValues }),
        }
      );
      const j = await res.json();
      if (!j.success) {
        setError(j.message);
        return;
      }
      onSuccess();
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setWorking(false);
    }
  }

  return (
    <Modal title="ส่งรายงานผลการปฏิบัติ" onClose={onCancel}>
      <div className="space-y-4">
        <div className="text-xs text-slate-600 dark:text-slate-400">
          กรอกค่า KPI ของรอบนี้ — สามารถส่งซ้ำเพื่อสะสมยอดในระยะยาว
        </div>

        <div className="space-y-2">
          {kpisForUnit.map(({ assignment, kpi }) => (
            <div
              key={kpi!.id}
              className="rounded-sm border border-slate-200 dark:border-slate-700 p-3"
            >
              <div className="flex items-center justify-between gap-2 mb-1">
                <div className="text-sm font-medium text-slate-900 dark:text-slate-100">
                  {kpi!.metric}
                </div>
                {kpi!.type === "QUANTITATIVE" && (
                  <div className="text-xs text-slate-500">
                    เป้าของหน่วยนี้ {assignment.targetShare ?? "—"} {kpi!.unit ?? ""}
                  </div>
                )}
              </div>
              {kpi!.type === "QUANTITATIVE" ? (
                <input
                  type="number"
                  value={values[kpi!.id] ?? ""}
                  onChange={(e) =>
                    setValues((p) => ({ ...p, [kpi!.id]: Number(e.target.value) }))
                  }
                  placeholder={`ค่าที่ทำได้ (${kpi!.unit ?? ""})`}
                  className="w-full rounded-sm border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 px-2.5 py-1.5 text-sm focus:border-[#1e3a5f] focus:outline-none"
                />
              ) : (
                <input
                  type="number"
                  min={0}
                  max={1}
                  value={values[kpi!.id] ?? ""}
                  onChange={(e) =>
                    setValues((p) => ({ ...p, [kpi!.id]: Number(e.target.value) }))
                  }
                  placeholder="1 = ส่งรายงานแล้ว"
                  className="w-full rounded-sm border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 px-2.5 py-1.5 text-sm focus:border-[#1e3a5f] focus:outline-none"
                />
              )}
            </div>
          ))}
        </div>

        <div>
          <label className="text-xs text-slate-600 dark:text-slate-400 mb-1 block">
            หมายเหตุ (optional)
          </label>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            rows={3}
            className="w-full rounded-sm border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2 text-sm focus:border-[#1e3a5f] focus:outline-none"
          />
        </div>

        {error && (
          <div className="rounded-sm border border-red-300 bg-red-50 p-2 text-sm text-red-900">
            {error}
          </div>
        )}

        <div className="flex justify-end gap-2">
          <button
            type="button"
            onClick={onCancel}
            disabled={working}
            className="text-sm rounded-sm border border-slate-300 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 px-4 py-2"
          >
            ยกเลิก
          </button>
          <button
            type="button"
            onClick={submit}
            disabled={working}
            className="inline-flex items-center gap-1.5 rounded-sm bg-[#b8860b] hover:bg-[#92400e] text-white text-sm font-medium px-4 py-2 disabled:opacity-40"
          >
            <FileCheck className="h-4 w-4" />
            ส่งรายงาน
          </button>
        </div>
      </div>
    </Modal>
  );
}

// Reusable modal
function Modal({
  title,
  children,
  onClose,
}: {
  title: string;
  children: React.ReactNode;
  onClose: () => void;
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60" onClick={onClose} />
      <div className="relative bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-sm shadow-2xl max-w-lg w-full max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between gap-2 px-5 py-3 border-b border-slate-100 dark:border-slate-800">
          <h3 className="text-base font-semibold text-slate-900 dark:text-slate-100">
            {title}
          </h3>
          <button
            type="button"
            onClick={onClose}
            className="p-1 rounded-sm hover:bg-slate-100 dark:hover:bg-slate-800"
          >
            <X className="h-4 w-4 text-slate-500" />
          </button>
        </div>
        <div className="p-5">{children}</div>
      </div>
    </div>
  );
}
