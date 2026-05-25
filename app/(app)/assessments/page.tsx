// /assessments — ระบบวางแผนและติดตามกฎระเบียบ

import Link from "next/link";
import {
  ClipboardList,
  Plus,
  Clock,
  CheckCircle2,
  FileText,
  AlertTriangle,
} from "lucide-react";
import { PageHeader } from "@/components/page-header";
import { listAssessments } from "@/lib/assessments/store";
import type { AssessmentStatus, AssessmentCategory } from "@/lib/assessments/types";
import {
  ASSESSMENT_STATUS_LABELS,
  ASSESSMENT_STATUS_STYLES,
  CATEGORY_STYLES,
} from "@/lib/assessments/types";

export const dynamic = "force-dynamic";

const STATUS_ICON: Record<AssessmentStatus, React.ComponentType<{ className?: string }>> = {
  DRAFT: FileText,
  PUBLISHED: Clock,
  CLOSED: CheckCircle2,
};

export default function AssessmentsPage() {
  const assessments = listAssessments();
  const now = Date.now();

  const total = assessments.length;
  const published = assessments.filter((a) => a.status === "PUBLISHED").length;
  const closed = assessments.filter((a) => a.status === "CLOSED").length;
  const urgent = assessments.filter((a) => {
    if (a.status !== "PUBLISHED") return false;
    const daysLeft = Math.ceil((new Date(a.dueDate).getTime() - now) / 86400000);
    return daysLeft <= 7;
  }).length;

  return (
    <div className="space-y-6">
      <PageHeader
        icon={ClipboardList}
        eyebrow="ระบบประเมินราชการ"
        title="ระบบวางแผนและติดตามกฎระเบียบ"
        description="วางแผนและติดตามการส่งแบบประเมิน ก.พ.ร., PMQA, ITA และอื่นๆ ของหน่วยงานในสังกัด"
        actions={
          <Link
            href="/assessments/new"
            className="inline-flex items-center gap-1.5 rounded-sm bg-[#1e3a5f] hover:bg-[#142a45] text-white text-sm font-medium px-4 py-2 transition-colors"
          >
            <Plus className="h-4 w-4" />
            เพิ่มแบบประเมินใหม่
          </Link>
        }
      />

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <StatCard label="ทั้งหมด" value={total} icon={FileText} color="navy" />
        <StatCard label="เผยแพร่อยู่" value={published} icon={Clock} color="blue" />
        <StatCard label="ปิดรับแล้ว" value={closed} icon={CheckCircle2} color="emerald" />
        <StatCard
          label="ใกล้ครบกำหนด (≤7 วัน)"
          value={urgent}
          icon={AlertTriangle}
          color={urgent > 0 ? "red" : "slate"}
        />
      </div>

      {/* List */}
      <section className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-sm overflow-hidden">
        <div className="border-b border-slate-100 dark:border-slate-800 px-5 py-3 flex items-center justify-between">
          <h2 className="font-semibold text-slate-900 dark:text-slate-100 text-sm">
            แบบประเมินทั้งหมด ({assessments.length})
          </h2>
        </div>

        {assessments.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <div className="h-16 w-16 rounded-sm bg-slate-100 dark:bg-slate-800 flex items-center justify-center mb-3">
              <ClipboardList className="h-8 w-8 text-slate-400" />
            </div>
            <div className="text-sm font-semibold text-slate-700 dark:text-slate-300">
              ยังไม่มีแบบประเมินในระบบ
            </div>
            <Link
              href="/assessments/new"
              className="mt-4 inline-flex items-center gap-1.5 rounded-sm bg-[#1e3a5f] hover:bg-[#142a45] text-white text-sm font-medium px-4 py-2"
            >
              <Plus className="h-4 w-4" />
              เพิ่มแบบประเมินใหม่
            </Link>
          </div>
        ) : (
          <ul className="divide-y divide-slate-100 dark:divide-slate-800">
            {assessments.map((a) => {
              const daysLeft = Math.ceil(
                (new Date(a.dueDate).getTime() - now) / 86400000
              );
              const isOverdue = daysLeft < 0 && a.status === "PUBLISHED";
              const isUrgent = !isOverdue && daysLeft <= 7 && a.status === "PUBLISHED";
              const submitted = a.submissions.filter(
                (s) => s.status === "SUBMITTED" || s.status === "REVIEWED"
              ).length;
              const total = a.targetUnitIds.length;
              const pct = total > 0 ? Math.round((submitted / total) * 100) : 0;
              const StatusIcon = STATUS_ICON[a.status];

              return (
                <li key={a.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40">
                  <Link href={`/assessments/${a.id}`} className="block px-5 py-4">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0 flex-1">
                        {/* Badges row */}
                        <div className="flex items-center gap-2 mb-1 flex-wrap">
                          <span
                            className={`text-[10px] font-semibold uppercase tracking-wider px-1.5 py-0.5 rounded-sm border ${ASSESSMENT_STATUS_STYLES[a.status]}`}
                          >
                            <StatusIcon className="inline h-3 w-3 mr-0.5 -mt-0.5" />
                            {ASSESSMENT_STATUS_LABELS[a.status]}
                          </span>
                          <span
                            className={`text-[10px] font-semibold px-1.5 py-0.5 rounded-sm border ${CATEGORY_STYLES[a.category as AssessmentCategory]}`}
                          >
                            {a.category}
                          </span>
                          {isOverdue && (
                            <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded-sm bg-red-100 text-red-800 border border-red-300">
                              เลยกำหนด
                            </span>
                          )}
                          {isUrgent && (
                            <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded-sm bg-amber-100 text-amber-800 border border-amber-300">
                              ด่วน
                            </span>
                          )}
                        </div>

                        {/* Title */}
                        <div className="text-sm font-semibold text-slate-900 dark:text-slate-100 line-clamp-1">
                          {a.title}
                        </div>

                        {/* Meta */}
                        <div className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                          {a.createdByTitle} {a.createdByName.split(" ").slice(1).join(" ")} ·
                          สร้าง {new Date(a.createdAt).toLocaleDateString("th-TH")}
                        </div>

                        {/* Progress bar (only for published/closed with targets) */}
                        {total > 0 && a.status !== "DRAFT" && (
                          <div className="mt-2 flex items-center gap-2">
                            <div className="flex-1 h-1.5 rounded-sm bg-slate-100 dark:bg-slate-700 overflow-hidden">
                              <div
                                className={`h-full rounded-sm ${
                                  pct === 100
                                    ? "bg-emerald-500"
                                    : isOverdue
                                    ? "bg-red-500"
                                    : "bg-blue-500"
                                }`}
                                style={{ width: `${pct}%` }}
                              />
                            </div>
                            <span className="text-[11px] text-slate-500 dark:text-slate-400 whitespace-nowrap">
                              {submitted}/{total} หน่วย ({pct}%)
                            </span>
                          </div>
                        )}
                      </div>

                      {/* Due date */}
                      <div className="shrink-0 text-right">
                        <div
                          className={`text-[11px] font-semibold ${
                            isOverdue
                              ? "text-red-700 dark:text-red-400"
                              : isUrgent
                              ? "text-amber-700 dark:text-amber-400"
                              : "text-slate-500 dark:text-slate-400"
                          }`}
                        >
                          {a.status === "CLOSED"
                            ? "ปิดรับแล้ว"
                            : isOverdue
                            ? `เลย ${Math.abs(daysLeft)} วัน`
                            : daysLeft === 0
                            ? "วันสุดท้าย!"
                            : `เหลือ ${daysLeft} วัน`}
                        </div>
                        <div className="text-[10px] text-slate-400 mt-0.5">
                          {new Date(a.dueDate).toLocaleDateString("th-TH")}
                        </div>
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

interface StatCardProps {
  label: string;
  value: number;
  icon: React.ComponentType<{ className?: string }>;
  color: "navy" | "slate" | "blue" | "amber" | "emerald" | "red";
}

function StatCard({ label, value, icon: Icon, color }: StatCardProps) {
  const colors = {
    navy: "bg-[#1e3a5f] text-white",
    slate: "bg-slate-500 text-white",
    blue: "bg-blue-600 text-white",
    amber: "bg-amber-600 text-white",
    emerald: "bg-emerald-600 text-white",
    red: "bg-red-600 text-white",
  };
  return (
    <div className="rounded-sm border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-3 flex items-center gap-3">
      <div className={`h-9 w-9 rounded-sm flex items-center justify-center ${colors[color]}`}>
        <Icon className="h-4 w-4" />
      </div>
      <div className="min-w-0">
        <div className="text-[10px] font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
          {label}
        </div>
        <div className="text-xl font-bold text-slate-900 dark:text-slate-100 leading-none mt-0.5">
          {value}
        </div>
      </div>
    </div>
  );
}
