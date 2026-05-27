// /commands/[id] — command detail with workflow + tracking

import Link from "next/link";
import { notFound } from "next/navigation";
import {
  ArrowLeft,
  FileText,
  Calendar,
  Target,
  Building2,
  Sparkles,
  Library,
  BookOpen,
  ClipboardList,
  Clock,
  History,
  TrendingUp,
} from "lucide-react";
import { PageHeader } from "@/components/page-header";
import { CommandLetterDocument } from "@/components/commands/command-letter-document";
import { DownloadDocxButton } from "@/components/commands/download-docx-button";
import { StatusTimeline } from "@/components/commands/status-timeline";
import { ActionPanel } from "@/components/commands/action-panel";
import { UnitProgressTable } from "@/components/commands/unit-progress-table";
import {
  EmergencyBanner,
  PriorityBadge,
} from "@/components/commands/emergency-banner";
import { NotificationTimeline } from "@/components/commands/notification-timeline";
import { EscalationLogSection } from "@/components/commands/escalation-log";
import { getCommand } from "@/lib/commands/store";
import { getActivePersona } from "@/lib/police-org/store";
import {
  availableCommandActions,
  availableUnitActions,
  isApproverOfCommand,
  isDrafterOfCommand,
  isTargetUnitHead,
  computeTrackingStats,
} from "@/lib/commands/workflow";
import {
  getDocument,
  getItemsForDocument,
} from "@/lib/strategic/store";
import type { CommandStatus } from "@/lib/commands/types";
import { STATUS_LABELS } from "@/lib/commands/types";

export const dynamic = "force-dynamic";

const STATUS_STYLES: Record<CommandStatus, string> = {
  DRAFT: "bg-slate-100 text-slate-700 border-slate-300 dark:bg-slate-800 dark:text-slate-200 dark:border-slate-700",
  SUBMITTED: "bg-amber-50 text-amber-800 border-amber-300 dark:bg-amber-900/30 dark:text-amber-300 dark:border-amber-700",
  APPROVED: "bg-emerald-50 text-emerald-800 border-emerald-300 dark:bg-emerald-900/30 dark:text-emerald-300 dark:border-emerald-700",
  DISPATCHED: "bg-blue-50 text-blue-800 border-blue-300 dark:bg-blue-900/30 dark:text-blue-300 dark:border-blue-700",
  IN_PROGRESS: "bg-amber-50 text-amber-800 border-amber-300 dark:bg-amber-900/30 dark:text-amber-300 dark:border-amber-700",
  REPORTED: "bg-emerald-50 text-emerald-800 border-emerald-300 dark:bg-emerald-900/30 dark:text-emerald-300 dark:border-emerald-700",
  CLOSED: "bg-slate-50 text-slate-600 border-slate-300 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700",
  REJECTED: "bg-red-50 text-red-800 border-red-300 dark:bg-red-900/30 dark:text-red-300 dark:border-red-700",
};

export default async function CommandDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const cmd = getCommand(id);
  if (!cmd) notFound();

  const persona = getActivePersona();
  const ctx = { command: cmd, persona };
  const isDrafter = isDrafterOfCommand(ctx);
  const isApprover = isApproverOfCommand(ctx);
  const myUnit = isTargetUnitHead(ctx);
  const cmdActions = availableCommandActions(ctx);
  const unitActions = availableUnitActions(ctx);
  const trackingStats = computeTrackingStats(cmd);

  const planItems = resolvePlanItems(cmd.alignment);

  return (
    <div className="space-y-5">
      <Link
        href="/commands"
        className="inline-flex items-center gap-1 text-sm text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100"
      >
        <ArrowLeft className="h-4 w-4" />
        กลับ รายการคำสั่ง
      </Link>

      <PageHeader
        icon={FileText}
        eyebrow={`คำสั่ง · ${STATUS_LABELS[cmd.status]}`}
        title={cmd.letter.subject}
        description={`เลขที่: ${cmd.letter.docNumber ?? "—"} · ออกโดย ${cmd.createdByTitle} ${cmd.createdByName.split(" ").slice(1).join(" ")}`}
        actions={
          <div className="flex items-center gap-2">
            <PriorityBadge priority={cmd.priority} />
            <span
              className={`text-xs font-semibold uppercase tracking-wider px-3 py-1.5 rounded-sm border ${STATUS_STYLES[cmd.status]}`}
            >
              {STATUS_LABELS[cmd.status]}
            </span>
          </div>
        }
      />

      {/* Emergency banner */}
      <EmergencyBanner command={cmd} />

      {/* Status timeline */}
      <StatusTimeline currentStatus={cmd.status} />

      {/* Action panel — context-aware */}
      <ActionPanel
        command={cmd}
        persona={persona}
        isApprover={isApprover}
        isDrafter={isDrafter}
        unitProgress={myUnit ? { status: myUnit.status } : null}
        commandActions={cmdActions}
        unitActions={unitActions}
      />

      {/* Top metrics */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        <Metric
          icon={Calendar}
          label="เริ่ม"
          value={new Date(cmd.effectiveDate).toLocaleDateString("th-TH")}
        />
        <Metric
          icon={Clock}
          label="ครบกำหนด"
          value={new Date(cmd.dueDate).toLocaleDateString("th-TH")}
        />
        <Metric
          icon={Building2}
          label="หน่วยรับ"
          value={`${cmd.targetUnitIds.length} (ผล ${cmd.effectiveUnitIds.length})`}
        />
        <Metric
          icon={TrendingUp}
          label="รับทราบแล้ว"
          value={`${trackingStats.ackPercent}%`}
          sub={`${trackingStats.total - trackingStats.pending}/${trackingStats.total} หน่วย`}
        />
        <Metric
          icon={Target}
          label="ส่งผลแล้ว"
          value={`${trackingStats.reportPercent}%`}
          sub={`${trackingStats.reported}/${trackingStats.total} หน่วย`}
        />
      </div>

      {/* 2-column layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Letter */}
        <section className="lg:col-span-2 bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-sm p-5">
          <div className="flex items-center justify-between gap-3 mb-3 text-xs text-slate-500 dark:text-slate-400">
            <span className="flex items-center gap-1.5">
              <FileText className="h-3.5 w-3.5" />
              หนังสือสั่งการ
            </span>
            <DownloadDocxButton
              letter={cmd.letter}
              signedDate={cmd.letter.signedAtDate ?? cmd.createdAt}
            />
          </div>
          <CommandLetterDocument
            letter={cmd.letter}
            signedDate={cmd.letter.signedAtDate ?? cmd.createdAt}
            mode={cmd.letter.signatureApplied ? "final" : "draft"}
          />
        </section>

        {/* Sidebar */}
        <div className="space-y-4">
          {/* Alignments */}
          <section className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-sm p-4">
            <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-slate-700 dark:text-slate-200 mb-3">
              <Sparkles className="h-3 w-3 text-[#b8860b]" />
              จับคู่กับแผน
            </div>
            <div className="space-y-3">
              <AlignmentGroup
                icon={Library}
                level="ระดับ ๑ ยุทธศาสตร์ชาติ"
                items={planItems.l1}
                accent="navy"
              />
              <AlignmentGroup
                icon={BookOpen}
                level="ระดับ ๒ แผนแม่บท"
                items={planItems.l2}
                accent="gold"
              />
              <AlignmentGroup
                icon={ClipboardList}
                level="ระดับ ๓ แผนปฏิบัติราชการ"
                items={planItems.l3}
                accent="slate"
              />
            </div>
            {cmd.alignment.explanation && (
              <div className="mt-3 pt-3 border-t border-slate-100 dark:border-slate-800 text-xs text-slate-600 dark:text-slate-400 leading-relaxed italic">
                "{cmd.alignment.explanation}"
              </div>
            )}
          </section>

          {/* Intent */}
          <section className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-sm p-4">
            <div className="text-xs font-semibold uppercase tracking-wide text-slate-700 dark:text-slate-200 mb-2">
              เจตนาต้นฉบับ
            </div>
            <p className="text-sm text-slate-700 dark:text-slate-300 leading-relaxed italic">
              "{cmd.userIntent}"
            </p>
          </section>

          {/* Status log */}
          <section className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-sm p-4">
            <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-slate-700 dark:text-slate-200 mb-2">
              <History className="h-3 w-3" />
              ประวัติสถานะ
            </div>
            <div className="space-y-1.5">
              {(cmd.statusLog ?? []).slice().reverse().slice(0, 5).map((log, idx) => (
                <div key={idx} className="text-[11px] flex items-start gap-2">
                  <span className="text-slate-400 dark:text-slate-500 shrink-0 mt-0.5 font-mono">
                    {new Date(log.timestamp).toLocaleString("th-TH", {
                      day: "2-digit",
                      month: "short",
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </span>
                  <div>
                    <div className="text-slate-700 dark:text-slate-300">
                      <strong>{STATUS_LABELS[log.toStatus]}</strong>
                    </div>
                    <div className="text-slate-500 dark:text-slate-500">
                      {log.byName !== "ระบบ" && log.byName.split(" ").slice(1).join(" ")} · {log.byTitle}
                    </div>
                    {log.note && (
                      <div className="text-slate-500 dark:text-slate-400 italic">
                        "{log.note.slice(0, 100)}"
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </section>
        </div>
      </div>

      {/* Unit progress — only show after dispatch */}
      {(cmd.status === "DISPATCHED" ||
        cmd.status === "IN_PROGRESS" ||
        cmd.status === "REPORTED" ||
        cmd.status === "CLOSED") && (
        <UnitProgressTable command={cmd} preview={10} showTrackLink />
      )}

      {/* Escalation log */}
      <EscalationLogSection command={cmd} />

      {/* Notification timeline — visible when there are notifications */}
      {(cmd.notifications ?? []).length > 0 && (
        <NotificationTimeline command={cmd} />
      )}

      {/* KPIs summary */}
      <section className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-sm p-4">
        <div className="flex items-center gap-2 text-sm font-semibold text-slate-700 dark:text-slate-200 mb-3">
          <Target className="h-4 w-4" />
          ตัวชี้วัด ({cmd.kpis.length})
        </div>
        <div className="space-y-2">
          {cmd.kpis.map((k) => {
            const assignments = cmd.assignments.filter((a) => a.kpiId === k.id);
            const totalAchieved = assignments.reduce((s, a) => s + (a.currentValue ?? 0), 0);
            const reportingCount = assignments.filter((a) => (a.currentValue ?? 0) > 0).length;
            const percent = k.targetTotal
              ? Math.min(100, Math.round((totalAchieved / k.targetTotal) * 100))
              : null;
            return (
              <div
                key={k.id}
                className="rounded-sm border border-slate-200 dark:border-slate-700 p-3"
              >
                <div className="flex items-center justify-between gap-2 mb-1.5">
                  <div className="flex items-center gap-2">
                    <span
                      className={`text-[10px] font-semibold uppercase px-1.5 py-0.5 rounded-sm ${
                        k.type === "QUANTITATIVE"
                          ? "bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-300"
                          : "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-300"
                      }`}
                    >
                      {k.type === "QUANTITATIVE" ? "เชิงปริมาณ" : "เชิงคุณภาพ"}
                    </span>
                    <span className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                      {k.metric}
                    </span>
                  </div>
                  {k.type === "QUANTITATIVE" && (
                    <span className="text-sm font-semibold text-slate-700 dark:text-slate-300">
                      <span className="text-emerald-700 dark:text-emerald-400">{totalAchieved.toLocaleString()}</span>
                      {k.targetTotal && (
                        <>
                          <span className="text-slate-400"> / </span>
                          {k.targetTotal.toLocaleString()}
                        </>
                      )}{" "}
                      {k.unit ?? ""}
                    </span>
                  )}
                </div>
                {percent !== null && (
                  <div className="h-1.5 rounded-sm bg-slate-100 dark:bg-slate-800 overflow-hidden mb-1.5">
                    <div
                      className={`h-full transition-all ${
                        percent >= 75
                          ? "bg-emerald-600"
                          : percent >= 40
                          ? "bg-amber-500"
                          : "bg-slate-400"
                      }`}
                      style={{ width: `${percent}%` }}
                    />
                  </div>
                )}
                <div className="text-[11px] text-slate-500 dark:text-slate-400 flex items-center gap-3">
                  <span>👥 ส่งผลแล้ว {reportingCount}/{assignments.length} หน่วย</span>
                  {k.type === "QUANTITATIVE" && assignments[0]?.targetShare && (
                    <span>หน่วยละ {assignments[0].targetShare} {k.unit ?? ""}</span>
                  )}
                  <span>📋 รายงาน {FREQUENCY_TH[k.reportFrequency]}</span>
                </div>
              </div>
            );
          })}
        </div>
      </section>
    </div>
  );
}

const FREQUENCY_TH: Record<string, string> = {
  DAILY: "รายวัน",
  WEEKLY: "รายสัปดาห์",
  MONTHLY: "รายเดือน",
  END_OF_PERIOD: "สิ้นสุดงวด",
};

function Metric({
  icon: Icon,
  label,
  value,
  sub,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: string;
  sub?: string;
}) {
  return (
    <div className="rounded-sm border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-3">
      <div className="flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-0.5">
        <Icon className="h-3 w-3" />
        {label}
      </div>
      <div className="text-sm font-bold text-slate-900 dark:text-slate-100 leading-tight">
        {value}
      </div>
      {sub && <div className="text-[10px] text-slate-500 dark:text-slate-400 mt-0.5">{sub}</div>}
    </div>
  );
}

interface AlignmentGroupProps {
  icon: React.ComponentType<{ className?: string }>;
  level: string;
  items: { id: string; text: string }[];
  accent: "navy" | "gold" | "slate";
}

function AlignmentGroup({ icon: Icon, level, items, accent }: AlignmentGroupProps) {
  const accents = {
    navy: "text-[#1e3a5f] dark:text-blue-400 bg-[#1e3a5f]/[0.05] dark:bg-blue-950/30",
    gold: "text-[#92400e] dark:text-amber-400 bg-[#b8860b]/[0.05] dark:bg-amber-950/30",
    slate: "text-slate-700 dark:text-slate-300 bg-slate-50 dark:bg-slate-800/50",
  }[accent];
  return (
    <div className={`rounded-sm p-2 ${accents}`}>
      <div className="flex items-center gap-1 text-[10px] font-semibold uppercase tracking-wider mb-1">
        <Icon className="h-3 w-3" />
        {level}
      </div>
      {items.length === 0 ? (
        <div className="text-[11px] text-slate-400 italic">— ไม่จับคู่ —</div>
      ) : (
        <ul className="space-y-0.5">
          {items.map((it) => (
            <li key={it.id} className="text-[11px] leading-snug">
              • {it.text}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function resolvePlanItems(alignment: {
  nationalStrategyItemIds: string[];
  masterPlanItemIds: string[];
  actionPlanItemIds: string[];
}) {
  const l1: { id: string; text: string }[] = [];
  const l2: { id: string; text: string }[] = [];
  const l3: { id: string; text: string }[] = [];

  for (const id of alignment.nationalStrategyItemIds) {
    const text = lookupItemOrDocText(id);
    if (text) l1.push({ id, text });
  }
  for (const id of alignment.masterPlanItemIds) {
    const text = lookupItemOrDocText(id);
    if (text) l2.push({ id, text });
  }
  for (const id of alignment.actionPlanItemIds) {
    const text = lookupItemOrDocText(id);
    if (text) l3.push({ id, text });
  }

  return { l1, l2, l3 };
}

function lookupItemOrDocText(id: string): string | null {
  if (id.endsWith("-doc")) {
    const docId = id.replace(/-doc$/, "");
    const doc = getDocument(docId);
    return doc?.title ?? null;
  }
  const allDocIds = ["seed-ns-2018-2037"];
  for (let i = 1; i <= 23; i++) {
    allDocIds.push(`seed-mp-${String(i).padStart(2, "0")}`);
  }
  for (const docId of allDocIds) {
    const items = getItemsForDocument(docId);
    const found = items.find((it) => it.id === id);
    if (found) return `${found.number} ${found.name}`;
  }
  return null;
}
