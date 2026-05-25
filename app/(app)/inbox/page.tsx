// /inbox — งานรอ (per-persona pending tasks)

import Link from "next/link";
import {
  Inbox,
  Sparkles,
  CheckCircle2,
  PlayCircle,
  FileCheck,
  Lock,
  FileEdit,
  Eye,
  Clock,
  ChevronRight,
  ClipboardList,
  AlertTriangle,
} from "lucide-react";
import { PageHeader } from "@/components/page-header";
import { buildInbox } from "@/lib/commands/inbox";
import { buildAssessmentInbox } from "@/lib/assessments/inbox";
import { getActivePersona, getUnit } from "@/lib/police-org/store";
import { STATUS_LABELS } from "@/lib/commands/types";
import { InboxQuickActions } from "./quick-actions";
import type { InboxCategory } from "@/lib/commands/inbox";

export const dynamic = "force-dynamic";

const CATEGORY_ICONS: Record<InboxCategory, React.ComponentType<{ className?: string }>> = {
  PENDING_APPROVAL: Sparkles,
  PENDING_ACK: CheckCircle2,
  PENDING_START: PlayCircle,
  PENDING_REPORT: FileCheck,
  PENDING_CLOSE: Lock,
  MY_DRAFT: FileEdit,
  MONITORING: Eye,
};

const ACCENT_STYLES = {
  amber: {
    border: "border-amber-300 dark:border-amber-700",
    bg: "bg-amber-50 dark:bg-amber-900/20",
    iconBg: "bg-amber-600",
    text: "text-amber-900 dark:text-amber-200",
    sub: "text-amber-800 dark:text-amber-300",
  },
  blue: {
    border: "border-blue-300 dark:border-blue-700",
    bg: "bg-blue-50 dark:bg-blue-900/20",
    iconBg: "bg-blue-600",
    text: "text-blue-900 dark:text-blue-200",
    sub: "text-blue-800 dark:text-blue-300",
  },
  emerald: {
    border: "border-emerald-300 dark:border-emerald-700",
    bg: "bg-emerald-50 dark:bg-emerald-900/20",
    iconBg: "bg-emerald-600",
    text: "text-emerald-900 dark:text-emerald-200",
    sub: "text-emerald-800 dark:text-emerald-300",
  },
  red: {
    border: "border-red-300 dark:border-red-700",
    bg: "bg-red-50 dark:bg-red-900/20",
    iconBg: "bg-red-600",
    text: "text-red-900 dark:text-red-200",
    sub: "text-red-800 dark:text-red-300",
  },
  slate: {
    border: "border-slate-300 dark:border-slate-700",
    bg: "bg-slate-50 dark:bg-slate-800/50",
    iconBg: "bg-slate-600",
    text: "text-slate-900 dark:text-slate-100",
    sub: "text-slate-700 dark:text-slate-300",
  },
};

export default function InboxPage() {
  const persona = getActivePersona();
  const unit = getUnit(persona.unitId);
  const { groups, totalActionable } = buildInbox(persona);
  const assessmentItems = buildAssessmentInbox(persona);
  const grandTotal = totalActionable + assessmentItems.length;

  return (
    <div className="space-y-5">
      <PageHeader
        icon={Inbox}
        eyebrow="งานของคุณ"
        title="งานรอดำเนินการ"
        description={`รายการงานทั้งหมดของ ${persona.rank} ${persona.name.split(" ").slice(1).join(" ")} (${persona.role}) — แยกตามประเภทที่ต้องทำ`}
        actions={
          grandTotal > 0 ? (
            <div className="text-right">
              <div className="text-3xl font-bold text-[#1e3a5f] dark:text-amber-400 leading-none">
                {grandTotal}
              </div>
              <div className="text-[10px] text-slate-500 dark:text-slate-400 mt-0.5">
                งานต้องดำเนินการ
              </div>
            </div>
          ) : null
        }
      />

      {/* Empty state */}
      {groups.length === 0 && assessmentItems.length === 0 && (
        <div className="rounded-sm border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-12 text-center">
          <div className="h-16 w-16 mx-auto rounded-full bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center mb-3">
            <CheckCircle2 className="h-8 w-8 text-emerald-600 dark:text-emerald-400" />
          </div>
          <div className="text-base font-semibold text-slate-900 dark:text-slate-100">
            ไม่มีงานรอดำเนินการ 🎉
          </div>
          <div className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            persona ปัจจุบันไม่มีหนังสือสั่งการที่ต้องอนุมัติ รับทราบ หรือส่งผล
          </div>
          <div className="text-xs text-slate-400 dark:text-slate-500 mt-3">
            ลอง <Link href="/commands/new" className="text-[#1e3a5f] dark:text-blue-400 hover:underline">ร่างหนังสือใหม่</Link> หรือสลับ persona ด้านบนเพื่อดูงานของคนอื่น
          </div>
        </div>
      )}

      {/* Persona context card */}
      {unit && groups.length > 0 && (
        <div className="rounded-sm border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 px-4 py-2.5 flex items-center justify-between text-xs">
          <div className="text-slate-600 dark:text-slate-400">
            กำลังดูในฐานะ:{" "}
            <span className="font-semibold text-slate-900 dark:text-slate-100">
              {persona.rank} {persona.name.split(" ").slice(1).join(" ")}
            </span>{" "}
            ({persona.role}) — หน่วย{" "}
            <span className="font-semibold">{unit.shortName ?? unit.code}</span>
          </div>
          <div className="text-slate-500 dark:text-slate-400">
            💡 สลับ persona จากปุ่ม profile บนขวาเพื่อดูงานของคนอื่น
          </div>
        </div>
      )}

      {/* Groups */}
      {groups.map((group) => {
        const Icon = CATEGORY_ICONS[group.category];
        const styles = ACCENT_STYLES[group.accent];
        return (
          <section
            key={group.category}
            className={`rounded-sm border-2 ${styles.border} ${styles.bg}`}
          >
            <div className="px-4 py-3 border-b border-current/15 flex items-center gap-3">
              <div className={`h-9 w-9 rounded-sm ${styles.iconBg} flex items-center justify-center shrink-0`}>
                <Icon className="h-4 w-4 text-white" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <h2 className={`text-base font-bold ${styles.text}`}>
                    {group.label}
                  </h2>
                  <span
                    className={`text-xs font-semibold px-2 py-0.5 rounded-sm ${styles.iconBg} text-white`}
                  >
                    {group.items.length}
                  </span>
                </div>
                <div className={`text-xs mt-0.5 ${styles.sub}`}>
                  {group.description}
                </div>
              </div>
            </div>

            <div className="divide-y divide-current/10">
              {group.items.map((item) => (
                <div
                  key={item.command.id}
                  className="px-4 py-3 hover:bg-white/40 dark:hover:bg-slate-900/40"
                >
                  <div className="flex items-start gap-3">
                    <div className="min-w-0 flex-1">
                      <Link
                        href={`/commands/${item.command.id}`}
                        className="block hover:underline"
                      >
                        <div className={`text-sm font-semibold ${styles.text} line-clamp-2`}>
                          {item.command.letter.subject}
                        </div>
                        <div className={`text-[11px] mt-1 ${styles.sub} flex items-center gap-2 flex-wrap`}>
                          <span className="font-mono text-[10px]">
                            {item.command.letter.docNumber ?? "—"}
                          </span>
                          <span>·</span>
                          <span>
                            จาก {item.command.createdByTitle}{" "}
                            {item.command.createdByName.split(" ").slice(1).join(" ")}
                          </span>
                          <span>·</span>
                          <span>สถานะ {STATUS_LABELS[item.command.status]}</span>
                          {item.unitStatus && (
                            <>
                              <span>·</span>
                              <span>หน่วยคุณ: {item.unitStatus}</span>
                            </>
                          )}
                        </div>
                      </Link>
                    </div>

                    {/* Deadline indicator */}
                    <div className="shrink-0 text-right">
                      <div
                        className={`text-[10px] font-semibold ${
                          item.isOverdue
                            ? "text-red-700 dark:text-red-400"
                            : item.daysLeft <= 3
                            ? "text-amber-700 dark:text-amber-400"
                            : styles.sub
                        }`}
                      >
                        <Clock className="inline h-2.5 w-2.5 mr-0.5" />
                        {item.isOverdue
                          ? `เลย ${Math.abs(item.daysLeft)} วัน`
                          : item.daysLeft === 0
                          ? "วันสุดท้าย!"
                          : `เหลือ ${item.daysLeft} วัน`}
                      </div>
                      <div className="text-[10px] text-slate-500 mt-0.5">
                        {new Date(item.command.dueDate).toLocaleDateString("th-TH")}
                      </div>
                    </div>
                  </div>

                  {/* Quick actions (client island) */}
                  <div className="mt-2 flex items-center gap-2">
                    <InboxQuickActions
                      category={item.category}
                      commandId={item.command.id}
                      unitId={persona.unitId}
                    />
                    <Link
                      href={`/commands/${item.command.id}`}
                      className="ml-auto text-[11px] text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 inline-flex items-center gap-0.5"
                    >
                      เปิดดู
                      <ChevronRight className="h-3 w-3" />
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          </section>
        );
      })}

      {/* Assessment inbox section */}
      {assessmentItems.length > 0 && (
        <section className="rounded-sm border-2 border-purple-300 bg-purple-50 dark:bg-purple-900/20">
          <div className="px-4 py-3 border-b border-purple-200 dark:border-purple-800 flex items-center gap-3">
            <div className="h-9 w-9 rounded-sm bg-purple-700 flex items-center justify-center shrink-0">
              <ClipboardList className="h-4 w-4 text-white" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <h2 className="text-base font-bold text-purple-900 dark:text-purple-200">
                  แบบประเมินที่ต้องส่ง
                </h2>
                <span className="text-xs font-semibold px-2 py-0.5 rounded-sm bg-purple-700 text-white">
                  {assessmentItems.length}
                </span>
              </div>
              <div className="text-xs mt-0.5 text-purple-800 dark:text-purple-300">
                แบบประเมิน ก.พ.ร., PMQA, ITA และอื่นๆ ที่หน่วยของท่านยังไม่ได้ส่ง
              </div>
            </div>
          </div>

          <div className="divide-y divide-purple-200/50 dark:divide-purple-800/50">
            {assessmentItems.map((item) => (
              <div
                key={item.assessment.id}
                className="px-4 py-3 hover:bg-purple-100/40 dark:hover:bg-purple-900/40"
              >
                <div className="flex items-start gap-3">
                  <div className="min-w-0 flex-1">
                    <Link
                      href={`/assessments/${item.assessment.id}/submit`}
                      className="block hover:underline"
                    >
                      <div className="text-sm font-semibold text-purple-900 dark:text-purple-200 line-clamp-2">
                        {item.assessment.title}
                      </div>
                      <div className="text-[11px] mt-1 text-purple-800 dark:text-purple-300 flex items-center gap-2 flex-wrap">
                        <span className="font-semibold">{item.assessment.category}</span>
                        <span>·</span>
                        <span>
                          จาก {item.assessment.createdByTitle}{" "}
                          {item.assessment.createdByName.split(" ").slice(1).join(" ")}
                        </span>
                      </div>
                    </Link>
                  </div>

                  {/* Days left */}
                  <div className="shrink-0 text-right">
                    <div
                      className={`text-[10px] font-semibold flex items-center gap-0.5 justify-end ${
                        item.isOverdue
                          ? "text-red-700 dark:text-red-400"
                          : item.daysLeft <= 7
                          ? "text-amber-700 dark:text-amber-400"
                          : "text-purple-700 dark:text-purple-400"
                      }`}
                    >
                      {item.isOverdue ? (
                        <AlertTriangle className="h-2.5 w-2.5" />
                      ) : (
                        <Clock className="h-2.5 w-2.5" />
                      )}
                      {item.isOverdue
                        ? `เลย ${Math.abs(item.daysLeft)} วัน`
                        : item.daysLeft === 0
                        ? "วันสุดท้าย!"
                        : `เหลือ ${item.daysLeft} วัน`}
                    </div>
                    <div className="text-[10px] text-slate-500 mt-0.5">
                      {new Date(item.assessment.dueDate).toLocaleDateString("th-TH")}
                    </div>
                  </div>
                </div>

                <div className="mt-2 flex items-center gap-2">
                  <Link
                    href={`/assessments/${item.assessment.id}/submit`}
                    className="inline-flex items-center gap-1 text-[11px] font-semibold px-2.5 py-1 rounded-sm bg-purple-700 hover:bg-purple-800 text-white transition-colors"
                  >
                    <ClipboardList className="h-3 w-3" />
                    ส่งแบบประเมิน
                  </Link>
                  <Link
                    href={`/assessments/${item.assessment.id}`}
                    className="ml-auto text-[11px] text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 inline-flex items-center gap-0.5"
                  >
                    เปิดดู
                    <ChevronRight className="h-3 w-3" />
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
