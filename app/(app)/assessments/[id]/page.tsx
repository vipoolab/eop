// /assessments/[id] — admin tracking view for an assessment

import Link from "next/link";
import { notFound } from "next/navigation";
import {
  ArrowLeft,
  ClipboardList,
  Building2,
  FileText,
  Clock,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Calendar,
} from "lucide-react";
import { PageHeader } from "@/components/page-header";
import { getAssessment } from "@/lib/assessments/store";
import type { AssessmentStatus, SubmissionStatus } from "@/lib/assessments/types";
import {
  ASSESSMENT_STATUS_LABELS,
  ASSESSMENT_STATUS_STYLES,
  SUBMISSION_STATUS_LABELS,
  SUBMISSION_STATUS_STYLES,
  CATEGORY_STYLES,
} from "@/lib/assessments/types";
import { PublishButton } from "./publish-button";
import { CloseButton } from "./close-button";
import { ReviewButton } from "./review-button";

export const dynamic = "force-dynamic";

// Unit name lookup for target units not yet submitted
const UNIT_NAMES: Record<string, string> = {
  "u-bch-na": "กองบัญชาการตำรวจนครบาล (บช.น.)",
  "u-bch-1": "ตำรวจภูธรภาค ๑ (ภ.๑)",
  "u-bch-2": "ตำรวจภูธรภาค ๒ (ภ.๒)",
  "u-bch-3": "ตำรวจภูธรภาค ๓ (ภ.๓)",
  "u-bch-4": "ตำรวจภูธรภาค ๔ (ภ.๔)",
  "u-bch-5": "ตำรวจภูธรภาค ๕ (ภ.๕)",
  "u-bch-6": "ตำรวจภูธรภาค ๖ (ภ.๖)",
  "u-bch-7": "ตำรวจภูธรภาค ๗ (ภ.๗)",
  "u-bch-8": "ตำรวจภูธรภาค ๘ (ภ.๘)",
  "u-bch-9": "ตำรวจภูธรภาค ๙ (ภ.๙)",
  "u-bch-special-1": "กองบัญชาการตำรวจปราบปรามยาเสพติด (บช.ปส.)",
  "u-bch-special-2": "กองบัญชาการตำรวจสืบสวนอาชญากรรมทางเทคโนโลยี (บช.สอท.)",
  "u-bch-special-3": "กองบัญชาการตำรวจสันติบาล (บช.ส.)",
};

export default async function AssessmentDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const assessment = getAssessment(id);
  if (!assessment) notFound();

  const now = Date.now();
  const daysLeft = Math.ceil(
    (new Date(assessment.dueDate).getTime() - now) / 86400000
  );
  const isOverdue = daysLeft < 0 && assessment.status === "PUBLISHED";
  const isUrgent = !isOverdue && daysLeft <= 7 && assessment.status === "PUBLISHED";

  const submittedIds = new Set(
    assessment.submissions
      .filter((s) => s.status === "SUBMITTED" || s.status === "REVIEWED")
      .map((s) => s.unitId)
  );
  const pendingUnitIds = assessment.targetUnitIds.filter((uid) => !submittedIds.has(uid));

  const submitted = assessment.submissions.filter(
    (s) => s.status === "SUBMITTED" || s.status === "REVIEWED"
  ).length;
  const reviewed = assessment.submissions.filter((s) => s.status === "REVIEWED").length;
  const returned = assessment.submissions.filter((s) => s.status === "RETURNED").length;
  const pending = pendingUnitIds.length;
  const total = assessment.targetUnitIds.length;
  const pct = total > 0 ? Math.round((submitted / total) * 100) : 0;

  return (
    <div className="space-y-5">
      <Link
        href="/assessments"
        className="inline-flex items-center gap-1 text-sm text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100"
      >
        <ArrowLeft className="h-4 w-4" />
        กลับ รายการแบบประเมิน
      </Link>

      <PageHeader
        icon={ClipboardList}
        eyebrow={assessment.category}
        title={assessment.title}
        description={assessment.description}
        actions={
          <div className="flex items-center gap-2">
            <span
              className={`text-[11px] font-semibold px-2 py-1 rounded-sm border ${ASSESSMENT_STATUS_STYLES[assessment.status as AssessmentStatus]}`}
            >
              {ASSESSMENT_STATUS_LABELS[assessment.status as AssessmentStatus]}
            </span>
            <span
              className={`text-[11px] font-semibold px-2 py-1 rounded-sm border ${
                CATEGORY_STYLES[assessment.category as keyof typeof CATEGORY_STYLES] ?? ""
              }`}
            >
              {assessment.category}
            </span>
            {assessment.status === "DRAFT" && (
              <PublishButton assessmentId={id} />
            )}
            {assessment.status === "PUBLISHED" && (
              <CloseButton assessmentId={id} />
            )}
          </div>
        }
      />

      {/* Status banner */}
      {assessment.status === "PUBLISHED" && (
        <div
          className={`rounded-sm border-2 px-4 py-3 flex items-center gap-3 ${
            isOverdue
              ? "border-red-300 bg-red-50 dark:bg-red-900/20"
              : isUrgent
              ? "border-amber-300 bg-amber-50 dark:bg-amber-900/20"
              : "border-blue-300 bg-blue-50 dark:bg-blue-900/20"
          }`}
        >
          {isOverdue ? (
            <AlertTriangle className="h-5 w-5 text-red-600 shrink-0" />
          ) : isUrgent ? (
            <AlertTriangle className="h-5 w-5 text-amber-600 shrink-0" />
          ) : (
            <Clock className="h-5 w-5 text-blue-600 shrink-0" />
          )}
          <div className="text-sm font-semibold">
            {isOverdue ? (
              <span className="text-red-800 dark:text-red-300">
                เลยกำหนดส่งแล้ว {Math.abs(daysLeft)} วัน — ยังมี {pending} หน่วยที่ยังไม่ส่ง
              </span>
            ) : daysLeft === 0 ? (
              <span className="text-amber-800 dark:text-amber-300">
                วันสุดท้ายของการส่ง! ยังมี {pending} หน่วยที่ยังไม่ส่ง
              </span>
            ) : (
              <span className={isUrgent ? "text-amber-800 dark:text-amber-300" : "text-blue-800 dark:text-blue-300"}>
                เหลือเวลา {daysLeft} วัน · ครบกำหนด{" "}
                {new Date(assessment.dueDate).toLocaleDateString("th-TH", {
                  year: "numeric",
                  month: "long",
                  day: "numeric",
                })}
              </span>
            )}
          </div>
        </div>
      )}

      {assessment.status === "CLOSED" && (
        <div className="rounded-sm border-2 border-emerald-300 bg-emerald-50 dark:bg-emerald-900/20 px-4 py-3 flex items-center gap-3">
          <CheckCircle2 className="h-5 w-5 text-emerald-600 shrink-0" />
          <div className="text-sm font-semibold text-emerald-800 dark:text-emerald-300">
            ปิดรับแบบประเมินแล้วเมื่อ{" "}
            {assessment.closedAt
              ? new Date(assessment.closedAt).toLocaleDateString("th-TH", {
                  year: "numeric",
                  month: "long",
                  day: "numeric",
                })
              : "—"}
          </div>
        </div>
      )}

      {assessment.status === "DRAFT" && (
        <div className="rounded-sm border-2 border-slate-300 bg-slate-50 dark:bg-slate-800/50 px-4 py-3 flex items-center gap-3">
          <FileText className="h-5 w-5 text-slate-500 shrink-0" />
          <div className="text-sm font-semibold text-slate-700 dark:text-slate-300">
            อยู่ในสถานะร่าง — กดปุ่ม "เผยแพร่" เพื่อส่งให้หน่วยงานเป้าหมายดำเนินการ
          </div>
        </div>
      )}

      {/* Stats */}
      {total > 0 && (
        <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
          <MiniStat label="หน่วยทั้งหมด" value={total} color="navy" />
          <MiniStat label="ส่งแล้ว" value={submitted} color="blue" />
          <MiniStat label="ยังไม่ส่ง" value={pending} color={pending > 0 ? "red" : "slate"} />
          <MiniStat label="ตรวจแล้ว" value={reviewed} color="emerald" />
          <MiniStat label="ตีกลับ" value={returned} color={returned > 0 ? "amber" : "slate"} />
        </div>
      )}

      {/* Progress bar */}
      {total > 0 && assessment.status !== "DRAFT" && (
        <div className="bg-white dark:bg-slate-900 rounded-sm border border-slate-200 dark:border-slate-800 px-5 py-4">
          <div className="flex items-center justify-between text-xs text-slate-600 dark:text-slate-400 mb-2">
            <span className="font-semibold">ความคืบหน้าการส่ง</span>
            <span className="font-bold text-slate-900 dark:text-slate-100">{pct}%</span>
          </div>
          <div className="w-full h-3 rounded-sm bg-slate-100 dark:bg-slate-700 overflow-hidden">
            <div
              className={`h-full rounded-sm transition-all ${
                pct === 100
                  ? "bg-emerald-500"
                  : isOverdue
                  ? "bg-red-500"
                  : "bg-blue-500"
              }`}
              style={{ width: `${pct}%` }}
            />
          </div>
          <div className="text-[11px] text-slate-400 mt-1">
            {submitted} จาก {total} หน่วยส่งแล้ว
          </div>
        </div>
      )}

      {/* Assessment meta */}
      <div className="bg-white dark:bg-slate-900 rounded-sm border border-slate-200 dark:border-slate-800 px-5 py-4 space-y-3">
        <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-100 border-b border-slate-100 dark:border-slate-800 pb-2">
          รายละเอียดแบบประเมิน
        </h3>
        <div className="grid grid-cols-2 gap-4 text-xs">
          <div>
            <div className="text-slate-500 dark:text-slate-400 mb-0.5">ผู้สร้าง</div>
            <div className="text-slate-900 dark:text-slate-100 font-semibold">
              {assessment.createdByTitle} {assessment.createdByName.split(" ").slice(1).join(" ")}
            </div>
          </div>
          <div>
            <div className="text-slate-500 dark:text-slate-400 mb-0.5 flex items-center gap-1">
              <Calendar className="h-3 w-3" /> วันที่บังคับใช้
            </div>
            <div className="text-slate-900 dark:text-slate-100 font-semibold">
              {new Date(assessment.effectiveDate).toLocaleDateString("th-TH")}
            </div>
          </div>
          <div>
            <div className="text-slate-500 dark:text-slate-400 mb-0.5 flex items-center gap-1">
              <Clock className="h-3 w-3" /> ครบกำหนด
            </div>
            <div className="text-slate-900 dark:text-slate-100 font-semibold">
              {new Date(assessment.dueDate).toLocaleDateString("th-TH")}
            </div>
          </div>
          {assessment.fileName && (
            <div>
              <div className="text-slate-500 dark:text-slate-400 mb-0.5">ไฟล์แบบฟอร์ม</div>
              <div className="text-slate-900 dark:text-slate-100 font-semibold flex items-center gap-1">
                <span className="text-[10px] font-bold bg-red-600 text-white px-1 py-0.5 rounded-sm">
                  PDF
                </span>
                {assessment.fileName}
              </div>
            </div>
          )}
        </div>
        {assessment.instructions && (
          <div className="pt-2 border-t border-slate-100 dark:border-slate-800">
            <div className="text-xs text-slate-500 dark:text-slate-400 mb-1 font-semibold">
              คำแนะนำสำหรับผู้ส่ง
            </div>
            <p className="text-sm text-slate-700 dark:text-slate-300 leading-relaxed whitespace-pre-line">
              {assessment.instructions}
            </p>
          </div>
        )}
      </div>

      {/* Submissions table */}
      {assessment.targetUnitIds.length > 0 && (
        <div className="bg-white dark:bg-slate-900 rounded-sm border border-slate-200 dark:border-slate-800 overflow-hidden">
          <div className="px-5 py-3 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
            <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-100 flex items-center gap-2">
              <Building2 className="h-4 w-4" />
              สถานะการส่งของหน่วยงาน
            </h3>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead className="bg-slate-50 dark:bg-slate-800 text-slate-500 dark:text-slate-400">
                <tr>
                  <th className="text-left px-4 py-2 font-semibold">หน่วยงาน</th>
                  <th className="text-left px-4 py-2 font-semibold">สถานะ</th>
                  <th className="text-left px-4 py-2 font-semibold">วันที่ส่ง</th>
                  <th className="text-left px-4 py-2 font-semibold">ผู้ส่ง</th>
                  <th className="text-left px-4 py-2 font-semibold">ไฟล์</th>
                  <th className="text-left px-4 py-2 font-semibold">หมายเหตุ</th>
                  <th className="text-left px-4 py-2 font-semibold">การดำเนินการ</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {/* Units that submitted */}
                {assessment.submissions.map((sub) => (
                  <tr key={sub.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30">
                    <td className="px-4 py-3 font-medium text-slate-900 dark:text-slate-100">
                      {sub.unitName}
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`text-[10px] font-semibold px-1.5 py-0.5 rounded-sm border ${
                          SUBMISSION_STATUS_STYLES[sub.status as SubmissionStatus]
                        }`}
                      >
                        {SUBMISSION_STATUS_LABELS[sub.status as SubmissionStatus]}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-slate-600 dark:text-slate-400">
                      {new Date(sub.submittedAt).toLocaleDateString("th-TH")}
                    </td>
                    <td className="px-4 py-3 text-slate-600 dark:text-slate-400">
                      <div>{sub.submittedByTitle}</div>
                      <div className="font-medium text-slate-800 dark:text-slate-200">
                        {sub.submittedByName.split(" ").slice(1).join(" ")}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-slate-600 dark:text-slate-400">
                      {sub.fileName ? (
                        <span className="flex items-center gap-1">
                          <span className="text-[9px] font-bold bg-red-600 text-white px-1 py-0.5 rounded-sm">
                            PDF
                          </span>
                          <span className="truncate max-w-[120px]">{sub.fileName}</span>
                        </span>
                      ) : (
                        <span className="text-slate-400">—</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-slate-600 dark:text-slate-400 max-w-[160px]">
                      <div className="truncate" title={sub.notes ?? ""}>
                        {sub.notes ?? "—"}
                      </div>
                      {sub.reviewNote && (
                        <div className="mt-1 text-[10px] italic text-amber-700 dark:text-amber-400 truncate" title={sub.reviewNote}>
                          หมายเหตุผู้ตรวจ: {sub.reviewNote}
                        </div>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      {sub.status === "SUBMITTED" && assessment.status !== "DRAFT" ? (
                        <ReviewButton assessmentId={id} submissionId={sub.id} />
                      ) : sub.status === "REVIEWED" ? (
                        <div className="flex items-center gap-1 text-emerald-700 dark:text-emerald-400">
                          <CheckCircle2 className="h-3.5 w-3.5" />
                          <span className="text-[10px]">ตรวจแล้ว</span>
                        </div>
                      ) : sub.status === "RETURNED" ? (
                        <div className="flex items-center gap-1 text-red-700 dark:text-red-400">
                          <XCircle className="h-3.5 w-3.5" />
                          <span className="text-[10px]">ตีกลับแล้ว</span>
                        </div>
                      ) : null}
                    </td>
                  </tr>
                ))}

                {/* Pending units */}
                {pendingUnitIds.map((uid) => (
                  <tr key={uid} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30 opacity-70">
                    <td className="px-4 py-3 font-medium text-slate-700 dark:text-slate-300">
                      {UNIT_NAMES[uid] ?? uid}
                    </td>
                    <td className="px-4 py-3">
                      <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded-sm border bg-slate-50 text-slate-600 border-slate-300">
                        รอส่ง
                      </span>
                    </td>
                    <td className="px-4 py-3 text-slate-400">—</td>
                    <td className="px-4 py-3 text-slate-400">—</td>
                    <td className="px-4 py-3 text-slate-400">—</td>
                    <td className="px-4 py-3 text-slate-400">—</td>
                    <td className="px-4 py-3 text-slate-400">—</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}

function MiniStat({
  label,
  value,
  color,
}: {
  label: string;
  value: number;
  color: "navy" | "slate" | "blue" | "amber" | "emerald" | "red";
}) {
  const colors = {
    navy: "text-[#1e3a5f] dark:text-blue-300",
    slate: "text-slate-500 dark:text-slate-400",
    blue: "text-blue-700 dark:text-blue-300",
    amber: "text-amber-700 dark:text-amber-300",
    emerald: "text-emerald-700 dark:text-emerald-300",
    red: "text-red-700 dark:text-red-300",
  };
  const bgColors = {
    navy: "bg-[#1e3a5f]/5 dark:bg-[#1e3a5f]/20 border-[#1e3a5f]/20",
    slate: "bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700",
    blue: "bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800",
    amber: "bg-amber-50 dark:bg-amber-900/20 border-amber-200 dark:border-amber-800",
    emerald: "bg-emerald-50 dark:bg-emerald-900/20 border-emerald-200 dark:border-emerald-800",
    red: "bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800",
  };
  return (
    <div className={`rounded-sm border ${bgColors[color]} p-3 text-center`}>
      <div className={`text-2xl font-bold ${colors[color]}`}>{value}</div>
      <div className="text-[10px] font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 mt-0.5">
        {label}
      </div>
    </div>
  );
}
