// /assessments/[id]/submit — unit submission page

import { notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, ClipboardList, Clock, AlertTriangle, CheckCircle2, FileText } from "lucide-react";
import { PageHeader } from "@/components/page-header";
import { getAssessment } from "@/lib/assessments/store";
import { getActivePersona, getUnit } from "@/lib/police-org/store";
import { SubmitForm } from "./submit-form";

export const dynamic = "force-dynamic";

export default async function SubmitPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const assessment = getAssessment(id);
  if (!assessment) notFound();

  const persona = getActivePersona();
  const unit = getUnit(persona.unitId);

  const now = Date.now();
  const daysLeft = Math.ceil(
    (new Date(assessment.dueDate).getTime() - now) / 86400000
  );
  const isOverdue = daysLeft < 0;

  // Check if this persona's unit is a target
  const isTarget = assessment.targetUnitIds.includes(persona.unitId);

  // Check if already submitted
  const existingSubmission = assessment.submissions.find(
    (s) =>
      s.unitId === persona.unitId &&
      (s.status === "SUBMITTED" || s.status === "REVIEWED")
  );

  return (
    <div className="space-y-5 max-w-2xl">
      <Link
        href="/inbox"
        className="inline-flex items-center gap-1 text-sm text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100"
      >
        <ArrowLeft className="h-4 w-4" />
        กลับ งานรอ
      </Link>

      <PageHeader
        icon={ClipboardList}
        eyebrow={assessment.category}
        title={assessment.title}
        description={assessment.description}
      />

      {/* Due date indicator */}
      <div
        className={`rounded-sm border px-4 py-3 flex items-center gap-3 ${
          isOverdue
            ? "border-red-300 bg-red-50 dark:bg-red-900/20"
            : daysLeft <= 7
            ? "border-amber-300 bg-amber-50 dark:bg-amber-900/20"
            : "border-blue-300 bg-blue-50 dark:bg-blue-900/20"
        }`}
      >
        {isOverdue ? (
          <AlertTriangle className="h-5 w-5 text-red-600 shrink-0" />
        ) : (
          <Clock className="h-5 w-5 text-blue-600 shrink-0" />
        )}
        <div className="text-sm">
          <span className={`font-semibold ${isOverdue ? "text-red-800 dark:text-red-300" : daysLeft <= 7 ? "text-amber-800 dark:text-amber-300" : "text-blue-800 dark:text-blue-300"}`}>
            {isOverdue
              ? `เลยกำหนดส่งแล้ว ${Math.abs(daysLeft)} วัน`
              : daysLeft === 0
              ? "วันสุดท้ายของการส่ง!"
              : `เหลือเวลาอีก ${daysLeft} วัน`}
          </span>
          <span className="ml-2 text-slate-500 dark:text-slate-400">
            ครบกำหนด {new Date(assessment.dueDate).toLocaleDateString("th-TH", { year: "numeric", month: "long", day: "numeric" })}
          </span>
        </div>
      </div>

      {/* Instructions */}
      {assessment.instructions && (
        <div className="bg-white dark:bg-slate-900 rounded-sm border border-slate-200 dark:border-slate-800 p-4">
          <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-100 mb-2">
            คำแนะนำการส่ง
          </h3>
          <p className="text-sm text-slate-700 dark:text-slate-300 leading-relaxed whitespace-pre-line">
            {assessment.instructions}
          </p>
          {assessment.fileName && (
            <div className="mt-3 flex items-center gap-2 text-sm text-slate-600 dark:text-slate-400">
              <span className="text-[10px] font-bold bg-red-600 text-white px-1.5 py-0.5 rounded-sm">
                PDF
              </span>
              <FileText className="h-4 w-4" />
              แบบฟอร์ม: {assessment.fileName}
            </div>
          )}
        </div>
      )}

      {/* Already submitted */}
      {existingSubmission ? (
        <div className="rounded-sm border-2 border-emerald-300 bg-emerald-50 dark:bg-emerald-900/20 p-5 text-center space-y-2">
          <CheckCircle2 className="h-10 w-10 text-emerald-600 mx-auto" />
          <div className="text-base font-semibold text-emerald-800 dark:text-emerald-300">
            หน่วยของท่านส่งแบบประเมินนี้แล้ว
          </div>
          <div className="text-sm text-emerald-700 dark:text-emerald-400">
            ส่งเมื่อ {new Date(existingSubmission.submittedAt).toLocaleString("th-TH")}
            {existingSubmission.fileName && ` · ไฟล์: ${existingSubmission.fileName}`}
          </div>
          <div className="text-xs text-emerald-600 dark:text-emerald-500 mt-1">
            สถานะ: {existingSubmission.status === "REVIEWED" ? "ตรวจแล้ว" : "รอตรวจ"}
          </div>
          <Link
            href="/inbox"
            className="inline-flex items-center gap-1.5 mt-2 rounded-sm bg-emerald-700 hover:bg-emerald-800 text-white text-sm font-medium px-4 py-2"
          >
            กลับสู่งานรอ
          </Link>
        </div>
      ) : !isTarget ? (
        <div className="rounded-sm border-2 border-red-300 bg-red-50 dark:bg-red-900/20 p-5 text-center">
          <div className="text-sm font-semibold text-red-800 dark:text-red-300">
            หน่วยของท่าน ({unit?.shortName ?? persona.unitId}) ไม่ได้รับมอบหมายให้ส่งแบบประเมินนี้
          </div>
        </div>
      ) : assessment.status !== "PUBLISHED" ? (
        <div className="rounded-sm border-2 border-slate-300 bg-slate-50 dark:bg-slate-800 p-5 text-center">
          <div className="text-sm font-semibold text-slate-700 dark:text-slate-300">
            {assessment.status === "CLOSED" ? "แบบประเมินนี้ปิดรับแล้ว" : "แบบประเมินนี้ยังไม่เปิดรับ"}
          </div>
        </div>
      ) : (
        <SubmitForm
          assessmentId={id}
          persona={persona}
          unit={unit}
        />
      )}
    </div>
  );
}
