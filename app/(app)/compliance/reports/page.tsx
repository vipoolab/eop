// Compliance Reports — TOR 5.4.3 ๓.๑
// Real DB-driven list of reports

import Link from "next/link";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { PageHeader } from "@/components/page-header";
import {
  ShieldCheck,
  Plus,
  CheckCircle2,
  Clock,
  ExternalLink,
} from "lucide-react";
import {
  STANDARD_LABELS,
  STANDARD_COLORS,
  STATUS_LABELS,
  STATUS_COLORS,
  URGENCY_COLORS,
  getDeadlineUrgency,
  type ComplianceStandard,
  type ReportStatus,
} from "@/features/compliance/types";

export const dynamic = "force-dynamic";

type Role = "ADMIN" | "COMMANDER" | "STAFF" | "AUDITOR" | "VIEWER";

export default async function ComplianceReportsPage() {
  const session = await auth();
  if (!session?.user) redirect("/login");

  const role = session.user.role as Role;
  const canCreate = ["ADMIN", "COMMANDER", "STAFF"].includes(role);

  const reports = await prisma.complianceReport.findMany({
    orderBy: { createdAt: "desc" },
    take: 100,
    include: {
      template: {
        select: { code: true, name: true, standard: true, items: { select: { id: true } } },
      },
      unit: { select: { code: true, name: true } },
      createdBy: { select: { name: true, rank: true } },
      reviewer: { select: { name: true, rank: true } },
      _count: { select: { answers: true } },
    },
  });

  const stats = {
    total: reports.length,
    draft: reports.filter((r) => r.status === "DRAFT").length,
    submitted: reports.filter((r) => r.status === "SUBMITTED").length,
    approved: reports.filter((r) => r.status === "APPROVED").length,
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      <PageHeader
        icon={ShieldCheck}
        eyebrow="Compliance · ก.พ.ร./ITA/PMQA"
        title="รายงานการประเมินมาตรฐานราชการ"
        description={`รายงาน ${reports.length} ฉบับ — ติดตามผลการประเมินตามมาตรฐาน 4 แบบ`}
        actions={
          canCreate ? (
            <Link
              href="/compliance/reports/new"
              className="inline-flex items-center gap-2 rounded-lg bg-[#1e3a5f] px-4 py-2 text-sm font-semibold text-white hover:bg-[#142a45] transition-colors border border-[#142a45]"
            >
              <Plus className="h-4 w-4" />
              สร้างรายงานใหม่
            </Link>
          ) : null
        }
      />

      {/* Stats */}
      <div className="grid grid-cols-4 gap-3">
        <StatCard label="ทั้งหมด" value={stats.total} accent="slate" />
        <StatCard label="ร่าง" value={stats.draft} accent="slate" />
        <StatCard label="ส่ง Reviewer" value={stats.submitted} accent="blue" />
        <StatCard label="อนุมัติส่ง" value={stats.approved} accent="emerald" />
      </div>

      {reports.length === 0 ? (
        <div className="rounded-xl border border-slate-200 bg-white p-12 text-center">
          <ShieldCheck className="h-10 w-10 text-slate-300 mx-auto mb-3" />
          <p className="text-sm text-slate-500 mb-3">ยังไม่มีรายงานในระบบ</p>
          {canCreate && (
            <Link
              href="/compliance/reports/new"
              className="inline-flex items-center gap-2 text-sm text-blue-600 hover:text-blue-800 font-medium"
            >
              <Plus className="h-4 w-4" />
              สร้างรายงานแรก
            </Link>
          )}
        </div>
      ) : (
        <div className="space-y-3">
          {reports.map((r) => {
            const std = r.template.standard as ComplianceStandard;
            const status = r.status as ReportStatus;
            const totalItems = r.template.items.length;
            const answeredItems = r._count.answers;
            const progress = totalItems > 0 ? Math.round((answeredItems / totalItems) * 100) : 0;
            const percent = r.score && r.maxScore ? Math.round((r.score / r.maxScore) * 100) : 0;
            const deadline = getDeadlineUrgency(r.dueDate);
            return (
              <Link
                key={r.id}
                href={`/compliance/reports/${r.id}`}
                className="block rounded-sm border border-slate-200 bg-white p-5 hover:border-slate-300 hover:shadow-sm transition-all"
              >
                <div className="flex items-start justify-between gap-3 mb-2 flex-wrap">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className={`text-[10px] px-1.5 py-0.5 rounded border font-semibold ${STANDARD_COLORS[std]}`}>
                      {STANDARD_LABELS[std]}
                    </span>
                    <span className="font-mono text-[11px] text-slate-500">
                      {r.template.code}
                    </span>
                    <span className={`text-[10px] px-1.5 py-0.5 rounded border font-semibold ${STATUS_COLORS[status]}`}>
                      {STATUS_LABELS[status]}
                    </span>
                    {r.externallySubmittedAt && (
                      <span className="inline-flex items-center gap-1 text-[10px] px-1.5 py-0.5 rounded bg-violet-50 text-violet-700 border border-violet-200">
                        <ExternalLink className="h-2.5 w-2.5" />
                        ส่งหน่วยประเมินแล้ว
                      </span>
                    )}
                    {deadline.urgency !== "none" && status !== "APPROVED" && (
                      <span
                        className={`inline-flex items-center gap-1 text-[10px] px-1.5 py-0.5 rounded border font-semibold ${URGENCY_COLORS[deadline.urgency]}`}
                        title={r.dueDate ? `ครบกำหนด ${new Date(r.dueDate).toLocaleDateString("th-TH")}` : ""}
                      >
                        ⏰ {deadline.label}
                      </span>
                    )}
                  </div>
                  <div className="text-right">
                    <div className="text-2xl font-bold tabular-nums text-slate-900">
                      {percent}%
                    </div>
                    <div className="text-[10px] text-slate-500">คะแนนรวม</div>
                  </div>
                </div>

                <h3 className="text-base font-semibold text-slate-900 mb-1">
                  {r.template.name}
                </h3>
                <div className="text-xs text-slate-600 mb-3">
                  ช่วง: {r.period}
                  {r.unit && ` · ${r.unit.code} ${r.unit.name}`}
                </div>

                <div className="flex items-center gap-2">
                  <div className="flex-1 h-1.5 bg-slate-100 rounded-sm overflow-hidden">
                    <div
                      className={`h-full rounded-sm transition-all ${
                        progress === 100 ? "bg-emerald-500" : progress >= 50 ? "bg-amber-500" : "bg-slate-400"
                      }`}
                      style={{ width: `${progress}%` }}
                    />
                  </div>
                  <span className="text-[11px] text-slate-500 tabular-nums whitespace-nowrap">
                    กรอก {answeredItems}/{totalItems} ข้อ
                  </span>
                </div>

                <div className="flex items-center gap-3 mt-2 text-[11px] text-slate-500 flex-wrap">
                  {r.createdBy && (
                    <span>สร้างโดย {r.createdBy.rank} {r.createdBy.name}</span>
                  )}
                  {r.reviewer && (
                    <span className="inline-flex items-center gap-1">
                      <CheckCircle2 className="h-3 w-3 text-emerald-600" />
                      ตรวจโดย {r.reviewer.rank} {r.reviewer.name}
                    </span>
                  )}
                  <span className="inline-flex items-center gap-1 ml-auto">
                    <Clock className="h-3 w-3" />
                    {new Date(r.createdAt).toLocaleDateString("th-TH", {
                      day: "numeric", month: "short", year: "2-digit",
                    })}
                  </span>
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}

const STAT_COLORS = {
  slate: "bg-slate-50 text-slate-700 border-slate-200",
  blue: "bg-blue-50 text-blue-700 border-blue-200",
  amber: "bg-amber-50 text-amber-700 border-amber-200",
  emerald: "bg-emerald-50 text-emerald-700 border-emerald-200",
} as const;

function StatCard({ label, value, accent }: { label: string; value: number; accent: keyof typeof STAT_COLORS }) {
  return (
    <div className={`rounded-sm border ${STAT_COLORS[accent]} p-3`}>
      <div className="text-[11px] font-semibold uppercase tracking-wider opacity-80">{label}</div>
      <div className="text-2xl font-semibold tabular-nums mt-1">{value}</div>
    </div>
  );
}
