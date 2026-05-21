// Compliance Report Detail — view + fill + review + approve + export
// TOR 5.4.3 ๓.๑ + ๓.๒

import Link from "next/link";
import { redirect, notFound } from "next/navigation";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { PageHeader } from "@/components/page-header";
import {
  ArrowLeft,
  ShieldCheck,
  Calendar,
  Building2,
  User,
  CheckCircle2,
} from "lucide-react";
import {
  STANDARD_LABELS,
  STANDARD_COLORS,
  STATUS_LABELS,
  STATUS_COLORS,
  URGENCY_COLORS,
  calculateReportScore,
  getDeadlineUrgency,
  type ComplianceStandard,
  type ReportStatus,
} from "@/features/compliance/types";
import { ReportFillView } from "./report-fill-view";

export const dynamic = "force-dynamic";

type Role = "ADMIN" | "COMMANDER" | "STAFF" | "AUDITOR" | "VIEWER";

export default async function ReportDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const session = await auth();
  if (!session?.user) redirect("/login");

  const { id } = await params;
  const r = await prisma.complianceReport.findUnique({
    where: { id },
    include: {
      template: {
        include: { items: { orderBy: { order: "asc" } } },
      },
      unit: { select: { id: true, code: true, name: true } },
      createdBy: { select: { id: true, name: true, rank: true } },
      reviewer: { select: { id: true, name: true, rank: true } },
      approver: { select: { id: true, name: true, rank: true, position: true } },
      answers: {
        include: {
          evidenceDoc: { select: { id: true, filename: true, originalName: true } },
          answeredBy: { select: { name: true, rank: true } },
        },
      },
    },
  });

  if (!r) notFound();

  const role = session.user.role as Role;
  const status = r.status as ReportStatus;
  const std = r.template.standard as ComplianceStandard;

  // Permissions
  const canEdit = status === "DRAFT" && ["ADMIN", "COMMANDER", "STAFF"].includes(role);
  const canSubmit = status === "DRAFT" && ["ADMIN", "COMMANDER", "STAFF"].includes(role);
  const canReview = status === "SUBMITTED" && ["ADMIN", "COMMANDER", "AUDITOR"].includes(role);
  const canApprove = status === "REVIEWED" && ["ADMIN", "COMMANDER"].includes(role);
  const canDelete = ["ADMIN"].includes(role) && status !== "APPROVED";

  // Compute scores live
  const scoreCalc = calculateReportScore(
    r.template.items.map((it) => {
      const ans = r.answers.find((a) => a.itemId === it.id);
      return {
        weight: it.weight,
        selfScore: ans?.selfScore ?? null,
        reviewerScore: ans?.reviewerScore ?? null,
      };
    })
  );

  // Cross-system: fetch related KPIs for auto-fill suggestions (TOR ๓.๑ data integration)
  const linkedKpis = await prisma.kpi.findMany({
    where: r.unitId
      ? { results: { some: { unitId: r.unitId } } }
      : {},
    select: {
      id: true,
      code: true,
      name: true,
      target: true,
      actual: true,
      unit: true,
      status: true,
    },
    take: 20,
  });

  // Trend comparison — find previous reports with same template
  const previousReports = await prisma.complianceReport.findMany({
    where: {
      templateId: r.templateId,
      id: { not: r.id },
      status: "APPROVED",
    },
    orderBy: { createdAt: "desc" },
    take: 3,
    select: {
      id: true,
      period: true,
      score: true,
      maxScore: true,
      createdAt: true,
    },
  });
  const trendData = previousReports
    .map((p) => ({
      period: p.period,
      percent: p.score && p.maxScore ? (p.score / p.maxScore) * 100 : 0,
      createdAt: p.createdAt,
    }))
    .reverse(); // chronological order

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      <Link
        href="/compliance/reports"
        className="inline-flex items-center gap-1 text-sm text-slate-600 hover:text-slate-900"
      >
        <ArrowLeft className="h-4 w-4" />
        กลับยังรายการ
      </Link>

      <PageHeader
        icon={ShieldCheck}
        eyebrow={STANDARD_LABELS[std]}
        title={r.template.name}
        description={`รหัส ${r.template.code} v${r.template.version} · ช่วง ${r.period}`}
      />

      {/* Deadline urgency banner */}
      {(() => {
        const d = getDeadlineUrgency(r.dueDate);
        if (d.urgency === "none" || status === "APPROVED") return null;
        const showBanner = d.urgency === "urgent" || d.urgency === "critical" || d.urgency === "overdue";
        if (!showBanner) return null;
        return (
          <div className={`rounded-xl border-2 p-4 flex items-center gap-3 ${URGENCY_COLORS[d.urgency]}`}>
            <span className="text-2xl">⏰</span>
            <div className="flex-1">
              <div className="font-semibold">
                {d.urgency === "overdue"
                  ? "เลยกำหนดส่ง!"
                  : d.urgency === "critical"
                  ? `เร่งด่วน — ${d.label}`
                  : `กำหนดส่งใกล้ — ${d.label}`}
              </div>
              <div className="text-xs opacity-90">
                ครบกำหนด {new Date(r.dueDate!).toLocaleDateString("th-TH", { dateStyle: "long" })}
              </div>
            </div>
          </div>
        );
      })()}

      {/* Summary card */}
      <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
        <div className="flex flex-wrap items-center gap-2 mb-3">
          <span className={`text-xs px-2 py-0.5 rounded border ${STANDARD_COLORS[std]} font-semibold`}>
            {STANDARD_LABELS[std]}
          </span>
          <span className={`text-xs px-2 py-0.5 rounded border ${STATUS_COLORS[status]} font-semibold`}>
            {STATUS_LABELS[status]}
          </span>
          {r.externallySubmittedAt && (
            <span className="text-xs px-2 py-0.5 rounded bg-violet-50 text-violet-700 border border-violet-200">
              ส่งหน่วยประเมินภายนอกแล้ว
            </span>
          )}
        </div>

        <div className="grid grid-cols-3 md:grid-cols-4 gap-3 text-sm">
          <Meta icon={<Calendar />} label="ช่วงเวลา" value={r.period} />
          {r.unit && (
            <Meta icon={<Building2 />} label="หน่วยงาน" value={`${r.unit.code} — ${r.unit.name}`} />
          )}
          {r.createdBy && (
            <Meta icon={<User />} label="ผู้สร้าง" value={`${r.createdBy.rank ?? ""} ${r.createdBy.name}`} />
          )}
          {r.reviewer && (
            <Meta icon={<CheckCircle2 className="text-emerald-600" />} label="ผู้ตรวจ" value={`${r.reviewer.rank ?? ""} ${r.reviewer.name}`} />
          )}
          {r.approver && (
            <Meta
              icon={<CheckCircle2 className="text-violet-600" />}
              label="ผู้อนุมัติ (ลงนาม)"
              value={`${r.approver.rank ?? ""} ${r.approver.name}`}
            />
          )}
        </div>

        {/* e-Signature display when APPROVED */}
        {status === "APPROVED" && r.approverSignature && (
          <div className="mt-4 pt-4 border-t border-slate-100">
            <div className="rounded-lg border-2 border-emerald-200 bg-emerald-50/40 p-3">
              <div className="text-[10px] font-semibold text-emerald-800 uppercase tracking-wider mb-2 flex items-center gap-1">
                <CheckCircle2 className="h-3 w-3" />
                ลายเซ็นอิเล็กทรอนิกส์
              </div>
              {(() => {
                try {
                  const parsed = JSON.parse(r.approverSignature);
                  if (parsed.type === "typed") {
                    return (
                      <div className="font-serif italic text-2xl text-slate-800 px-3 py-2 bg-white rounded border border-slate-200">
                        {parsed.name}
                      </div>
                    );
                  }
                } catch {
                  /* drawn signature */
                }
                if (r.approverSignature.startsWith("data:image")) {
                  return (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={r.approverSignature}
                      alt="signature"
                      className="bg-white rounded border border-slate-200 max-h-24"
                    />
                  );
                }
                return (
                  <code className="text-[10px] text-slate-500 break-all">
                    {r.approverSignature.slice(0, 60)}…
                  </code>
                );
              })()}
              <div className="text-[10px] text-slate-600 mt-2 grid grid-cols-2 gap-x-3">
                <div>
                  <strong>ลงนามโดย:</strong> {r.approver?.rank ?? ""}{" "}
                  {r.approver?.name ?? "—"}
                </div>
                <div>
                  <strong>เวลา:</strong>{" "}
                  {r.approvedAt
                    ? new Date(r.approvedAt).toLocaleString("th-TH", {
                        dateStyle: "medium",
                        timeStyle: "short",
                      })
                    : "—"}
                </div>
                {r.signatureIp && (
                  <div className="col-span-2 text-[9px] text-slate-400 font-mono">
                    IP: {r.signatureIp}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Score visualization */}
        <div className="mt-4 pt-4 border-t border-slate-100">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-baseline gap-2">
              <span className="text-sm font-semibold text-slate-700">คะแนนรวม</span>
              {trendData.length > 0 && (() => {
                const lastPrev = trendData[trendData.length - 1];
                const diff = scoreCalc.percent - lastPrev.percent;
                if (Math.abs(diff) < 0.5) return null;
                return (
                  <span className={`text-[11px] font-semibold ${diff > 0 ? "text-emerald-700" : "text-rose-700"}`}>
                    {diff > 0 ? "⬆️" : "⬇️"} {diff > 0 ? "+" : ""}{diff.toFixed(0)}% จากปีก่อน
                  </span>
                );
              })()}
            </div>
            <span className="text-3xl font-bold tabular-nums text-slate-900">
              {Math.round(scoreCalc.percent)}%
            </span>
          </div>
          <div className="h-2 bg-slate-100 rounded overflow-hidden">
            <div
              className={`h-full rounded transition-all ${
                scoreCalc.percent >= 80 ? "bg-emerald-500" :
                scoreCalc.percent >= 60 ? "bg-amber-500" : "bg-rose-500"
              }`}
              style={{ width: `${scoreCalc.percent}%` }}
            />
          </div>
          <div className="flex items-center justify-between mt-1 text-[11px] text-slate-500 tabular-nums">
            <span>คะแนน {scoreCalc.score.toFixed(1)} / {scoreCalc.maxScore.toFixed(1)}</span>
            <span>กรอก {scoreCalc.answered}/{r.template.items.length} ข้อ</span>
          </div>
        </div>

        {/* Trend chart (previous reports same template) */}
        {trendData.length > 0 && (
          <div className="mt-4 pt-4 border-t border-slate-100">
            <div className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider mb-2">
              📈 ประวัติคะแนน
            </div>
            <div className="space-y-1">
              {trendData.map((t, i) => (
                <div key={i} className="flex items-center gap-2">
                  <span className="text-[11px] text-slate-600 tabular-nums w-32 truncate">{t.period}</span>
                  <div className="flex-1 h-1.5 bg-slate-100 rounded overflow-hidden">
                    <div
                      className="h-full bg-slate-400"
                      style={{ width: `${t.percent}%` }}
                    />
                  </div>
                  <span className="text-[11px] text-slate-700 tabular-nums w-12 text-right">
                    {Math.round(t.percent)}%
                  </span>
                </div>
              ))}
              <div className="flex items-center gap-2 pt-1 mt-1 border-t border-slate-100">
                <span className="text-[11px] font-semibold text-slate-700 tabular-nums w-32 truncate">{r.period} (ปัจจุบัน)</span>
                <div className="flex-1 h-1.5 bg-slate-100 rounded overflow-hidden">
                  <div
                    className={`h-full ${
                      scoreCalc.percent >= 80 ? "bg-emerald-500" :
                      scoreCalc.percent >= 60 ? "bg-amber-500" : "bg-rose-500"
                    }`}
                    style={{ width: `${scoreCalc.percent}%` }}
                  />
                </div>
                <span className="text-[11px] font-semibold text-slate-900 tabular-nums w-12 text-right">
                  {Math.round(scoreCalc.percent)}%
                </span>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Fill/Review view (client) */}
      <ReportFillView
        reportId={id}
        reportTitle={r.template.name}
        status={status}
        approverName={session.user.name ?? ""}
        approverRank={session.user.rank ?? null}
        canEdit={canEdit}
        canSubmit={canSubmit}
        canReview={canReview}
        canApprove={canApprove}
        canDelete={canDelete}
        items={r.template.items.map((it) => ({
          id: it.id,
          code: it.code,
          category: it.category,
          question: it.question,
          weight: it.weight,
          evidenceRequired: it.evidenceRequired,
        }))}
        answers={r.answers.map((a) => ({
          itemId: a.itemId,
          answer: a.answer,
          selfScore: a.selfScore,
          reviewerScore: a.reviewerScore,
          evidenceDoc: a.evidenceDoc
            ? { id: a.evidenceDoc.id, name: a.evidenceDoc.originalName }
            : null,
          answeredBy: a.answeredBy ? { name: a.answeredBy.name } : null,
        }))}
        linkedKpis={linkedKpis.map((k) => ({
          code: k.code,
          name: k.name,
          target: k.target,
          actual: k.actual,
          unit: k.unit,
          status: k.status ?? "yellow",
        }))}
      />
    </div>
  );
}

function Meta({ icon, label, value }: { icon: React.ReactNode; label: string; value: React.ReactNode }) {
  return (
    <div className="flex items-start gap-2">
      <div className="text-slate-400 mt-0.5 h-4 w-4">{icon}</div>
      <div className="flex-1 min-w-0">
        <div className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider">{label}</div>
        <div className="text-sm text-slate-800 truncate">{value}</div>
      </div>
    </div>
  );
}
