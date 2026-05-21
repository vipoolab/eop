// /data/operations/quality — Data Quality Rules + Checks (TOR 8.10.2)

import Link from "next/link";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { PageHeader } from "@/components/page-header";
import {
  ShieldCheck,
  ArrowLeft,
  CheckCircle2,
  XCircle,
  AlertTriangle,
} from "lucide-react";

export const dynamic = "force-dynamic";

const RULE_LABEL: Record<string, string> = {
  NOT_NULL: "ห้ามว่าง",
  UNIQUE: "ไม่ซ้ำ",
  REGEX: "Pattern",
  RANGE: "ช่วงค่า",
  REFERENCE: "อ้างอิงตาราง",
};

const SEVERITY_COLORS: Record<string, string> = {
  ERROR: "bg-rose-100 text-rose-700 border-rose-200",
  WARNING: "bg-amber-100 text-amber-700 border-amber-200",
  INFO: "bg-blue-100 text-blue-700 border-blue-200",
};

export default async function DataQualityPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");
  if (session.user.role !== "ADMIN") redirect("/");

  const rules = await prisma.dataQualityRule.findMany({
    orderBy: [{ active: "desc" }, { targetTable: "asc" }],
    include: {
      _count: { select: { checks: true } },
      checks: {
        orderBy: { checkedAt: "desc" },
        take: 1,
        select: {
          passed: true,
          failureCount: true,
          checkedAt: true,
        },
      },
    },
  });

  const recentChecks = await prisma.dataQualityCheck.findMany({
    orderBy: { checkedAt: "desc" },
    take: 20,
    include: { rule: { select: { name: true, targetTable: true, severity: true } } },
  });

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      <Link
        href="/data/operations"
        className="inline-flex items-center gap-1 text-sm text-slate-600 hover:text-slate-900"
      >
        <ArrowLeft className="h-4 w-4" />
        กลับยัง Data Operations
      </Link>

      <PageHeader
        icon={ShieldCheck}
        eyebrow="Data Operations · Quality"
        title="Data Quality"
        description="กฎตรวจคุณภาพข้อมูล + ผลการตรวจอัตโนมัติ — TOR 8.10.2"
      />

      {/* Rules section */}
      <div>
        <h2 className="text-sm font-semibold text-slate-700 uppercase tracking-wider mb-3">
          กฎตรวจคุณภาพ ({rules.length})
        </h2>
        {rules.length === 0 ? (
          <div className="rounded-xl border border-dashed border-slate-300 bg-slate-50 p-8 text-center">
            <ShieldCheck className="h-8 w-8 text-slate-300 mx-auto mb-2" />
            <p className="text-sm text-slate-500">ยังไม่มีกฎตรวจ</p>
          </div>
        ) : (
          <div className="space-y-2">
            {rules.map((r) => {
              const lastCheck = r.checks[0];
              return (
                <div
                  key={r.id}
                  className={`rounded-lg border ${r.active ? "border-slate-200 bg-white" : "border-slate-200 bg-slate-50 opacity-60"} p-3`}
                >
                  <div className="flex items-center gap-3 flex-wrap mb-1">
                    <span className="text-sm font-semibold text-slate-900">{r.name}</span>
                    <span
                      className={`text-[10px] px-1.5 py-0.5 rounded border font-semibold ${SEVERITY_COLORS[r.severity] ?? "bg-slate-100 text-slate-700"}`}
                    >
                      {r.severity}
                    </span>
                    <span className="text-[10px] px-1.5 py-0.5 rounded bg-violet-50 text-violet-700">
                      {RULE_LABEL[r.ruleType] ?? r.ruleType}
                    </span>
                    <span className="text-[11px] text-slate-500 font-mono">
                      {r.targetTable}
                    </span>
                  </div>
                  <code className="text-[10px] text-slate-600 bg-slate-50 px-2 py-1 rounded block mt-1 font-mono">
                    {r.ruleExpression}
                  </code>
                  {lastCheck && (
                    <div className="mt-2 flex items-center gap-2 text-[11px]">
                      {lastCheck.passed ? (
                        <span className="text-emerald-700 inline-flex items-center gap-1">
                          <CheckCircle2 className="h-3 w-3" />
                          ผ่าน
                        </span>
                      ) : (
                        <span className="text-rose-700 inline-flex items-center gap-1">
                          <XCircle className="h-3 w-3" />
                          ล้มเหลว {lastCheck.failureCount} แถว
                        </span>
                      )}
                      <span className="text-slate-500">
                        {new Date(lastCheck.checkedAt).toLocaleString("th-TH", {
                          dateStyle: "short",
                          timeStyle: "short",
                        })}
                      </span>
                      <span className="text-slate-400">
                        · ตรวจแล้ว {r._count.checks} ครั้ง
                      </span>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Recent checks */}
      {recentChecks.length > 0 && (
        <div>
          <h2 className="text-sm font-semibold text-slate-700 uppercase tracking-wider mb-3">
            ผลการตรวจล่าสุด ({recentChecks.length})
          </h2>
          <div className="space-y-1">
            {recentChecks.map((c) => (
              <div
                key={c.id}
                className={`rounded-md border p-2 flex items-center gap-2 ${c.passed ? "border-emerald-200 bg-emerald-50/30" : "border-rose-200 bg-rose-50/30"}`}
              >
                {c.passed ? (
                  <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
                ) : (
                  <AlertTriangle className="h-4 w-4 text-rose-600 shrink-0" />
                )}
                <span className="text-[12px] flex-1 truncate">
                  {c.rule.name} · {c.rule.targetTable}
                </span>
                {!c.passed && (
                  <span className="text-[11px] text-rose-700 font-semibold">
                    {c.failureCount} แถว
                  </span>
                )}
                <span className="text-[10px] text-slate-500 tabular-nums">
                  {new Date(c.checkedAt).toLocaleString("th-TH", {
                    dateStyle: "short",
                    timeStyle: "short",
                  })}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
